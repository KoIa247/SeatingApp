const { MongoClient } = require('mongodb');

// URI from .env (hardcoded for test simplicity based on previous context)
const uri = "mongodb://localhost:27017/Seats?directConnection=true";

async function main() {
    console.log("Testing Native MongoDB Driver...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected successfully to server");

        const db = client.db();
        const collection = db.collection('Booking');

        const seatNumber = "TEST-SEAT-NATIVE";
        const eventDate = "2024-02-10";

        // Clean up
        await collection.deleteOne({ seatNumber, eventDate });

        // Test Upsert
        console.log("Attempting Upsert...");
        const result = await collection.updateOne(
            { seatNumber, eventDate },
            {
                $set: {
                    customerName: "Native User",
                    seatType: "GENERAL",
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        console.log("Upsert result:", result);

        // Verify Read
        const doc = await collection.findOne({ seatNumber, eventDate });
        console.log("Read document:", doc);

    } catch (e) {
        console.error("ERROR OCCURRED:");
        console.error(e);
    } finally {
        await client.close();
    }
}

main();
