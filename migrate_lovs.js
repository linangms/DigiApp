const connectDB = require('./db');
const Assessment = require('./models/Assessment');
const mongoose = require('mongoose');

async function migrate() {
    try {
        await connectDB();
        console.log('Connected to DB. Starting migration...');

        // 1. Update Mid-term to CA
        const assessmentResult = await Assessment.updateMany(
            { assessmentType: 'Mid-term' },
            { $set: { assessmentType: 'CA' } }
        );
        console.log(`Updated ${assessmentResult.modifiedCount} records from "Mid-term" to "CA"`);

        // 2. Update Gradescope to Pen and Paper with Gradescope e-Grading
        const platformResult = await Assessment.updateMany(
            { platform: 'Gradescope' },
            { $set: { platform: 'Pen and Paper with Gradescope e-Grading' } }
        );
        console.log(`Updated ${platformResult.modifiedCount} records from "Gradescope" to "Pen and Paper with Gradescope e-Grading"`);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
