"use client";

import React, { useState, useEffect } from "react";
import { getAllBookings } from "@/app/actions";
import { MapVisual } from "./MapVisual";
import { Booking } from "@/lib/types";
import { TIME_SLOTS } from "./TimeSelector";
import { formatDate } from "@/lib/utils";

const DATES = ["2024-02-13", "2024-02-14", "2024-02-15"];

export const EventOverview = () => {
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");

    useEffect(() => {
        const fetchAll = async () => {
            const data = await getAllBookings();
            setAllBookings(data as any);
            setLoading(false);
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    const filteredDates = selectedDateFilter === "ALL" ? DATES : [selectedDateFilter];

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Event Comparison Overview</h2>

                <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
                    <button
                        onClick={() => setSelectedDateFilter("ALL")}
                        className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${selectedDateFilter === "ALL" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                        ALL DAYS
                    </button>
                    {DATES.map(date => (
                        <button
                            key={date}
                            onClick={() => setSelectedDateFilter(date)}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${selectedDateFilter === date ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                            {formatDate(date)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredDates.map(date => (
                    <React.Fragment key={date}>
                        {TIME_SLOTS.map(time => {
                            const showBookings = allBookings.filter(b => b.eventDate === date && b.eventTime === time);
                            return (
                                <div key={`${date}-${time}`} className="bg-slate-900/40 border border-slate-800 rounded-xl sm:rounded-3xl p-2 sm:p-6 flex flex-col items-center">
                                    <div className="w-full flex justify-between items-center mb-4 sm:mb-6">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-black text-white">{formatDate(date)}</h3>
                                            <p className="text-violet-400 font-bold text-sm sm:text-base">{time}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase">Occupancy</p>
                                            <p className="text-lg sm:text-xl font-mono text-emerald-400 font-black">{showBookings.length}</p>
                                        </div>
                                    </div>

                                    <div className="w-full overflow-hidden bg-black/20 rounded-lg sm:rounded-2xl border border-slate-800/50">
                                        <div className="origin-top flex justify-center">
                                            <MapVisual bookings={showBookings} isSmall={true} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
