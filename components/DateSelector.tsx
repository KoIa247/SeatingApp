"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const EVENT_DATES = [
    { label: "Day 1 (Feb 13)", value: "2024-02-13" },
    { label: "Day 2 (Feb 14)", value: "2024-02-14" },
    { label: "Day 3 (Feb 15)", value: "2024-02-15" },
];

export const DateSelector: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentDate = searchParams.get("date") || EVENT_DATES[0].value;

    const handleDateChange = (date: string) => {
        router.push(`/?date=${date}`);
    };

    return (
        <div className="flex gap-4 justify-center mb-8">
            {EVENT_DATES.map((date) => (
                <button
                    key={date.value}
                    onClick={() => handleDateChange(date.value)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${currentDate === date.value
                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    {date.label}
                </button>
            ))}
        </div>
    );
};
