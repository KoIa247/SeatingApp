"use client";

import { useState } from "react";
import { syncGoogleSheet } from "@/app/actions";
import { toast } from "sonner";

interface RefreshButtonProps {
    currentDate: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ currentDate }) => {
    const [loading, setLoading] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const result = await syncGoogleSheet(currentDate);
            if (result.success) {
                toast.success(result.summary || "Sync successful");
            } else {
                toast.error(result.error || "Sync failed");
            }
        } catch (error) {
            console.error("Refresh UI Error:", error);
            toast.error("An unexpected error occurred during refresh");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
            title="Refresh from Google Sheets"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {loading ? "Syncing..." : "Refresh Sales Info"}
        </button>
    );
};
