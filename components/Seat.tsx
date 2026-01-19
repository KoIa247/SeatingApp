"use client";

import React from "react";

interface SeatProps {
  id: string;
  status: "available" | "selected" | "occupied";
  price: number;
  customerName?: string;
  /** The color associated with the role of the customer, used for occupied seats. */
  roleColor?: string;
  onToggle: (id: string) => void;
}

export const Seat: React.FC<SeatProps> = ({ id, status, price, customerName, roleColor, onToggle }) => {
  const isOccupied = status === "occupied";
  const isSelected = status === "selected";

  return (
    <div className="relative group">
      <button
        onClick={() => onToggle(id)}
        disabled={false}
        style={isOccupied && roleColor ? { backgroundColor: roleColor, boxShadow: `0 0 10px ${roleColor}66` } : {}}
        className={`
            relative h-6 w-7 rounded-t-md transition-all duration-300 ease-out flex items-center justify-center
            ${isOccupied
            ? "cursor-not-allowed border-transparent"
            : "cursor-pointer hover:-translate-y-0.5"
          }
            ${status === "available" ? "bg-seat-available hover:bg-slate-600 hover:shadow-[0_0_10px_rgba(139,92,246,0.5)]" : ""}
            ${isSelected ? "bg-seat-selected shadow-[0_0_15px_var(--color-primary)] scale-110 z-10" : ""}
             /* Fallback for occupied if roleColor missing */
            ${isOccupied && !roleColor ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]" : ""}
          `}
        aria-label={`Seat ${id} - ${status} - ${isOccupied ? customerName : `$${price}`}`}
        data-testid={`seat-${id}`}
      >
        {/* Seat Armrests - Smaller */}
        <span className={`absolute -left-0.5 bottom-0 h-3 w-0.5 rounded-sm ${isOccupied ? "bg-black/20" : isSelected ? "bg-violet-600" : "bg-slate-600"}`}></span>
        <span className={`absolute -right-0.5 bottom-0 h-3 w-0.5 rounded-sm ${isOccupied ? "bg-black/20" : isSelected ? "bg-violet-600" : "bg-slate-600"}`}></span>

      </button>

      {/* Tooltip for Occupied Seat */}
      {isOccupied && customerName && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-slate-700 text-xs px-3 py-1.5 rounded-lg text-white pointer-events-none whitespace-nowrap z-50 shadow-xl">
          <p className="font-bold text-red-400">Occupied</p>
          <p className="text-slate-200">{customerName}</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
        </div>
      )}
    </div>
  );
};
