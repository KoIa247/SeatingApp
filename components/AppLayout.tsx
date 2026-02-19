"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { EventOverview } from "./EventOverview";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [viewMode, setViewMode] = useState<"single" | "overview">("single");
    const [isCollapsed, setIsCollapsed] = useState(true); // Default hidden as per request

    return (
        <div className="flex bg-[#0b0c15] text-white min-h-screen">
            <Sidebar
                viewMode={viewMode}
                setViewMode={setViewMode}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main className={`flex-1 transition-all duration-300 p-4 sm:p-8 overflow-y-auto ${isCollapsed ? "ml-10" : "ml-72"}`}>
                {viewMode === "single" ? (
                    children
                ) : (
                    <EventOverview />
                )}
            </main>
        </div>
    );
};
