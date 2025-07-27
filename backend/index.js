// backend/index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- 1. Import Routes ---
// These files contain the logic for specific parts of our API
const dealRoutes = require('./routes/dealRoutes'); // Handles finding deals
const userRoutes = require('./routes/userRoutes'); // Handles user registration and login

// --- 2. Initialize Application ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- 3. Configure Middleware ---
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON request bodies

// --- 4. Database Connection ---
// IMPORTANT: Replace with your actual MongoDB connection string
const MONGO_URI = 'YOUR_MONGODB_CONNECTION_STRING'; 
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// --- 5. Define API Routes ---
// Tell Express to use the imported route files.
// Any request to '/api/users' will be handled by userRoutes.
// Any request to '/api/deals' will be handled by dealRoutes.
app.use('/api/users', userRoutes);
app.use('/api/deals', dealRoutes);

// Root endpoint for basic server status check
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the RawKart API!' });
});

// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`RawKart server is running on port ${PORT}`);
});
