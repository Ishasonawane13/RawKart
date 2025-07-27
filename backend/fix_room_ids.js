// Quick script to fix old room IDs in the database
const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for cleanup');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const fixRoomIds = async () => {
    try {
        // Find all orders with timestamp-based room IDs
        const orders = await Order.find({
            chatRoomId: { $regex: /_\d{13}$/ } // Matches room IDs ending with 13-digit timestamp
        });

        console.log(`Found ${orders.length} orders with timestamp-based room IDs`);

        for (const order of orders) {
            // Remove the timestamp part from the room ID
            const newRoomId = order.chatRoomId.replace(/_\d{13}$/, '');

            console.log(`Updating order ${order._id}: ${order.chatRoomId} → ${newRoomId}`);

            await Order.findByIdAndUpdate(order._id, {
                chatRoomId: newRoomId
            });
        }

        console.log('✅ All room IDs have been fixed!');
    } catch (error) {
        console.error('Error fixing room IDs:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the fix
connectDB().then(() => {
    fixRoomIds();
});
