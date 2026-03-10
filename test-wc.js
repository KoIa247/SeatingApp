// Diagnostic: trace the full stock check + decrement flow
const cred = Buffer.from('Nicola:Nl64 PrHG feN1 681f BNDU y8rT').toString('base64');
const headers = { 'Authorization': 'Basic ' + cred, 'Content-Type': 'application/json' };
const base = 'https://runway7tickets.com/wp-json/wc/v3';

async function testStockFlow() {
    // Step 1: Test basic API auth
    console.log("=== Step 1: Test API Auth ===");
    try {
        const res = await fetch(`${base}/products/22600`, { headers });
        console.log(`GET product 22600: status=${res.status}`);
        const product = await res.json();
        console.log(`Product name: "${product.name}"`);
    } catch (e) {
        console.error("API auth failed:", e.message);
        return;
    }

    // Step 2: Fetch variations for product 22600 (Sept 8 7PM)
    console.log("\n=== Step 2: Fetch Variations ===");
    const vRes = await fetch(`${base}/products/22600/variations?per_page=50`, { headers });
    console.log(`GET variations: status=${vRes.status}`);
    const variations = await vRes.json();

    // Find ROW 1 LEFT variation
    const row1Left = variations.find(v => v.attributes?.[0]?.option === 'ROW 1 LEFT');
    if (!row1Left) {
        console.error("Could not find ROW 1 LEFT variation!");
        console.log("Available variations:", variations.map(v => v.attributes?.[0]?.option));
        return;
    }
    console.log(`ROW 1 LEFT => variation ID: ${row1Left.id}, stock: ${row1Left.stock_quantity}, manage_stock: ${row1Left.manage_stock}`);

    // Step 3: Try reading stock via the variation endpoint
    console.log("\n=== Step 3: Read Single Variation Stock ===");
    const stockRes = await fetch(`${base}/products/22600/variations/${row1Left.id}`, { headers });
    console.log(`GET variation ${row1Left.id}: status=${stockRes.status}`);
    const stockData = await stockRes.json();
    console.log(`stock_quantity: ${stockData.stock_quantity}, manage_stock: ${stockData.manage_stock}, stock_status: ${stockData.stock_status}`);

    // Step 4: Try UPDATING stock (decrement by 1, then restore)
    console.log("\n=== Step 4: Test Stock UPDATE (PUT) ===");
    const currentStock = stockData.stock_quantity;
    const newStock = currentStock - 1;

    console.log(`Attempting to set stock from ${currentStock} to ${newStock}...`);
    const putRes = await fetch(`${base}/products/22600/variations/${row1Left.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ stock_quantity: newStock })
    });
    console.log(`PUT response status: ${putRes.status}`);
    const putData = await putRes.json();

    if (putRes.ok) {
        console.log(`SUCCESS! New stock_quantity: ${putData.stock_quantity}`);

        // Restore stock
        console.log(`\nRestoring stock to ${currentStock}...`);
        const restoreRes = await fetch(`${base}/products/22600/variations/${row1Left.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ stock_quantity: currentStock })
        });
        const restoreData = await restoreRes.json();
        console.log(`Restored stock_quantity: ${restoreData.stock_quantity}`);
    } else {
        console.error("PUT FAILED:", JSON.stringify(putData, null, 2));
    }
}

testStockFlow().catch(e => console.error("Fatal error:", e));
