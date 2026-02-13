const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const Assessment = require('./models/Assessment');
const ReferenceData = require('./models/ReferenceData');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// --- API Endpoints ---

// Get Assessments
app.get('/api/assessments', async (req, res) => {
    try {
        const assessments = await Assessment.find().sort({ createdAt: -1 });
        res.json(assessments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Create Assessment
app.post('/api/assessments', async (req, res) => {
    try {
        const newAssessment = await Assessment.create(req.body);
        res.json(newAssessment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create assessment' });
    }
});

// Update Assessment
app.put('/api/assessments/:id', async (req, res) => {
    try {
        const updated = await Assessment.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update assessment' });
    }
});

// Delete Assessment
app.delete('/api/assessments/:id', async (req, res) => {
    try {
        await Assessment.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Get Reference Data
app.get('/api/refdata', async (req, res) => {
    try {
        const data = await ReferenceData.find();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Save Reference Data (Bulk Replace)
app.post('/api/refdata', async (req, res) => {
    try {
        await ReferenceData.deleteMany({});
        await ReferenceData.insertMany(req.body);
        res.json({ message: 'Ref data updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save ref data' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
