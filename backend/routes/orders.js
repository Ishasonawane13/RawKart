// file: backend/routes/orders.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the logged-in user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { vendor: req.user.id },
                { supplier: req.user.id }
            ]
        })
            .populate('vendor', 'name mobile')
            .populate('supplier', 'name mobile')
            .populate('inventoryItem', 'itemName price unit')
            .sort({ date: -1 });

        res.json(orders);
    } catch (err) {
        console.error('Orders fetch error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { supplierId, inventoryItemId, chatRoomId } = req.body;

        if (!supplierId || !inventoryItemId || !chatRoomId) {
            return res.status(400).json({ message: 'Please provide supplier, inventory item, and chat room ID' });
        }

        // Check for existing active order for this vendor, supplier, and item
        const existingOrder = await Order.findOne({
            vendor: req.user.id,
            supplier: supplierId,
            inventoryItem: inventoryItemId,
            status: { $ne: 'closed' } // or whatever status means deleted/closed
        });

        if (existingOrder) {
            // Already exists, return the existing order
            return res.status(200).json({
                message: 'Request already exists',
                order: existingOrder
            });
        }

        const newOrder = new Order({
            vendor: req.user.id,
            supplier: supplierId,
            inventoryItem: inventoryItemId,
            chatRoomId: chatRoomId // Use the chatRoomId from frontend
        });

        const order = await newOrder.save();

        // Populate the order before sending response
        const populatedOrder = await Order.findById(order._id)
            .populate('vendor', 'name mobile')
            .populate('supplier', 'name mobile')
            .populate('inventoryItem', 'itemName price unit');

        // Get the Socket.io instance and emit real-time notification to supplier
        const io = req.app.get('io');
        if (io) {
            // Create a supplier-specific room for notifications
            const supplierRoom = `supplier_${supplierId}`;
            io.to(supplierRoom).emit('new_order', {
                order: populatedOrder,
                message: `New purchase request from ${populatedOrder.vendor.name} for ${populatedOrder.inventoryItem.itemName}`
            });
        }

        res.status(201).json(populatedOrder);
    } catch (err) {
        console.error('Order creation error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/orders/supplier
 * @desc    Get all orders for the logged-in supplier
 * @access  Private (Supplier)
 */
router.get('/supplier', auth, async (req, res) => {
    try {
        // Find orders and populate details from other collections
        const orders = await Order.find({ supplier: req.user.id })
            .populate('vendor', 'name') // Get vendor's name
            .populate({
                path: 'inventoryItem',
                select: 'itemName' // Get the item name from the inventory
            })
            .sort({ date: -1 }); // Show newest orders first

        res.json(orders);
    } catch (err) {
        console.error('Supplier orders fetch error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/orders/:orderId
 * @desc    Delete an order (only supplier can delete their orders)
 * @access  Private (Supplier)
 */
router.delete('/:orderId', auth, async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Find the order and check if the current user is the supplier
        const order = await Order.findById(orderId)
            .populate('vendor', 'name')
            .populate('inventoryItem', 'itemName');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the current user is the supplier of this order
        if (order.supplier.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. Only the supplier can delete this order.' });
        }

        // Get the Socket.io instance from the app
        const io = req.app.get('io');

        // Notify the vendor that the chat has been closed
        if (io) {
            io.to(order.chatRoomId).emit('chat_closed', {
                message: `The supplier has closed this chat for ${order.inventoryItem.itemName}`,
                orderId: order._id,
                inventoryItem: order.inventoryItem,
                supplier: order.supplier
            });
        }

        // Delete the order
        await Order.findByIdAndDelete(orderId);

        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error('Order deletion error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/orders/vendor
 * @desc    Get all orders for the logged-in vendor
 * @access  Private (Vendor)
 */
router.get('/vendor', auth, async (req, res) => {
    try {
        const orders = await Order.find({ vendor: req.user.id })
            .populate('supplier', 'name')
            .populate({
                path: 'inventoryItem',
                select: 'itemName'
            })
            .sort({ date: -1 });

        res.json(orders);
    } catch (err) {
        console.error('Vendor orders fetch error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
