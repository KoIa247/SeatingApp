"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { EventOverview } from "./EventOverview";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [viewMode, setViewMode] = useState<"single" | "overview">("single");

    return (
        <div className="flex bg-[#0b0c15] text-white min-h-screen">
            <Sidebar viewMode={viewMode} setViewMode={setViewMode} />

            <main className="flex-1 ml-0 lg:ml-72 p-4 sm:p-8 overflow-y-auto">
                {viewMode === "single" ? (
                    children
                ) : (
                    <EventOverview />
                )}
            </main>
        </div>
    );
};
