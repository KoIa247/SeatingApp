export interface Booking {
    id?: string; // Optional because we might handle raw docs or serialized
    _id?: string;
    seatNumber: string;
    customerName: string;
    seatType: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP";

    orderId?: string;
    eventDate: string;
    eventTime?: string;
    role?: string;
    row?: number;
    col?: number;
    createdAt: Date | string;
    updatedAt: Date | string;
}
