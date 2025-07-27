const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        required: true,
        enum: ['vendor', 'supplier']
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Message', MessageSchema);
