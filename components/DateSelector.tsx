"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils";

const EVENT_DATES = [
    "2024-02-13",
    "2024-02-14",
    "2024-02-15",
];

export const DateSelector: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentDate = searchParams.get("date") || EVENT_DATES[0];

    const handleDateChange = (date: string) => {
        router.push(`/?date=${date}`);
    };

    return (
        <div className="flex gap-4 justify-center mb-8">
            {EVENT_DATES.map((date) => (
                <button
                    key={date}
                    onClick={() => handleDateChange(date)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${currentDate === date
                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    {formatDate(date)}
                </button>
            ))}
        </div>
    );
};
