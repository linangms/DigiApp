const mongoose = require('mongoose');
require('dotenv').config();
const Assessment = require('./models/Assessment');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const assessments = await Assessment.find({}, 'platform');
        const counts = {};
        assessments.forEach(a => {
            const p = a.platform || 'Unspecified';
            counts[p] = (counts[p] || 0) + 1;
        });

        console.log("Platform Counts in DB:", counts);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

check();
