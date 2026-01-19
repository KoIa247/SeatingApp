import { SEAT_ROLES } from "@/lib/constants";

export const Legend = () => {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[200px] h-fit sticky top-4">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Legend</h3>
            <div className="space-y-3">
                {Object.entries(SEAT_ROLES).map(([role, color]) => (
                    <div key={role} className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full shadow-lg shrink-0"
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
                        />
                        <span className="text-sm text-slate-300 font-medium">{role}</span>
                    </div>
                ))}
                {/* Occupied State */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/50">
                    <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)] shrink-0"></div>
                    <span className="text-sm text-slate-400">Occupied (Default)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-seat-available shrink-0 border border-slate-600"></div>
                    <span className="text-sm text-slate-400">Available</span>
                </div>
            </div>
        </div>
    );
};
