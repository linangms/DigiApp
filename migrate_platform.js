const mongoose = require('mongoose');
require('dotenv').config();
const Assessment = require('./models/Assessment'); // Adjust path as needed

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const migrate = async () => {
    await connectDB();

    try {
        const res = await Assessment.updateMany(
            { platform: "Respondus Lock Down Browser" },
            { $set: { platform: "NTULearn with LDB" } }
        );

        console.log(`Migration Complete. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        mongoose.connection.close();
    }
};

migrate();
