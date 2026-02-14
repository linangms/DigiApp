require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const Assessment = require('./models/Assessment');
const ReferenceData = require('./models/ReferenceData');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database (Handled in startServer)
// connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Basic Authentication
const basicAuth = require('express-basic-auth');
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'password';

const authUsers = {};
authUsers[adminUser] = adminPass;

app.use(basicAuth({
    users: authUsers,
    challenge: true
}));

app.use(express.static(path.join(__dirname)));

// --- API Endpoints ---

// Health Check
app.get('/health', (req, res) => res.send('API is running'));

// Explicit Root Route (Fallback)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
        res.status(500).json({ error: 'Failed to create assessment: ' + err.message });
    }
});

// Update Assessment
app.put('/api/assessments/:id', async (req, res) => {
    try {
        const updated = await Assessment.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { returnDocument: 'after' } // Updated to fix deprecation warning
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
// Start Server Logic
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB. Server starting without DB (Offline Mode possible, but saving will fail).');
        console.error(err);
        // We still start the server so the UI is accessible, but DB ops will fail
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} (NO DATABASE)`);
        });
    }
};

startServer();
