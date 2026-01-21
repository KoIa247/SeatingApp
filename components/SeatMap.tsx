"use client";

import React, { useState } from "react";
import { Seat } from "./Seat";
import { SeatModal } from "./SeatModal";
import { Booking } from "@/lib/types";
import { SEAT_ROLES, SeatRole } from "@/lib/constants";
import { assignMultipleSeats, deleteBooking } from "@/app/actions";
import { toast } from "sonner";

interface SeatMapProps {
    initialBookings: Booking[];
    currentDate: string;
    currentTime: string;
}



export const SeatMap: React.FC<SeatMapProps> = ({ initialBookings, currentDate, currentTime }) => {
    // Single selected seat for edit
    const [selectedSeat, setSelectedSeat] = useState<{
        number: string;
        type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP";
        row?: number | null;
        col?: number | null;
        customerName?: string;
        role?: SeatRole;
    } | null>(null);

    // Multi-selected seats for bulk assignment
    const [bulkSelectedSeats, setBulkSelectedSeats] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const getBooking = (seatId: string) =>
        initialBookings.find((b) => b.seatNumber === seatId);

    const handleDeleteSeat = async () => {
        if (!selectedSeat) return;
        const result = await deleteBooking(selectedSeat.number, currentDate, currentTime);

        if (result.success) {
            toast.success("Booking removed");
            setSelectedSeat(null);
        } else {
            toast.error("Failed to delete booking");
        }
    };


    // Identify seat properties from ID (naive parsing or improved lookup needed for bulk)
    // We'll store type map in state or derive it.
    // Let's derive it.
    const getSeatInfo = (id: string): { type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP", row: number, col: number } => {
        const parts = id.split('-');
        const prefix = parts[0];
        const section = parseInt(parts[1] || "0"); // row for VIP?
        const num = parseInt(parts[2] || "0");

        if (prefix === "L") return { type: "LEFT_ROW", row: num, col: section }; // section is "sectionNum" -> col approx?
        // WAIT. L-5-1. Section 5, Row 1.
        // In schema: row, col. 
        // For L/R: row=r (seat index), col=sectionNum ?? or vice versa?
        // In `renderSectionColumn`: `handleSeatClick(seatId, type, r, sectionNum)`
        // `r` is passed as 3rd arg (row), `sectionNum` as 4th (col).

        if (prefix === "L") return { type: "LEFT_ROW", row: parseInt(parts[2]), col: parseInt(parts[1]) };
        if (prefix === "R") return { type: "RIGHT_ROW", row: parseInt(parts[2]), col: parseInt(parts[1]) };
        if (prefix === "GA") return { type: "GENERAL", row: parseInt(parts[1]), col: parseInt(parts[2]) };
        if (prefix === "VL") return { type: "VIP", row: parseInt(parts[1]), col: parseInt(parts[2]) };
        if (prefix === "VR") return { type: "VIP", row: parseInt(parts[1]), col: parseInt(parts[2]) };

        return { type: "GENERAL", row: 0, col: 0 };
    };

    const handleSeatClick = (
        id: string,
        type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP",
        row?: number,
        col?: number
    ) => {
        const booking = getBooking(id);

        // If occupied, open Edit Mode (unless we want to allow selecting occupied for bulk delete? User asked for bulk add mainly)
        if (booking) {
            setSelectedSeat({
                number: id,
                type,
                row: row || null,
                col: col || null,
                customerName: booking.customerName,
                role: booking.role as SeatRole | undefined,
            });
            return;
        }

        // Available seat: Toggle selection
        setBulkSelectedSeats(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkSave = async (data: { customerName: string, role: string }) => {
        const assignments = Array.from(bulkSelectedSeats).map(seatId => {
            const info = getSeatInfo(seatId); // We need to reconstruction props since we only stored IDs
            return {
                seatNumber: seatId,
                type: info.type,
                row: info.row,
                col: info.col
            };
        });

        const result = await assignMultipleSeats(
            assignments,
            data.customerName,
            data.role,
            currentDate,
            currentTime
        );

        if (result.success) {
            toast.success(`Assigned ${assignments.length} seats!`);
            setBulkSelectedSeats(new Set());
            setIsBulkModalOpen(false);
            // Refresh
        } else {
            toast.error("Failed to assign seats");
        }
    };


    // Sections configuration: 5, 4, 3, 2, 1
    // Lengths: 15, 20, 25, 30, 30
    const SECTION_LENGTHS: Record<number, number> = {
        5: 15,
        4: 20,
        3: 25,
        2: 30,
        1: 30,
    };

    // Helper to count occupied seats in a range
    const getOccupiedCount = (prefix: string, sectionNum: number, rows: number) => {
        let count = 0;
        for (let r = 1; r <= rows; r++) {
            if (getBooking(`${prefix}-${sectionNum}-${r}`)) count++;
        }
        return count;
    };

    // Helper for VIP Table counts
    const getVipOccupiedCount = (prefix: string, rows: number, cols: number) => {
        let count = 0;
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                if (getBooking(`${prefix}-${r}-${c}`)) count++;
            }
        }
        return count;
    };

    // Helper for GA counts
    const getGACount = () => {
        let count = 0;
        for (let r = 1; r <= 20; r++) {
            for (let c = 1; c <= 5; c++) {
                if (getBooking(`GA-${r}-${c}`)) count++;
            }
        }
        return count;
    };


    const renderSectionColumn = (
        sectionNum: number,
        rows: number, // Total length of this section (vertical seats)
        type: "LEFT_ROW" | "RIGHT_ROW",
    ) => {
        const prefix = type === "LEFT_ROW" ? "L" : "R";
        const occupied = getOccupiedCount(prefix, sectionNum, rows);
        const seats = [];
        for (let r = 1; r <= rows; r++) {
            const seatId = `${prefix}-${sectionNum}-${r}`; // Section-Row
            const booking = getBooking(seatId);
            const isSelected = selectedSeat?.number === seatId || bulkSelectedSeats.has(seatId);

            seats.push(
                <div key={seatId} className="flex justify-center items-center w-7 h-7 m-[1px]">
                    <Seat
                        id={seatId}
                        status={booking ? "occupied" : isSelected ? "selected" : "available"}
                        price={0}
                        customerName={booking?.customerName}
                        roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                        onToggle={() => handleSeatClick(seatId, type, r, sectionNum)}
                    />
                </div>
            );
        }
        return (
            <div key={`section-${sectionNum}`} className="flex flex-col items-center p-1 rounded-sm bg-white/90 shadow-sm border border-slate-200/50">
                <span className="text-xs text-slate-500 mb-1 font-bold">{sectionNum}</span>
                <div className="bg-white px-2 py-0.5 rounded border border-slate-200 mb-2">
                    <span className="text-xs text-black font-black font-mono">
                        {occupied}/{rows}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    {seats}
                </div>
            </div>
        );
    };

    const renderVipTable = (side: "LEFT" | "RIGHT") => {
        const prefix = side === "LEFT" ? "VL" : "VR"; // VIP Left / VIP Right
        const rows = 30;
        const cols = 2;
        const occupied = getVipOccupiedCount(prefix, rows, cols);

        return (
            <div className="flex flex-col items-center p-1 rounded-sm bg-white/90 shadow-sm border border-slate-200/50 mx-1">
                <h3 className="text-sm font-bold text-amber-500 mb-1 text-center uppercase tracking-tight">VIP {side}</h3>
                <div className="bg-white px-2 py-0.5 rounded border border-slate-200 mb-2">
                    <span className="text-xs text-black font-black font-mono">
                        {occupied}/{rows * cols}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                    {Array.from({ length: rows * cols }).map((_, i) => {
                        const row = Math.floor(i / 2) + 1;
                        const col = (i % 2) + 1;
                        const id = `${prefix}-${row}-${col}`;
                        const booking = getBooking(id);
                        const isSelected = selectedSeat?.number === id;

                        return (
                            <div key={id} className="w-7 h-7 flex items-center justify-center">
                                <Seat
                                    id={id}
                                    status={booking ? "occupied" : isSelected ? "selected" : "available"}
                                    price={0}
                                    customerName={booking?.customerName}
                                    roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                                    onToggle={() => handleSeatClick(id, "VIP")}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="flex flex-row justify-center items-start w-full max-w-[1800px] mx-auto p-4 gap-1 overflow-x-auto">

            {/* VIP Tables Left */}
            {renderVipTable("LEFT")}

            {/* Left Row Section: 5 4 3 2 1 */}
            <div className="flex flex-col items-end px-1">
                <h2 className="text-base font-black text-slate-500 mb-4 pr-4 uppercase tracking-widest">Left</h2>
                <div className="flex gap-1 items-start justify-end">
                    {[5, 4, 3, 2, 1].map(secNum =>
                        renderSectionColumn(secNum, SECTION_LENGTHS[secNum], "LEFT_ROW")
                    )}
                </div>
            </div>

            {/* Runway Center */}
            <div className="flex flex-col items-center mx-1 shrink-0">
                <div className="bg-white border-x-2 border-slate-200 w-12 h-[720px] flex items-center justify-center relative shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                    <span className="vertical-text text-xl font-black tracking-[0.1em] text-black/80 pointer-events-none whitespace-nowrap" style={{ writingMode: "vertical-rl", textOrientation: "upright" }}>
                        RUNWAY 7
                    </span>
                </div>
            </div>

            {/* Right Row Section: 1 2 3 4 5 */}
            <div className="flex flex-col items-start px-1">
                <h2 className="text-base font-black text-slate-500 mb-4 pl-4 uppercase tracking-widest">Right</h2>
                <div className="flex gap-1 items-start justify-start">
                    {[1, 2, 3, 4, 5].map(secNum =>
                        renderSectionColumn(secNum, SECTION_LENGTHS[secNum], "RIGHT_ROW")
                    )}
                </div>
            </div>

            {/* VIP Tables Right */}
            {renderVipTable("RIGHT")}

            {/* General Admission: Right Sidebar */}
            <div className="flex flex-col items-center p-1 rounded-sm bg-white/90 shadow-sm border border-slate-200/50 mx-1 h-full">
                <h3 className="text-sm font-bold text-slate-500 mb-1 text-center uppercase tracking-tight">GA</h3>
                <div className="bg-white px-2 py-0.5 rounded border border-slate-200 mb-2">
                    <span className="text-xs text-black font-black font-mono">
                        {getGACount()}/100
                    </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 100 }).map((_, i) => { // 5 cols * 20 rows = 100 seats
                        const row = Math.floor(i / 5) + 1;
                        const col = (i % 5) + 1;
                        const id = `GA-${row}-${col}`;
                        const booking = getBooking(id);
                        const isSelected = selectedSeat?.number === id;
                        return (
                            <div key={id} className="w-7 h-7 flex items-center justify-center">
                                <Seat
                                    id={id}
                                    status={booking ? "occupied" : isSelected ? "selected" : "available"}
                                    price={0}
                                    customerName={booking?.customerName}
                                    roleColor={booking?.role ? SEAT_ROLES[booking.role as SeatRole] : undefined}
                                    onToggle={() => handleSeatClick(id, "GENERAL")}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Bulk Assignment Button */}
            {bulkSelectedSeats.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
                    >
                        <span>Assign {bulkSelectedSeats.size} Selected Seats</span>
                        <div className="bg-white/20 px-2 py-0.5 rounded text-sm">⏎</div>
                    </button>
                    <button
                        onClick={() => setBulkSelectedSeats(new Set())}
                        className="absolute -top-3 -right-3 bg-slate-800 text-slate-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border border-slate-600 shadow-lg"
                    >
                        ✕
                    </button>
                </div>
            )}

            <SeatModal
                isOpen={!!selectedSeat}
                onClose={() => setSelectedSeat(null)}
                seatNumber={selectedSeat?.number || ""}
                seatType={selectedSeat?.type || "GENERAL"}
                row={selectedSeat?.row}
                col={selectedSeat?.col}
                initialCustomerName={selectedSeat?.customerName}
                initialRole={selectedSeat?.role}
                eventDate={currentDate}
                eventTime={currentTime}
                onSave={() => { }}
                onDelete={handleDeleteSeat}
            />

            <SeatModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                seatNumbers={Array.from(bulkSelectedSeats)}
                seatType="GENERAL" // Fallback, distinct types handled in backend
                eventDate={currentDate}
                eventTime={currentTime}
                onSave={(data) => handleBulkSave(data)} // Pass data back
                onDelete={() => { }}
            />
        </div>
    );
};
