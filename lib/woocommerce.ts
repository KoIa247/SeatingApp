"use server";

const WC_STORE_URL = process.env.WC_STORE_URL || "";
const WC_USERNAME = process.env.WC_USERNAME || "";
const WC_APP_PASSWORD = process.env.WC_APP_PASSWORD || "";

function getAuthHeader(): string {
    const cred = Buffer.from(`${WC_USERNAME}:${WC_APP_PASSWORD}`).toString("base64");
    return `Basic ${cred}`;
}

/**
 * Get the current stock quantity for a WooCommerce product variation.
 * Returns null if stock is not managed for that variation.
 */
export async function getVariationStock(
    productId: number,
    variationId: number
): Promise<{ stockQuantity: number | null; manageStock: boolean }> {
    const url = `${WC_STORE_URL}/wp-json/wc/v3/products/${productId}/variations/${variationId}`;

    const response = await fetch(url, {
        headers: { Authorization: getAuthHeader() },
        cache: "no-store",
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`WooCommerce API error (${response.status}): ${text}`);
    }

    const variation = await response.json();
    return {
        stockQuantity: variation.stock_quantity,
        manageStock: variation.manage_stock,
    };
}

/**
 * Decrement the stock quantity for a WooCommerce product variation by a given amount.
 * Returns the new stock quantity.
 */
/**
 * Increment the stock quantity for a WooCommerce product variation by a given amount.
 * Used when a seat booking is deleted to free the stock back.
 */
export async function incrementVariationStock(
    productId: number,
    variationId: number,
    incrementBy: number = 1
): Promise<number> {
    const { stockQuantity, manageStock } = await getVariationStock(productId, variationId);

    if (!manageStock) {
        return -1;
    }

    const currentStock = stockQuantity ?? 0;
    const newStock = currentStock + incrementBy;

    const url = `${WC_STORE_URL}/wp-json/wc/v3/products/${productId}/variations/${variationId}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock_quantity: newStock }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`WooCommerce API error updating stock (${response.status}): ${text}`);
    }

    const updated = await response.json();
    return updated.stock_quantity;
}

/**
 * Decrement the stock quantity for a WooCommerce product variation by a given amount.
 * Returns the new stock quantity.
 */
export async function decrementVariationStock(
    productId: number,
    variationId: number,
    decrementBy: number = 1
): Promise<number> {
    // First get current stock
    const { stockQuantity, manageStock } = await getVariationStock(productId, variationId);

    if (!manageStock) {
        // Stock not managed — nothing to decrement
        return -1;
    }

    const currentStock = stockQuantity ?? 0;
    const newStock = Math.max(0, currentStock - decrementBy);

    const url = `${WC_STORE_URL}/wp-json/wc/v3/products/${productId}/variations/${variationId}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock_quantity: newStock }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`WooCommerce API error updating stock (${response.status}): ${text}`);
    }

    const updated = await response.json();
    return updated.stock_quantity;
}
