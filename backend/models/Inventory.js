// file: backend/models/Inventory.js

const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    // Link to the user who is the supplier of this item.
    // This is a crucial link between the 'users' collection and this 'inventory' collection.
    itemName: {
        type: String,
        required: true,
    },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    // e.g., "per Kg", "per Litre", "per Dozen"
    unit: {
        type: String,
        required: true,
        default: 'per Kg'
    },
    // The supplier's standard selling price.
    price: {
        type: Number,
        required: true,
    },
    // The lowest price the supplier is willing to go (for our AI engine).
    minPrice: {
        type: Number,
        required: true,
    },
    // The amount of stock the supplier currently has.
    quantity: {
        type: Number,
        required: true,
    },
    dateAdded: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('Inventory', InventorySchema);
