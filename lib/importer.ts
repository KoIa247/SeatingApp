import { SeatRole } from "./constants";

export interface ParsedProduct {
    date: string;
    time: string;
    type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP";
    side: string;
    section: number;
}

export interface ImportRequest {
    customer: string;
    qty: number;
    info: ParsedProduct;
    orderId?: string;
}

export const parseProductString = (product: string, currentDate: string): ParsedProduct => {
    const p = product.toUpperCase();

    // 1. DATE
    const dateMatch = p.match(/FEBRUARY\s+(\d+)(ST|ND|RD|TH)?/i);
    let parsedDate = currentDate;
    if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        parsedDate = `2024-02-${day}`;
    }

    // 2. TIME
    const timeMatch = p.match(/(\d+)(AM|PM)/i);
    let parsedTime = "11:00 AM";
    if (timeMatch) {
        parsedTime = `${timeMatch[1]}:00 ${timeMatch[2]}`;
    }

    // 3. SEAT TYPE & SECTION
    let type: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP" = "GENERAL";
    let targetSide = "GA";
    let targetSection = 0;

    if (p.includes("GENERAL ADMISSION")) {
        type = "GENERAL";
        targetSide = "GA";
    } else if (p.includes("VIP")) {
        type = "VIP";
        if (p.includes("LEFT")) targetSide = "VL";
        else targetSide = "VR";
    } else {
        const sectionNumMatch = p.match(/ROW\s+(\d+)/i);

        if (p.includes("RIGHT")) {
            type = "RIGHT_ROW";
            targetSide = "R";
        } else if (p.includes("LEFT")) {
            type = "LEFT_ROW";
            targetSide = "L";
        } else {
            type = "GENERAL";
            targetSide = "GA";
        }

        if (type !== "GENERAL" && sectionNumMatch) {
            targetSection = parseInt(sectionNumMatch[1]);
        }
    }

    return {
        date: parsedDate,
        time: parsedTime,
        type,
        side: targetSide,
        section: targetSection
    };
};

export const getRoleForType = (type: string): SeatRole => {
    if (type === "GENERAL") return "GA Tickets Sales";
    if (type === "VIP") return "VIP TABLE";
    return "Row Tickets Sales";
};

export const createAssignment = (seatId: string, type: string, customer: string, date: string, time: string, r: number, c: number, orderId?: string) => ({
    seatNumber: seatId,
    seatType: type,
    customerName: customer,
    role: getRoleForType(type),
    eventDate: date,
    eventTime: time,
    row: r,
    col: c,
    orderId: orderId
});

export const calculateAssignments = (
    requests: ImportRequest[],
    existingBookings: any[]
) => {
    const existingOrderIds = new Set(
        existingBookings.map((b: any) => b.orderId ? String(b.orderId).trim() : null).filter(Boolean)
    );

    const occupiedSet = new Set(existingBookings.map((b: any) => b.seatNumber));
    const newAssignments: any[] = [];
    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    requests.forEach((req) => {
        // 1. Deduplication
        if (req.orderId) {
            const orderIdStr = String(req.orderId).trim();
            if (existingOrderIds.has(orderIdStr)) {
                skippedCount++;
                return;
            }
        }

        // 2. Allocation
        const { date, time, type, side, section } = req.info;
        let allocated = 0;

        if (type === "GENERAL") {
            for (let r = 1; r <= 20; r++) {
                if (allocated >= req.qty) break;
                for (let c = 1; c <= 5; c++) {
                    if (allocated >= req.qty) break;
                    const seatId = `GA-${r}-${c}`;
                    if (!occupiedSet.has(seatId)) {
                        occupiedSet.add(seatId);
                        newAssignments.push(createAssignment(seatId, type, req.customer, date, time, r, c, req.orderId));
                        allocated++;
                    }
                }
            }
        } else if (type === "VIP") {
            for (let r = 1; r <= 30; r++) {
                if (allocated >= req.qty) break;
                for (let c = 1; c <= 2; c++) {
                    if (allocated >= req.qty) break;
                    const seatId = `${side}-${r}-${c}`;
                    if (!occupiedSet.has(seatId)) {
                        occupiedSet.add(seatId);
                        newAssignments.push(createAssignment(seatId, type, req.customer, date, time, r, c, req.orderId));
                        allocated++;
                    }
                }
            }
        } else {
            const SECTION_LENGTHS: Record<number, number> = { 5: 15, 4: 20, 3: 25, 2: 30, 1: 30 };
            const maxRows = SECTION_LENGTHS[section] || 20;

            for (let r = 1; r <= maxRows; r++) {
                if (allocated >= req.qty) break;
                const seatId = `${side}-${section}-${r}`;
                if (!occupiedSet.has(seatId)) {
                    occupiedSet.add(seatId);
                    newAssignments.push(createAssignment(seatId, type, req.customer, date, time, r, section, req.orderId));
                    allocated++;
                }
            }
        }

        if (allocated < req.qty) {
            failCount++;
        } else {
            successCount++;
        }
    });

    return {
        newAssignments,
        successCount,
        skippedCount,
        failCount
    };
};
