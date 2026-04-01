const mongoose = require('mongoose');
const Assessment = require('./models/Assessment');
require('dotenv').config();

async function updateDB() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digiapp');
    try {
        const result = await Assessment.updateMany(
            { semester: 'Sem 2' },
            { $set: { semester: '25S2' } }
        );
        console.log(`Updated ${result.modifiedCount} records (matched: ${result.matchedCount})`);
    } catch (e) {
        console.error("DB Error", e);
    }
    process.exit(0);
}

updateDB();
