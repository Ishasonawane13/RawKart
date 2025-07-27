const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shopName: { type: String, required: true },
    phone: { type: String, required: true },
    // For simplicity, using simple coordinates. In a real app, use GeoJSON.
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true }
    }
});

module.exports = mongoose.model('Supplier', supplierSchema);