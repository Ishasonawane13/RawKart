// index.js - The entry point for our RawKart backend server

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require("socket.io");

// --- THIS IS THE FIX ---
// 1. Import all models directly here, once. This registers them with Mongoose.
const User = require('./models/User');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
// --------------------

const app = express();
const server = http.createServer(app);

// --- Initialize Socket.io ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow connections from our React frontend
        methods: ["GET", "POST"]
    }
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// Configure Middleware
app.use(cors());
app.use(express.json());

// Make Socket.io instance available to routes
app.set('io', io);

// --- THIS IS THE SECOND PART OF THE FIX ---
// 2. Create a middleware to attach the registered models to every request.
// This ensures that our route files will always have access to them.
app.use((req, res, next) => {
    req.models = {
        User,
        Inventory,
        Order
    };
    next();
});
// ----------------------------------------

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    // Handle user joining their personal notification room (for suppliers)
    socket.on('join_user_room', (data) => {
        if (data.userId && data.role) {
            const userRoom = `${data.role}_${data.userId}`;
            socket.join(userRoom);
            console.log(`User ${socket.id} joined personal room: ${userRoom}`);
        }
    });

    // Logic to handle joining a chat room
    socket.on('join_room', (data) => {
        socket.join(data.room);
        console.log(`User with ID: ${socket.id} joined room: ${data.room}`);

        // Notify the room that supplier has joined (enables vendor messaging)
        if (data.userRole === 'supplier') {
            socket.to(data.room).emit('supplier_joined', {
                message: 'Supplier has joined the chat. You can now send messages.',
                room: data.room
            });
        }
    });

    // Logic to handle sending a message
    socket.on('send_message', (data) => {
        // Broadcast the received message to everyone in the same room
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});


// Define API Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the RawKart API!',
        status: 'Server is running successfully.',
        timestamp: new Date().toISOString()
    });
});

// Use the defined routes
app.use('/api/users', require('./routes/Users'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/orders', require('./routes/orders'));


// Start the Server (use server.listen instead of app.listen)
server.listen(PORT, () => {
    console.log(`🚀 Server is listening with purpose on port ${PORT}`);
});
