"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SHOW_TIMES, DEFAULT_DATE } from "@/lib/constants";

export const TimeSelector = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const date = searchParams.get("date") || DEFAULT_DATE;
    const availableTimes = SHOW_TIMES[date] || [];
    const currentTime = searchParams.get("time") || availableTimes[0] || "";

    const handleTimeChange = (time: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("time", time);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
            {availableTimes.map((time) => (
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
