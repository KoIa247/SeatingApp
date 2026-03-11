/**
 * Maps app seat types to WooCommerce product variation "Ticket Type" attribute names,
 * and maps (eventDate, eventTime) to the WooCommerce parent product ID.
 *
 * Each date+time combo has its own WC variable product.
 * Each product has 15 variations with a "Ticket Type" attribute:
 *   ROW 1-6 LEFT, ROW 1-6 RIGHT, VIP TABLE LEFT, VIP TABLE RIGHT, GENERAL ADMISSION
 */

// ─── Product ID Lookup ───────────────────────────────────────────────
// Key: "YYYY-MM-DD|H:MM AM/PM"  →  WooCommerce parent product ID
const PRODUCT_MAP: Record<string, number> = {
    // September 8th
    "2026-09-08|7:00 PM": 22600,

    // September 9th
    "2026-09-09|11:00 AM": 22650,
    "2026-09-09|1:00 PM": 22666,
    "2026-09-09|3:00 PM": 22682,
    "2026-09-09|5:00 PM": 22811,
    "2026-09-09|7:00 PM": 22875,
    "2026-09-09|9:00 PM": 22859,

    // September 10th
    "2026-09-10|11:00 AM": 22891,
    "2026-09-10|1:00 PM": 22907,
    "2026-09-10|3:00 PM": 22923,
    "2026-09-10|5:00 PM": 22939,
    "2026-09-10|7:00 PM": 22955,
    "2026-09-10|9:00 PM": 22971,

    // September 11th
    "2026-09-11|11:00 AM": 23025,
    "2026-09-11|1:00 PM": 23041,
    "2026-09-11|3:00 PM": 23057,
    "2026-09-11|5:00 PM": 22714,
    "2026-09-11|7:00 PM": 22730,
    "2026-09-11|9:00 PM": 22746,

    // September 12th
    "2026-09-12|11:00 AM": 23090,
    "2026-09-12|1:00 PM": 23106,
    "2026-09-12|3:00 PM": 23122,
    "2026-09-12|5:00 PM": 22762,
    "2026-09-12|7:00 PM": 22778,
    "2026-09-12|9:00 PM": 22794,

    // September 13th
    "2026-09-13|11:00 AM": 23140,
    "2026-09-13|1:00 PM": 23156,
    "2026-09-13|3:00 PM": 23172,
    "2026-09-13|5:00 PM": 23252,
    "2026-09-13|7:00 PM": 23268,
    "2026-09-13|9:00 PM": 23284,
};

// ─── Seat → Variation Attribute Mapping ──────────────────────────────
// Converts the app's seat ID (e.g. "L-3-5") into the WC "Ticket Type" attribute value.

function getTicketTypeFromSeat(
    seatId: string,
    seatType: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP"
): string | null {
    const parts = seatId.split("-");
    const prefix = parts[0];

    if (seatType === "GENERAL" || prefix === "GA") {
        return "GENERAL ADMISSION";
    }

    if (seatType === "VIP" || prefix === "VL" || prefix === "VR") {
        if (prefix === "VL") return "VIP TABLE LEFT";
        if (prefix === "VR") return "VIP TABLE RIGHT";
        return null; // Unknown VIP
    }

    // Row seats: L-{section}-{row} or R-{section}-{row}
    if (prefix === "L" || prefix === "R") {
        const section = parseInt(parts[1]);
        const side = prefix === "L" ? "LEFT" : "RIGHT";
        return `ROW ${section} ${side}`;
    }

    return null;
}

// ─── Variation ID Cache ──────────────────────────────────────────────
// Once we fetch variations for a product, cache them to avoid repeated API calls.
const variationCache = new Map<number, Record<string, number>>();

/**
 * Fetches and caches all variation IDs for a product.
 * Returns a map of "Ticket Type" → variationId.
 */
async function fetchVariations(productId: number): Promise<Record<string, number>> {
    if (variationCache.has(productId)) {
        return variationCache.get(productId)!;
    }

    const WC_STORE_URL = process.env.WC_STORE_URL || "";
    const WC_USERNAME = process.env.WC_USERNAME || "";
    const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || "";
    const cred = Buffer.from(`${WC_USERNAME}:${WC_APP_PASSWORD}`).toString("base64");

    const url = `${WC_STORE_URL}/wp-json/wc/v3/products/${productId}/variations?per_page=50`;
    const response = await fetch(url, {
        headers: { Authorization: `Basic ${cred}` },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch variations for product ${productId}: ${response.status}`);
    }

    const variations = await response.json();
    const map: Record<string, number> = {};

    for (const v of variations) {
        const ticketType = v.attributes?.[0]?.option;
        if (ticketType) {
            map[ticketType] = v.id;
        }
    }

    variationCache.set(productId, map);
    return map;
}

// ─── Public API ──────────────────────────────────────────────────────

export interface StockLookupResult {
    productId: number;
    variationId: number;
    ticketType: string;
}

/**
 * Resolves a seat assignment to the correct WooCommerce product + variation.
 * Returns null if no mapping exists (e.g. VIP without stock management, or unknown seat).
 * Returns null if no mapping exists (e.g. VIP without stock management, or unknown seat).
 */
export async function resolveVariation(
    seatId: string,
    seatType: "LEFT_ROW" | "RIGHT_ROW" | "GENERAL" | "VIP",
    eventDate: string,
    eventTime: string
): Promise<StockLookupResult | null> {
    const key = `${eventDate}|${eventTime}`;
    const productId = PRODUCT_MAP[key];

    if (!productId) {
        console.warn(`No WC product mapped for ${key}`);
        return null;
    }

    const ticketType = getTicketTypeFromSeat(seatId, seatType);
    if (!ticketType) {
        console.warn(`Cannot determine ticket type for seat ${seatId} (${seatType})`);
        return null;
    }

    // Fetch variations and find the matching one
    const variations = await fetchVariations(productId);
    const variationId = variations[ticketType];

    if (!variationId) {
        console.warn(`No variation found for ticket type "${ticketType}" in product ${productId}`);
        return null;
    }

    return { productId, variationId, ticketType };
}
