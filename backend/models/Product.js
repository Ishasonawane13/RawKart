const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Link to the supplier who sells this product
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    productName: { type: String, required: true, index: true }, // Index for fast searching
    mrp: { type: Number, required: true }, // Max Retail Price
    currentPrice: { type: Number, required: true }, // The actual current price
    minPrice: { type: Number, required: true }, // The secret floor price
    unit: { type: String, enum: ['kg', 'litre', 'packet'], required: true },
    stock: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);