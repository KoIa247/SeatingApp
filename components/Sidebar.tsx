"use client";

import React from "react";

interface SidebarProps {
    viewMode: "single" | "overview";
    setViewMode: (mode: "single" | "overview") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ viewMode, setViewMode }) => {
    return (
        <aside className="w-64 flex flex-col h-screen fixed left-0 top-0 bg-slate-900 border-r border-slate-800 p-6 z-40">
            <div className="mb-10">
                <h1 className="text-2xl font-black text-violet-500 tracking-tighter">RUNWAY 7</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Seating Master</p>
            </div>

            <nav className="flex flex-col gap-2">
                <button
                    onClick={() => setViewMode("single")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${viewMode === "single"
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                    Single Event
                </button>

                <button
                    onClick={() => setViewMode("overview")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${viewMode === "overview"
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                    </svg>
                    Full Overview
                </button>
            </nav>

            <div className="mt-auto pt-10 border-t border-slate-800">
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Instructions</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Use the <span className="text-violet-400 font-bold">Single Event</span> view for detailed seat assignments and the <span className="text-emerald-400 font-bold">Full Overview</span> for a quick comparison of all shows.
                    </p>
                </div>
            </div>
        </aside>
    );
};
