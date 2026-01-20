"use client";

import React from "react";
import { Seat } from "./Seat";
import { Booking } from "@/lib/types";
import { SEAT_ROLES, SeatRole } from "@/lib/constants";

interface MapVisualProps {
    bookings: Booking[];
    isSmall?: boolean;
}

export const MapVisual: React.FC<MapVisualProps> = ({ bookings, isSmall = false }) => {
    const getBooking = (seatId: string) =>
        bookings.find((b) => b.seatNumber === seatId);

    const SECTION_LENGTHS: Record<number, number> = {
        5: 15,
        4: 20,
        3: 25,
        2: 30,
        1: 30,
    };

    const getOccupiedCount = (prefix: string, sectionNum: number, rows: number) => {
        let count = 0;
        for (let r = 1; r <= rows; r++) {
            if (getBooking(`${prefix}-${sectionNum}-${r}`)) count++;
        }
        return count;
    };

    const getVipOccupiedCount = (prefix: string, rows: number, cols: number) => {
        let count = 0;
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                if (getBooking(`${prefix}-${r}-${c}`)) count++;
            }
        }
        return count;
    };

    const renderSectionColumn = (
        sectionNum: number,
        rows: number,
        type: "LEFT_ROW" | "RIGHT_ROW",
    ) => {
        const prefix = type === "LEFT_ROW" ? "L" : "R";
        const occupied = getOccupiedCount(prefix, sectionNum, rows);
        const seats = [];
        for (let r = 1; r <= rows; r++) {
            const seatId = `${prefix}-${sectionNum}-${r}`;
            const booking = getBooking(seatId);

            seats.push(
                <div key={seatId} className={`flex justify-center items-center ${isSmall ? "w-2 h-2 m-[1px]" : "w-8 h-8 m-0.5"}`}>
                    <Seat
                        id={seatId}
                        status={booking ? "occupied" : "available"}
                        price={0}
                        customerName={booking?.customerName}
                        roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                        onToggle={() => { }}
                        size={isSmall ? "small" : "medium"}
                    />
                </div>
            );
        }
        return (
            <div key={`section-${sectionNum}`} className="flex flex-col items-center">
                {!isSmall && (
                    <>
                        <span className="text-xs text-slate-500 mb-1 font-bold">{sectionNum}</span>
                        <span className="text-[10px] text-slate-400 mb-2 font-mono">
                            {occupied}/{rows}
                        </span>
                    </>
                )}
                {seats}
            </div>
        );
    };

    const renderVipTable = (side: "LEFT" | "RIGHT") => {
        const prefix = side === "LEFT" ? "VL" : "VR";
        const rows = 30;
        const cols = 2;
        const occupied = getVipOccupiedCount(prefix, rows, cols);

        return (
            <div className={`flex flex-col items-center ${isSmall ? "mx-1" : "mx-4"}`}>
                {!isSmall && (
                    <>
                        <h3 className="text-sm font-bold text-amber-500 mb-2 text-center">VIP {side}</h3>
                        <span className="text-[10px] text-slate-400 mb-2 font-mono">
                            {occupied}/{rows * cols}
                        </span>
                    </>
                )}
                <div className={`grid grid-cols-2 ${isSmall ? "gap-[1px]" : "gap-1"}`}>
                    {Array.from({ length: rows * cols }).map((_, i) => {
                        const row = Math.floor(i / 2) + 1;
                        const col = (i % 2) + 1;
                        const id = `${prefix}-${row}-${col}`;
                        const booking = getBooking(id);

                        return (
                            <div key={id} className={`${isSmall ? "w-2 h-2" : "w-8 h-8"} flex items-center justify-center`}>
                                <Seat
                                    id={id}
                                    status={booking ? "occupied" : "available"}
                                    price={0}
                                    customerName={booking?.customerName}
                                    roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                                    onToggle={() => { }}
                                    size={isSmall ? "small" : "medium"}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className={`flex flex-row justify-center items-start w-full gap-1 p-2 ${isSmall ? "scale-75 origin-top" : ""}`}>
            {/* VIP Tables Left */}
            {renderVipTable("LEFT")}

            {/* Left Row Section */}
            <div className="flex flex-col items-end">
                {!isSmall && <h2 className="text-xl font-bold text-slate-400 mb-4 pr-10 uppercase">Left</h2>}
                <div className={`flex ${isSmall ? "gap-[2px]" : "gap-1"} items-start justify-end`}>
                    {[5, 4, 3, 2, 1].map(secNum =>
                        renderSectionColumn(secNum, SECTION_LENGTHS[secNum], "LEFT_ROW")
                    )}
                </div>
            </div>

            {/* Runway Center */}
            <div className={`flex flex-col items-center shrink-0 ${isSmall ? "mx-1" : "mx-4"}`}>
                <div className={`bg-black border-slate-800 ${isSmall ? "w-4 h-[200px] border-x" : "w-24 h-[850px] border-x-2"} flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.8)]`}>
                    {!isSmall && (
                        <span className="vertical-text text-xl font-extrabold tracking-[0.2em] text-slate-800 pointer-events-none whitespace-nowrap" style={{ writingMode: "vertical-rl", textOrientation: "upright" }}>
                            RUNWAY 7
                        </span>
                    )}
                </div>
            </div>

            {/* Right Row Section */}
            <div className="flex flex-col items-start">
                {!isSmall && <h2 className="text-xl font-bold text-slate-400 mb-4 pl-10 uppercase">Right</h2>}
                <div className={`flex ${isSmall ? "gap-[2px]" : "gap-1"} items-start justify-start`}>
                    {[1, 2, 3, 4, 5].map(secNum =>
                        renderSectionColumn(secNum, SECTION_LENGTHS[secNum], "RIGHT_ROW")
                    )}
                </div>
            </div>

            {/* VIP Tables Right */}
            {renderVipTable("RIGHT")}

            {/* General Admission */}
            <div className={`flex flex-col items-center ${isSmall ? "ml-2 border-l border-slate-800" : "ml-8 border-l border-slate-800 pl-8"} h-full`}>
                {!isSmall && <h3 className="text-xl font-bold text-slate-400 mb-2 text-center uppercase">GA</h3>}
                <div className={`grid grid-cols-5 ${isSmall ? "gap-[1px]" : "gap-1"}`}>
                    {Array.from({ length: 100 }).map((_, i) => {
                        const row = Math.floor(i / 5) + 1;
                        const col = (i % 5) + 1;
                        const id = `GA-${row}-${col}`;
                        const booking = getBooking(id);
                        return (
                            <div key={id} className={`${isSmall ? "w-2 h-2" : "w-8 h-8"} flex items-center justify-center`}>
                                <Seat
                                    id={id}
                                    status={booking ? "occupied" : "available"}
                                    price={0}
                                    customerName={booking?.customerName}
                                    roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                                    onToggle={() => { }}
                                    size={isSmall ? "small" : "medium"}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
