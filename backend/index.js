// index.js - The entry point for our RawKart backend server

// Load environment variables first
require('dotenv').config();

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
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
// --------------------

const app = express();
const server = http.createServer(app);

// --- Initialize Socket.io ---
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ["https://your-vercel-domain.vercel.app", "https://rawkart-app.vercel.app"]
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

// Configure Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ["https://your-vercel-domain.vercel.app", "https://rawkart-app.vercel.app"]
        : "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Make Socket.io instance available to routes
app.set('io', io);

// --- THIS IS THE SECOND PART OF THE FIX ---
// 2. Create a middleware to attach the registered models to every request.
// This ensures that our route files will always have access to them.
app.use((req, res, next) => {
    req.models = {
        User,
        Inventory,
        Order,
        Message,
        ChatRoom
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
    socket.on('join_room', async (data) => {
        socket.join(data.room);
        console.log(`User with ID: ${socket.id} joined room: ${data.room} as ${data.userRole}`);

        // Send previous messages to the user who just joined
        try {
            const previousMessages = await Message.find({ room: data.room })
                .sort({ timestamp: 1 })
                .limit(50); // Limit to last 50 messages

            if (previousMessages.length > 0) {
                socket.emit('previous_messages', previousMessages);
            }
        } catch (error) {
            console.error('Error loading previous messages:', error);
        }
    });

    // Logic to handle sending a message
    socket.on('send_message', async (data) => {
        try {
            console.log(`📨 Message received from ${data.author} in room ${data.room}: ${data.message}`);

            // Save message to database
            const newMessage = new Message({
                room: data.room,
                sender: data.author,
                senderRole: data.senderRole || 'vendor',
                message: data.message,
                timestamp: new Date()
            });

            await newMessage.save();
            console.log(`💾 Message saved to database`);

            // Broadcast the message to everyone in the room
            const messageData = {
                ...data,
                _id: newMessage._id,
                timestamp: newMessage.timestamp
            };

            // Send to all users in the room (including sender)
            io.to(data.room).emit('receive_message', messageData);
            console.log(`📤 Message broadcasted to room ${data.room}`);

        } catch (error) {
            console.error('Error saving/broadcasting message:', error);
            // Still broadcast even if save fails
            socket.to(data.room).emit('receive_message', data);
        }
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
app.use('/api/users', require('./routes/users'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));


// Start the Server (use server.listen instead of app.listen)
server.listen(PORT, () => {
    console.log(`🚀 Server is listening with purpose on port ${PORT}`);
});
