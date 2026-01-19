import React from "react";

interface BookingSummaryProps {
    selectedCount: number;
    totalPrice: number;
    onCheckout: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ selectedCount, totalPrice, onCheckout }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 p-6 shadow-2xl z-50">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-slate-400 text-sm">
                        You have selected <span className="font-bold text-violet-400">{selectedCount}</span> seats
                    </p>
                    <div className="flex items-end gap-1">
                        <span className="text-slate-400 text-lg">Total:</span>
                        <span className="text-3xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                <button
                    className="bg-violet-600 hover:bg-violet-700 hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedCount === 0}
                    onClick={onCheckout}
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
};
