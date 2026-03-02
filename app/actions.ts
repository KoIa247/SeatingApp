"use server";

import clientPromise from "@/lib/mongo";
import { revalidatePath } from "next/cache";
import { parseProductString, calculateAssignments } from "@/lib/importer";
import * as XLSX from "xlsx";
import { getVariationStock, decrementVariationStock } from "@/lib/woocommerce";
import { resolveVariation } from "@/lib/stockMapping";

// We don't strictly need to export Booking from here if we use lib/types, 
// but we can keep the implementation focusing on logic.

export async function getBookings(eventDate: string, eventTime: string = "11:00 AM") {
    try {
        const client = await clientPromise;
        const bookings = await client.db().collection("Booking").find({ eventDate, eventTime }).toArray();

        // Transform _id to string string id
        return bookings.map(b => ({
            id: b._id.toString(),
            seatNumber: b.seatNumber,
            customerName: b.customerName,
            seatType: b.seatType,
            eventDate: b.eventDate,
            eventTime: b.eventTime,
            orderId: b.orderId,
            role: b.role,
            row: b.row,
            col: b.col,
            createdAt: b.createdAt || new Date(),
            updatedAt: b.updatedAt || new Date()
        }));
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return [];
    }
}

export async function assignSeat(
    seatNumber: string,
    customerName: string,
    seatType: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP",
    eventDate: string,
    role: string,
    eventTime: string,
    row?: number,
    col?: number,
    orderId?: string
) {
    try {
        const client = await clientPromise;
        const collection = client.db().collection("Booking");

        // Check if this seat is already assigned (edit mode, not new)
        const existingBooking = await collection.findOne({ seatNumber, eventDate, eventTime });
        const isNewAssignment = !existingBooking;
        let resolvedVariation: Awaited<ReturnType<typeof resolveVariation>> = null;

        // Only check & decrement stock for NEW seat assignments (not edits)
        if (isNewAssignment) {
            try {
                resolvedVariation = await resolveVariation(seatNumber, seatType, eventDate, eventTime);

                if (resolvedVariation) {
                    const { stockQuantity, manageStock } = await getVariationStock(
                        resolvedVariation.productId,
                        resolvedVariation.variationId
                    );

                    if (manageStock && (stockQuantity === null || stockQuantity <= 0)) {
                        return {
                            success: false,
                            error: `Out of stock for ${resolvedVariation.ticketType}. No seats available in WooCommerce.`,
                        };
                    }
                }
            } catch (wcError) {
                console.error("WooCommerce stock check failed, proceeding with seat assignment:", wcError);
                // Continue with assignment — don't block if WC is unreachable
            }
        }

        // Upsert the booking in MongoDB
        await collection.updateOne(
            { seatNumber, eventDate, eventTime },
            {
                $set: {
                    customerName,
                    seatType,
                    role,
                    eventTime,
                    orderId,
                    row,
                    col,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        // Decrement WooCommerce stock for new assignments
        if (isNewAssignment && resolvedVariation) {
            try {
                await decrementVariationStock(resolvedVariation.productId, resolvedVariation.variationId, 1);
            } catch (wcError) {
                console.error("Warning: Seat saved but WooCommerce stock update failed:", wcError);
            }
        }

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign seat:", error);
        const errMsg = error instanceof Error ? error.message : "Failed to assign seat";
        return { success: false, error: errMsg };
    }
}

export async function deleteBooking(seatNumber: string, eventDate: string, eventTime: string) {
    try {
        const client = await clientPromise;
        await client.db().collection("Booking").deleteOne({ seatNumber, eventDate, eventTime });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete booking:", error);
        return { success: false, error: "Failed to delete booking" };
    }
}

export async function deleteAllBookings(eventDate: string, eventTime: string) {
    try {
        const client = await clientPromise;
        await client.db().collection("Booking").deleteMany({ eventDate, eventTime });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete all bookings:", error);
        return { success: false, error: "Failed to delete all bookings" };
    }
}

export async function assignMultipleSeats(
    assignments: { seatNumber: string; type: string; row?: number; col?: number }[],
    customerName: string,
    role: string,
    eventDate: string,
    eventTime: string
) {
    try {
        // Group assignments by ticket type to batch-check stock
        const stockNeeded = new Map<string, { count: number; productId: number; variationId: number; ticketType: string }>();
        let wcAvailable = true;

        try {
            for (const a of assignments) {
                const variation = await resolveVariation(
                    a.seatNumber,
                    a.type as "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP",
                    eventDate,
                    eventTime
                );
                if (variation) {
                    const key = `${variation.productId}-${variation.variationId}`;
                    const existing = stockNeeded.get(key);
                    if (existing) {
                        existing.count += 1;
                    } else {
                        stockNeeded.set(key, { count: 1, ...variation });
                    }
                }
            }

            // Check stock availability for each variation group
            for (const [, entry] of stockNeeded) {
                const { stockQuantity, manageStock } = await getVariationStock(entry.productId, entry.variationId);
                if (manageStock && (stockQuantity === null || stockQuantity < entry.count)) {
                    return {
                        success: false,
                        error: `Not enough stock for ${entry.ticketType}. Need ${entry.count}, available: ${stockQuantity ?? 0}.`,
                    };
                }
            }
        } catch (wcError) {
            console.error("WooCommerce stock check failed, proceeding with seat assignment anyway:", wcError);
            wcAvailable = false;
        }

        // Create the bookings in MongoDB
        const client = await clientPromise;
        const collection = client.db().collection("Booking");
        const operations = assignments.map(a => ({
            updateOne: {
                filter: { seatNumber: a.seatNumber, eventDate, eventTime },
                update: {
                    $set: {
                        customerName,
                        seatType: a.type,
                        role,
                        eventTime,
                        row: a.row,
                        col: a.col,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await collection.bulkWrite(operations);
        }

        // Decrement WooCommerce stock for each variation group
        if (wcAvailable) {
            for (const [, entry] of stockNeeded) {
                try {
                    await decrementVariationStock(entry.productId, entry.variationId, entry.count);
                } catch (wcError) {
                    console.error(`Warning: Seats saved but stock decrement failed for ${entry.ticketType}:`, wcError);
                }
            }
        }

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign multiple seats:", error);
        const errMsg = error instanceof Error ? error.message : "Failed to assign multiple seats";
        return { success: false, error: errMsg };
    }
}

export async function getAllBookings() {
    try {
        const client = await clientPromise;
        const bookings = await client.db().collection("Booking").find({}).toArray();

        return bookings.map(b => ({
            id: b._id.toString(),
            seatNumber: b.seatNumber,
            customerName: b.customerName,
            seatType: b.seatType,
            eventDate: b.eventDate,
            eventTime: b.eventTime,
            orderId: b.orderId,
            role: b.role,
            row: b.row,
            col: b.col,
            createdAt: b.createdAt || new Date(),
            updatedAt: b.updatedAt || new Date()
        }));
    } catch (error) {
        console.error("Failed to fetch all bookings:", error);
        return [];
    }
}

export async function bulkImportBookings(
    bookings: {
        seatNumber: string;
        seatType: string;
        customerName: string;
        role: string;
        eventDate: string;
        eventTime: string;
        orderId?: string;
        row: number;
        col: number;
    }[]
) {
    try {
        const client = await clientPromise;
        const collection = client.db().collection("Booking");

        const operations = bookings.map(b => ({
            updateOne: {
                filter: { seatNumber: b.seatNumber, eventDate: b.eventDate, eventTime: b.eventTime },
                update: {
                    $set: {
                        customerName: b.customerName,
                        seatType: b.seatType,
                        role: b.role,
                        eventDate: b.eventDate,
                        eventTime: b.eventTime,
                        orderId: b.orderId,
                        row: b.row,
                        col: b.col,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await collection.bulkWrite(operations);
        }

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to bulk import bookings:", error);
        return { success: false, error: "Failed to bulk import bookings" };
    }
}

export async function syncGoogleSheet(currentDate: string) {
    try {
        const url = process.env.GOOGLE_SHEET_URL;
        if (!url) {
            return { success: false, error: "GOOGLE_SHEET_URL not configured in environment" };
        }

        // 1. Fetch CSV data
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch Google Sheet");

        const csvText = await response.text();

        // 2. Parse CSV using XLSX
        const workbook = XLSX.read(csvText, { type: "string" });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const groups: any = {};

        data.forEach((row: any) => {
            const keys = Object.keys(row);
            const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s\n\r]+/g, "");

            const customerKey = keys.find(k => normalizeKey(k) === "customer") || "Customer";
            const productKey = keys.find(k => normalizeKey(k) === "product") || "Product";
            const quantityKey = keys.find(k => normalizeKey(k) === "quantity") || "Quantity";
            const orderKey = keys.find(k => normalizeKey(k) === "ordernumber") || "OrderNumber";

            const customer = row[customerKey];
            const product = row[productKey];
            const orderId = row[orderKey];
            const qty = parseInt(row[quantityKey] || "1");

            if (!product || !customer) return;

            const info = parseProductString(product, currentDate);
            const key = `${info.date}|${info.time}`;

            if (!groups[key]) groups[key] = { date: info.date, time: info.time, requests: [] };
            groups[key].requests.push({ customer, qty, info, orderId });
        });

        // 3. Process groups (same logic as ImportModal)
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        for (const key in groups) {
            const g = groups[key];
            const existing = await getBookings(g.date, g.time);
            const { newAssignments, successCount: gSuccess, skippedCount: gSkipped, failCount: gFail } = calculateAssignments(g.requests, existing);

            successCount += gSuccess;
            skippedCount += gSkipped;
            failCount += gFail;

            if (newAssignments.length > 0) {
                await bulkImportBookings(newAssignments);
            }
        }

        revalidatePath("/");
        return {
            success: true,
            summary: `Sync Complete. Added: ${successCount}, Skipped: ${skippedCount}, Failed/Full: ${failCount}`
        };

    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, error: "Sync failed. Check console for details." };
    }
}
