import React from "react";

export const Screen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center mb-12 perspective-3d">
            <div
                className="h-20 w-80 bg-white shadow-[0_0_30px_var(--color-primary-glow)] transform rotate-x-[-15deg] rounded-lg opacity-80"
                style={{
                    transform: "rotateX(-10deg) scale(0.9)",
                    boxShadow: "0 25px 60px -15px var(--color-primary-glow)"
                }}
            ></div>
            <p className="mt-4 text-sm text-slate-400 font-light tracking-widest text-center shadow-black drop-shadow-lg">SCREEN</p>
        </div>
    );
};
