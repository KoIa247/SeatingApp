"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export const TIME_SLOTS = [
    "11:00 AM",
    "1:00 PM",
    "3:00 PM",
    "5:00 PM",
    "7:00 PM",
    "9:00 PM"
];

export const TimeSelector = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTime = searchParams.get("time") || "11:00 AM";

    const handleTimeChange = (time: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("time", time);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
            {TIME_SLOTS.map((time) => (
                <button
                    key={time}
                    onClick={() => handleTimeChange(time)}
                    className={`
                        px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap
                        ${currentTime === time
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"}
                    `}
                >
                    {time}
                </button>
            ))}
        </div>
    );
};
