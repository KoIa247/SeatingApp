"use server";

import clientPromise from "@/lib/mongo";
import { revalidatePath } from "next/cache";

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

        // Upsert manual equivalent
        await collection.updateOne(
            { seatNumber, eventDate, eventTime },
            {
                $set: {
                    customerName,
                    seatType,
                    role, // Save the role
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

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign seat:", error);
        return { success: false, error: "Failed to assign seat" };
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

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to assign multiple seats:", error);
        return { success: false, error: "Failed to assign multiple seats" };
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
