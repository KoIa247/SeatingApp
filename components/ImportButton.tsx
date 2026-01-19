"use client";

import { useState } from "react";
import { ImportModal } from "./ImportModal";
import { useRouter } from "next/navigation";

export const ImportButton = ({ currentDate }: { currentDate: string }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-400 border border-emerald-800 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2"
            >
                <span>📂</span> Import Excel
            </button>

            <ImportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentDate={currentDate}
                onSuccess={() => router.refresh()}
            />
        </>
    );
};
