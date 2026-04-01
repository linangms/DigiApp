const mongoose = require('mongoose');
const Issue = require('./models/Issue');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digiapp');
    try {
        const i = await Issue.create({
            id: 'test-123',
            school: 'Test',
            course: 'TEST1001',
            instructor: 'John',
            email: 'john@ntu.edu.sg',
            assessmentType: 'CA',
            assessmentDate: new Date(),
            platform: 'Examena',
            vendor: 'MaivenPoint',
            problemDescription: 'Test',
            status: 'Pending'
        });
        console.log("Success", i);
    } catch (e) {
        console.error("DB Error", e);
    }
    process.exit(0);
}
test();
