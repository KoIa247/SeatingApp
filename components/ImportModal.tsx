"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getBookings, bulkImportBookings } from "@/app/actions";
import { parseProductString, calculateAssignments } from "@/lib/importer";

import { formatDate } from "@/lib/utils";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, currentDate, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [previewGroups, setPreviewGroups] = useState<any>(null);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

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

                setPreviewGroups(groups);
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse file");
            } finally {
                setUploading(false);
                e.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        if (!previewGroups) return;
        setUploading(true);

        try {
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;

            for (const key in previewGroups) {
                const g = previewGroups[key];
                const existing = await getBookings(g.date, g.time);

                const { newAssignments, successCount: gSuccess, skippedCount: gSkipped, failCount: gFail } = calculateAssignments(g.requests, existing);

                successCount += gSuccess;
                skippedCount += gSkipped;
                failCount += gFail;

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
                            Import Summary
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
                                    • {formatDate(g.date)} @ {g.time} ({g.requests.length} requests)
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
