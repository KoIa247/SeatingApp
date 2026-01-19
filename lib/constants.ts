export const SEAT_ROLES = {
    "Row Tickets Sales": "#EF4444", // Red
    "GA Tickets Sales": "#22C55E", // Green
    "VIP TABLE": "#F59E0B", // Amber
    "Vip/Celebrities": "#EAB308", // Yellow
    "Sponsor": "#3B82F6", // Blue
    "Influencers": "#0EA5E9", // Sky
    "Press Magazines": "#A855F7", // Purple
    "Potential Brands": "#D946EF", // Fuchsia
    "Project Lab Guest": "#15803D", // Dark Green
    "Complimentary": "#F97316", // Orange
    "Guests per Brand": "#14B8A6", // Teal (Assigned)
    "Selected Models": "#64748B", // Slate (Assigned)
    "Giveaway": "#EAB308", // Gold (Assigned - reusing Yellow/Goldish)
    "Performers Guests": "#6366F1", // Indigo (Assigned)
    "Collabs": "#06B6D4", // Cyan (Assigned)
    "BRONZE PACKAGE": "#78350F", // Brown
    "SILVER PACKAGE": "#94A3B8", // Silver/Slate-400
    "GOLD PACKAGE": "#FACC15", // Gold/Yellow-400
} as const;

export type SeatRole = keyof typeof SEAT_ROLES;

export const DEFAULT_ROLE: SeatRole = "Row Tickets Sales";
