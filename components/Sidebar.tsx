import React, { useState } from "react";

interface SidebarProps {
    viewMode: "single" | "overview";
    setViewMode: (mode: "single" | "overview") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ viewMode, setViewMode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-6 right-6 z-50 bg-violet-600 text-white p-3 rounded-full shadow-lg shadow-violet-900/40 border border-violet-500/50"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                )}
            </button>

            {/* Sidebar Content */}
            <aside className={`
                w-72 flex flex-col h-screen fixed left-0 top-0 bg-slate-900 border-r border-slate-800 p-8 z-40 transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-violet-500 tracking-tighter italic">RUNWAY 7</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-8 bg-violet-600 rounded-full"></div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Seating Master</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-3">
                    <button
                        onClick={() => { setViewMode("single"); setIsOpen(false); }}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black group ${viewMode === "single"
                            ? "bg-violet-600 text-white shadow-xl shadow-violet-900/40"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform group-hover:scale-110 ${viewMode === "single" ? "text-white" : "text-violet-500"}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                        </svg>
                        Main Map
                    </button>

                    <button
                        onClick={() => { setViewMode("overview"); setIsOpen(false); }}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black group ${viewMode === "overview"
                            ? "bg-violet-600 text-white shadow-xl shadow-violet-900/40"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform group-hover:scale-110 ${viewMode === "overview" ? "text-white" : "text-emerald-400"}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                        </svg>
                        Comparisons
                    </button>
                </nav>

                <div className="mt-auto pt-10 border-t border-slate-800">
                    <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-800/50">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Quick View</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Switch to <span className="text-violet-400 font-bold">Main Map</span> for booking or <span className="text-emerald-400 font-bold">Comparisons</span> for all shows.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
