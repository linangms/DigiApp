const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Preserving frontend UUID
    school: String,
    course: String,
    courseId: String,
    semester: String,
    instructorName: String,
    instructorEmail: String,
    studentCount: String,
    examWeek: String,
    examDate: Date,
    venue: String,
    openBook: { type: String, default: 'Closed-Book' }, // Changed to String

    // Status Flags
    firstContact: { type: Boolean, default: false },
    demoTraining: { type: Boolean, default: false },
    mockSetup: { type: Boolean, default: false },
    mockTest: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    confirmed: { type: Boolean, default: false },
    applicationRequired: { type: Boolean, default: false }, // New Field

    platform: String,
    questionTypes: [String],
    status: String,
    remarks: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
