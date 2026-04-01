const mongoose = require('mongoose');
const Issue = require('./models/Issue');
require('dotenv').config();

async function updateDB() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digiapp');
    try {
        const result = await Issue.updateMany(
            { vendor: 'Examena' },
            { $set: { vendor: 'MaivenPoint' } }
        );
        console.log(`Updated ${result.modifiedCount} records (matched: ${result.matchedCount})`);
    } catch (e) {
        console.error("DB Error", e);
    }
    process.exit(0);
}

updateDB();
