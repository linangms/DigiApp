const mongoose = require('mongoose');

const ReferenceDataSchema = new mongoose.Schema({
    DEPT: String,
    SUBJ_CODE: String,
    COURSE_SITE_ID: String,
    // Allow other fields from Excel without strict schema validation
}, { strict: false });

module.exports = mongoose.model('ReferenceData', ReferenceDataSchema);
