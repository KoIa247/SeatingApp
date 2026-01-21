import { SeatMap } from "@/components/SeatMap";
import { DateSelector } from "@/components/DateSelector";
import { getBookings } from './actions';
import { Booking } from "@/lib/types";
import { Legend } from "@/components/Legend";
import { ClearAllButton } from "@/components/ClearAllButton";

import { TimeSelector } from "@/components/TimeSelector";
import { ImportButton } from "@/components/ImportButton";
import { RefreshButton } from "@/components/RefreshButton";
import { ExportButton } from "@/components/ExportButton";

import { AppLayout } from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string; time?: string }> }) {
  const { date, time } = await searchParams;
  const currentDate = date || "2024-02-13"; // Default to a valid date
  const currentTime = time || "11:00 AM";

  const bookings = await getBookings(currentDate, currentTime);

  const serializedBookings = bookings.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    seatType: b.seatType as "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP",
    role: b.role as string | undefined,
    eventTime: b.eventTime as string | undefined
  }));

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-6">
        <div className="flex flex-row items-center gap-6">
          <DateSelector />
          <div className="h-8 w-px bg-slate-800 hidden lg:block"></div>
          <TimeSelector />
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton currentDate={currentDate} />
          <ExportButton targetId="seat-map-capture" filename={`seating-${currentDate}`} />
          <ImportButton currentDate={currentDate} />
          <ClearAllButton eventDate={currentDate} eventTime={currentTime} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
        {/* Legend Sidebar - Minimal version for main content */}
        <div className="hidden 2xl:block w-64 shrink-0 bg-slate-900/30 p-5 rounded-3xl border border-slate-800/50">
          <Legend />
        </div>

        {/* Main Seat Map */}
        <div id="seat-map-capture" className="flex-1 w-full overflow-x-auto bg-slate-900/20 rounded-[2.5rem] border border-slate-800/30 p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6 px-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">{formatDate(currentDate)}</h2>
              <p className="text-violet-400 font-bold tracking-widest uppercase text-sm">{currentTime}</p>
            </div>
            <div className="2xl:hidden">
              <Legend />
            </div>
          </div>
          <SeatMap initialBookings={serializedBookings} currentDate={currentDate} currentTime={currentTime} />
        </div>
      </div>
    </AppLayout>
  );
}
