"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { assignMultipleSeats, getBookings, bulkImportBookings, deleteAllBookings } from "@/app/actions";
import { DEFAULT_ROLE, SeatRole } from "@/lib/constants";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, currentDate, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [previewGroups, setPreviewGroups] = useState<any>(null); // For storing parsed data before confirmation

    if (!isOpen) return null;

    const parseProductString = (product: string) => {
        // Example: "NEW YORK FASHION WEEK TICKETS FEBRUARY 14TH 1PM - Row 5 Right: $199"
        // GA Example: "FEBRUARY 14TH 3PM - General Admission"
        // VIP Example: "FEBRUARY 14TH 7PM - VIP Left Table"

        const p = product.toUpperCase();

        // 1. DATE
        const dateMatch = p.match(/FEBRUARY\s+(\d+)(ST|ND|RD|TH)?/i);
        let parsedDate = currentDate;
        if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            parsedDate = `2024-02-${day}`;
        }

        // 2. TIME
        const timeMatch = p.match(/(\d+)(AM|PM)/i);
        let parsedTime = "11:00 AM";
        if (timeMatch) {
            parsedTime = `${timeMatch[1]}:00 ${timeMatch[2]}`;
        }

        // 3. SEAT TYPE & SECTION
        let type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP" = "GENERAL";
        let targetSide = "GA"; // Default to GA
        let targetSection = 0; // For L/R rows

        if (p.includes("GENERAL ADMISSION")) {
            type = "GENERAL";
            targetSide = "GA";
        } else if (p.includes("VIP")) {
            type = "VIP";
            if (p.includes("LEFT")) targetSide = "VL";
            else targetSide = "VR";
        } else {
            // Standard Rows: Look for "Row X Right" or "Right Row X"
            // The regex needs to be flexible.
            const sectionNumMatch = p.match(/ROW\s+(\d+)/i);

            if (p.includes("RIGHT")) {
                type = "RIGHT_ROW";
                targetSide = "R";
            } else if (p.includes("LEFT")) {
                type = "LEFT_ROW";
                targetSide = "L";
            } else {
                // Fallback if direction missing but Row present? Assume General?
                type = "GENERAL";
                targetSide = "GA";
            }

            if (type !== "GENERAL" && sectionNumMatch) {
                targetSection = parseInt(sectionNumMatch[1]);
            }
        }

        return {
            date: parsedDate,
            time: parsedTime,
            type,
            side: targetSide,
            section: targetSection
        };
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const groups: any = {};

            data.forEach((row: any) => {
                // Robust key finding to handle casing, whitespace, and newlines (e.g., "OrderNumb\ner")
                const keys = Object.keys(row);

                const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s\n\r]+/g, "");

                const customerKey = keys.find(k => normalizeKey(k) === "customer") || "Customer";
                const productKey = keys.find(k => normalizeKey(k) === "product") || "Product";
                const quantityKey = keys.find(k => normalizeKey(k) === "quantity") || "Quantity";
                // OrderNumber might be split like "OrderNumb\ner"
                const orderKey = keys.find(k => normalizeKey(k) === "ordernumber") || "OrderNumber";

                const customer = row[customerKey];
                const product = row[productKey];
                const orderId = row[orderKey];
                const qty = parseInt(row[quantityKey] || "1");

                if (!product || !customer) return;

                const info = parseProductString(product);
                const key = `${info.date}|${info.time}`;

                if (!groups[key]) groups[key] = { date: info.date, time: info.time, requests: [] };
                groups[key].requests.push({ customer, qty, info, orderId });
            });

            // Instead of processing, set preview to prompt user
            setPreviewGroups(groups);
            setUploading(false);
            e.target.value = ""; // Reset input
        };
        reader.readAsBinaryString(file);
    };

    const getRoleForType = (type: string): SeatRole => {
        if (type === "GENERAL") return "GA Tickets Sales";
        if (type === "VIP") return "VIP TABLE";
        return "Row Tickets Sales";
    };

    const createAssignment = (seatId: string, type: string, customer: string, date: string, time: string, r: number, c: number, orderId?: string) => ({
        seatNumber: seatId,
        seatType: type,
        customerName: customer,
        role: getRoleForType(type),
        eventDate: date,
        eventTime: time,
        row: r,
        col: c,
        orderId: orderId
    });

    const handleConfirmImport = async () => {
        if (!previewGroups) return;
        setUploading(true);

        try {
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;

            for (const key in previewGroups) {
                const g = previewGroups[key];

                // Fetch existing bookings to check for duplicates or occupied seats
                const existing = await getBookings(g.date, g.time);

                // DATA PREPARATION & DEDUPLICATION
                let requestsToProcess = g.requests;
                // Check if we have OrderNumbers to perform smart deduplication
                const hasOrderNumbers = g.requests.some((r: any) => !!r.orderId);

                if (hasOrderNumbers) {
                    // Smart Mode: Filter out requests that already exist based on OrderID
                    // Normalize both to strings to ensure "123" == 123 matches
                    const existingOrderIds = new Set(
                        existing.map((b: any) => b.orderId ? String(b.orderId).trim() : null).filter(Boolean)
                    );

                    console.log("Existing Order IDs in DB:", Array.from(existingOrderIds));

                    const initialLength = requestsToProcess.length;
                    requestsToProcess = requestsToProcess.filter((r: any) => {
                        if (!r.orderId) return true; // Keep if no ID? Or skip? Assuming keep if manually added without ID.
                        const orderIdStr = String(r.orderId).trim();
                        const isDuplicate = existingOrderIds.has(orderIdStr);
                        if (isDuplicate) {
                            console.log(`Skipping Duplicate Order: ${orderIdStr} for ${r.customer}`);
                        }
                        return !isDuplicate;
                    });
                    skippedCount += (initialLength - requestsToProcess.length);
                }

                // If nothing new to process after dedup
                if (requestsToProcess.length === 0) continue;

                // Calculate occupied set for allocation (always additive now)
                const occupiedSet = new Set(existing.map((b: any) => b.seatNumber));
                const newAssignments: any[] = [];

                requestsToProcess.forEach((req: any) => {
                    const { type, side, section } = req.info;
                    let allocated = 0;

                    // ALLOCATOR LOGIC
                    if (type === "GENERAL") {
                        for (let r = 1; r <= 20; r++) {
                            if (allocated >= req.qty) break;
                            for (let c = 1; c <= 5; c++) {
                                if (allocated >= req.qty) break;
                                const seatId = `GA-${r}-${c}`;
                                if (!occupiedSet.has(seatId)) {
                                    occupiedSet.add(seatId);
                                    newAssignments.push(createAssignment(seatId, type, req.customer, g.date, g.time, r, c, req.orderId));
                                    allocated++;
                                }
                            }
                        }
                    } else if (type === "VIP") {
                        for (let r = 1; r <= 30; r++) {
                            if (allocated >= req.qty) break;
                            for (let c = 1; c <= 2; c++) {
                                if (allocated >= req.qty) break;
                                const seatId = `${side}-${r}-${c}`;
                                if (!occupiedSet.has(seatId)) {
                                    occupiedSet.add(seatId);
                                    newAssignments.push(createAssignment(seatId, type, req.customer, g.date, g.time, r, c, req.orderId));
                                    allocated++;
                                }
                            }
                        }
                    } else {
                        const SECTION_LENGTHS: Record<number, number> = { 5: 15, 4: 20, 3: 25, 2: 30, 1: 30 };
                        const maxRows = SECTION_LENGTHS[section] || 20;

                        for (let r = 1; r <= maxRows; r++) {
                            if (allocated >= req.qty) break;
                            const seatId = `${side}-${section}-${r}`;
                            if (!occupiedSet.has(seatId)) {
                                occupiedSet.add(seatId);
                                newAssignments.push(createAssignment(seatId, type, req.customer, g.date, g.time, r, section, req.orderId));
                                allocated++;
                            }
                        }
                    }

                    if (allocated < req.qty) {
                        console.warn(`Capacity Reached: Could not fulfill ${req.qty} for ${req.customer}`);
                        failCount++;
                    } else {
                        successCount++;
                    }
                });

                if (newAssignments.length > 0) {
                    await bulkImportBookings(newAssignments);
                }
            }
            toast.success(`Import Complete. Added: ${successCount}, Skipped: ${skippedCount}, Failed/Full: ${failCount}`);
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Import failed");
        } finally {
            setUploading(false);
            setPreviewGroups(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full">
                <h2 className="text-xl font-bold text-white mb-4">Import Excel</h2>

                {!previewGroups ? (
                    <>
                        <p className="text-slate-400 mb-6 text-sm">
                            Upload an .xlsx file with columns: <b>Customer</b>, <b>Product</b>, <b>Quantity</b>.
                        </p>

                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-violet-600 file:text-white
                                hover:file:bg-violet-500
                            "
                        />
                        <div className="mt-6 flex justify-end">
                            <button onClick={onClose} className="text-slate-400 hover:text-white font-medium">Cancel</button>
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                        <h3 className="text-violet-400 font-bold mb-2">
                            ℹ️ Import Summary
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Found <b>{Object.keys(previewGroups).length} events</b> in the file.
                            <br /><br />
                            {Object.values(previewGroups).some((g: any) => g.requests.some((r: any) => !!r.orderId))
                                ? <span><b>Smart Merge Mode:</b> Order Numbers detected. Distinct orders will be added. Duplicates will be skipped.</span>
                                : <span><b>Append Mode:</b> No Order Numbers found. All valid rows will be added as new bookings. (No data will be deleted).</span>
                            }
                        </p>

                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-4 bg-black/20 p-2 rounded">
                            {Object.values(previewGroups).map((g: any) => (
                                <div key={`${g.date}-${g.time}`} className="text-xs text-slate-300">
                                    • {g.date} @ {g.time} ({g.requests.length} requests)
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setPreviewGroups(null)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={uploading}
                                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
                            >
                                {uploading ? "Importing..." : "Confirm Import"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
