import { SeatMap } from "@/components/SeatMap";
import { DateSelector } from "@/components/DateSelector";
import { getBookings } from './actions';
import { Booking } from "@/lib/types";
import { Legend } from "@/components/Legend";
import { ClearAllButton } from "@/components/ClearAllButton";

import { TimeSelector } from "@/components/TimeSelector";
import { ImportButton } from "@/components/ImportButton";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ date?: string; time?: string }> }) {
  const { date, time } = await searchParams;
  const currentDate = date || "2024-02-10";
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
    <main className="min-h-screen bg-[#0b0c15] text-white overflow-x-hidden p-6">

      <div className="flex flex-col lg:flex-row justify-between items-center max-w-[1600px] mx-auto mb-8 gap-4">
        <div className="flex flex-col gap-4">
          <DateSelector />
          <TimeSelector />
        </div>
        <div className="flex items-center gap-4">
          <RefreshButton currentDate={currentDate} />
          <ImportButton currentDate={currentDate} />
          <ClearAllButton eventDate={currentDate} eventTime={currentTime} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-start justify-center gap-8 max-w-[1800px] mx-auto">
        {/* Legend Sidebar */}
        <div className="xl:w-64 shrink-0">
          <Legend />
        </div>

        {/* Main Seat Map */}
        <div className="flex-1 w-full overflow-x-auto">
          <SeatMap initialBookings={serializedBookings} currentDate={currentDate} currentTime={currentTime} />
        </div>
      </div>

    </main>
  );
}
