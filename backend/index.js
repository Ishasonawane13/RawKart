// index.js - The entry point for our RawKart backend server

// --- 1. Import Dependencies ---
// Express is the web framework for Node.js that simplifies building web applications and APIs.
const express = require('express');
// CORS is a middleware to enable Cross-Origin Resource Sharing. 
// This is crucial for allowing our React frontend (running on a different port) to communicate with this backend.
const cors = require('cors');

// --- 2. Initialize the Application ---
// Create an instance of the Express application.
const app = express();
// Define the port the server will run on. We use an environment variable for flexibility in deployment,
// or default to 5000 for local development.
const PORT = process.env.PORT || 5000;

// --- 3. Configure Middleware ---
// Use the CORS middleware to allow requests from any origin.
// In a production environment, you would restrict this to your frontend's domain for security.
app.use(cors());
// Use the express.json() middleware. This allows our server to automatically parse
// incoming requests with JSON payloads, making it easy to work with data sent from the frontend.
app.use(express.json());

// --- 4. Define API Routes ---
// Here we will define all our API endpoints. For now, we'll create a single root endpoint
// to test that the server is running correctly.

/**
 * @route   GET /
 * @desc    Root endpoint to check server status.
 * @access  Public
 */
app.get('/', (req, res) => {
    // When a GET request is made to the root URL, send a JSON response.
    res.json({
        message: 'Welcome to the RawKart API!',
        status: 'Server is running successfully.',
        timestamp: new Date().toISOString()
    });
});

// We will add our other routes here later (e.g., for users, inventory, chat)
// app.use('/api/users', require('./routes/users'));
// app.use('/api/inventory', require('./routes/inventory'));
// app.use('/api/ai', require('./routes/ai'));


// --- 5. Start the Server ---
// Start the server and make it listen for incoming requests on the specified port.
app.listen(PORT, () => {
    // Log a message to the console once the server is successfully running.
    // This is helpful for development and debugging.
    console.log(`Server is listening with purpose on port ${PORT}`);
});
