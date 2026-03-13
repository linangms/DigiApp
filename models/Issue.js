const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    school: String,
    course: String,
    instructor: String,
    email: String,
    assessmentType: { type: String, enum: ['CA', 'Exam'] },
    assessmentDate: Date,
    platform: { type: String, enum: ['NTULearn with LDB', 'Examena', 'Pen and Paper with Gradescope e-Grading'] },
    vendor: { type: String, enum: ['Blackboard', 'Respondus', 'Examena', 'Turnitin'] },
    problemDescription: String,
    remarks: String,
    status: { type: String, enum: ['Pending', 'Fixed'], default: 'Pending' },
    last_updated_by: String,
    last_updated_date: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', IssueSchema);
