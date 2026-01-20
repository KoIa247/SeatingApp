"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { assignSeat } from "@/app/actions";
import { SEAT_ROLES, DEFAULT_ROLE, SeatRole } from "@/lib/constants";

interface SeatModalProps {
    isOpen: boolean;
    onClose: () => void;
    seatNumber?: string; // Optional (used for single)
    seatNumbers?: string[]; // Used for bulk
    seatType: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP";
    initialCustomerName?: string;
    initialRole?: SeatRole;
    onSave: (data?: any) => void; // Update signature to accept data object or void for generic usage
    onDelete: () => void;
    row?: number | null;
    col?: number | null;
    eventDate: string;
    eventTime: string;
}

export const SeatModal: React.FC<SeatModalProps> = ({
    isOpen,
    onClose,
    seatNumber,
    seatNumbers,
    seatType,
    initialCustomerName,
    initialRole,
    onSave,
    onDelete,
    row,
    col,
    eventDate,
    eventTime,
}) => {
    const isBulk = !!seatNumbers;
    const [customerName, setCustomerName] = useState(initialCustomerName || "");
    const [role, setRole] = useState<SeatRole>(initialRole || DEFAULT_ROLE);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setCustomerName(initialCustomerName || "");
        setRole(initialRole || DEFAULT_ROLE);
    }, [initialCustomerName, initialRole, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!customerName.trim()) return;
        setLoading(true);

        try {
            if (isBulk && seatNumbers) {
                onSave({ customerName, role });
                onClose();
            } else {
                // Single seat mode
                if (!seatNumber) return;

                const result = await assignSeat(
                    seatNumber,
                    customerName,
                    seatType,
                    eventDate,
                    role,
                    eventTime,
                    row ?? undefined,
                    col ?? undefined
                );

                if (result.success) {
                    onSave();
                    onClose();
                    toast.success("Seat assigned successfully");
                } else {
                    toast.error("Failed to assign seat");
                }
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to remove the assignment for ${seatNumber}?`)) {
            onDelete();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-4">
                    {isBulk ? `Assign ${seatNumbers?.length} Seats` : `Manage Seat ${seatNumber}`}
                </h2>
                <p className="text-slate-400 text-sm mb-6 relative z-10">{seatNumber} • {eventDate}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-600"
                            placeholder="Enter name..."
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Role / Category</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as SeatRole)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
                        >
                            {Object.keys(SEAT_ROLES).map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Assignment"}
                        </button>
                        {!isBulk && initialCustomerName && (
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="bg-red-950/50 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 rounded-lg font-medium transition-all"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
