const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get chat messages for a room
router.get('/:roomId', auth, async (req, res) => {
    try {
        const { Message } = req.models;
        const { roomId } = req.params;
        const { limit = 50, page = 1 } = req.query;

        const messages = await Message.find({ room: roomId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit);

        res.json({
            success: true,
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: await Message.countDocuments({ room: roomId })
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat messages',
            error: error.message
        });
    }
});

// Mark messages as read
router.put('/read/:roomId', auth, async (req, res) => {
    try {
        const { Message } = req.models;
        const { roomId } = req.params;

        await Message.updateMany(
            { room: roomId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read',
            error: error.message
        });
    }
});

module.exports = router;
