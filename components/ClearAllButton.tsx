"use client";

import { deleteAllBookings } from "@/app/actions";
import { useState } from "react";
import { toast } from "sonner";

export const ClearAllButton = ({ eventDate, eventTime }: { eventDate: string; eventTime: string }) => {
    const [loading, setLoading] = useState(false);

    const handleClearAll = async () => {
        if (confirm(`⚠ WARNING: Are you sure you want to delete ALL bookings for ${eventDate} at ${eventTime}? This action cannot be undone.`)) {
            setLoading(true);
            const result = await deleteAllBookings(eventDate, eventTime);
            setLoading(false);

            if (result.success) {
                toast.success("All bookings cleared for this time slot");
            } else {
                toast.error("Failed to clear bookings");
            }
        }
    };

    return (
        <button
            onClick={handleClearAll}
            disabled={loading}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 hover:border-red-500 rounded-lg transition-all text-sm font-bold flex items-center gap-2"
        >
            {loading ? "Clearing..." : "Reset / Clear All Seats"}
        </button>
    );
};
