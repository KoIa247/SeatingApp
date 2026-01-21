"use client";

import React, { useCallback } from "react";
import { toPng } from "html-to-image";

interface ExportButtonProps {
    targetId: string;
    filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ targetId, filename = "seat-map" }) => {
    const onExport = useCallback(() => {
        const node = document.getElementById(targetId);
        if (!node) return;

        toPng(node, {
            backgroundColor: "#0b0c15",
            pixelRatio: 2, // Higher quality
            style: {
                overflow: 'visible',
                padding: '20px',
                borderRadius: '0',
            }
        })
            .then((dataUrl) => {
                const link = document.createElement("a");
                link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error("Oops, something went wrong!", err);
            });
    }, [targetId, filename]);

    return (
        <button
            onClick={onExport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-emerald-500/50"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Export PNG</span>
        </button>
    );
};
