// 📁 routes/orderRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Food from '../models/Food.js';
import { protectUser } from '../middleware/userAuthMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*  USER: Place Order or Request Table */
/* -------------------------------------------------------------------------- */
router.post('/orders', protectUser, async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { items, restaurantId, deliveryAddress, phone, specialInstructions, paymentMethod, reservationType } = req.body;

		if (!items || items.length === 0) return res.status(400).json({ error: 'No food items provided' });

		//  Fetch all food items and validate
		const foodIds = items.map((i) => i.foodId);
		const foods = await Food.find({ _id: { $in: foodIds } });

		if (foods.length !== items.length) return res.status(404).json({ error: 'Invalid food items' });

		const invalidFood = foods.find((f) => f.shopkeeper.toString() !== restaurantId);
		if (invalidFood)
			return res.status(400).json({
				error: `Food ${invalidFood.name} not from this restaurant`,
			});

		let totalPrice = 0;
		const processedItems = [];

		for (const item of items) {
			const food = foods.find((f) => f._id.toString() === item.foodId);
			totalPrice += food.price * (item.quantity || 1);
			processedItems.push({ food: food._id, quantity: item.quantity || 1 });
		}

		//  Create order
		const order = new Order({
			user: req.user._id,
			restaurant: restaurantId,
			items: processedItems,
			totalPrice,
			deliveryAddress,
			phone,
			specialInstructions,
			paymentMethod,
			reservationType: reservationType || 'Takeaway',
			status: reservationType === 'Dine-In' ? 'Table Requested' : 'Pending',
		});

		await order.save({ session });
		await session.commitTransaction();
		session.endSession();

		res.status(201).json({
			message: reservationType === 'Dine-In' ? 'Table request sent successfully' : 'Order placed successfully',
			order,
		});
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  USER: Get My Orders */
/* -------------------------------------------------------------------------- */
router.get('/my-orders', protectUser, async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user._id }).populate('items.food', 'name price imageUrl category').populate('restaurant', 'restaurantName').sort({ createdAt: -1 });

		const formattedOrders = orders.map((order) => ({
			_id: order._id,
			restaurant: order.restaurant,
			items: order.items,
			totalPrice: order.totalPrice,
			status: order.status,
			tableNumber: order.tableNumber || null,
			tableAssignedAt: order.tableAssignedAt || null,
			specialInstructions: order.specialInstructions || '',
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
		}));

		res.json(formattedOrders);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  SHOPKEEPER: View All Restaurant Orders */
/* -------------------------------------------------------------------------- */
router.get('/restaurant/orders', protect, async (req, res) => {
	try {
		const orders = await Order.find({ restaurant: req.shopkeeperId }).populate('user', 'name email').populate('items.food', 'name price imageUrl').select('user restaurant items totalPrice status tableNumber tableAssignedAt specialInstructions createdAt updatedAt').sort({ createdAt: -1 });

		res.json(orders);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  SHOPKEEPER: Assign Table to Order */
/* -------------------------------------------------------------------------- */
router.put('/restaurant/orders/:id/assign', protect, async (req, res) => {
	try {
		const { tableNumber } = req.body;
		const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.food', 'name price imageUrl').populate('restaurant', 'restaurantName');

		if (!order) return res.status(404).json({ error: 'Order not found' });
		if (order.restaurant._id.toString() !== req.shopkeeperId.toString()) return res.status(403).json({ error: 'Not authorized' });

		order.tableNumber = tableNumber;
		order.tableAssignedAt = new Date();
		order.status = 'Table Assigned';
		await order.save();

		const updatedOrder = await Order.findById(order._id).populate('user', 'name email').populate('items.food', 'name price imageUrl').populate('restaurant', 'restaurantName');

		res.json({
			message: ` Table ${tableNumber} assigned successfully`,
			order: updatedOrder,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  SHOPKEEPER: View All Assigned Tables */
/* -------------------------------------------------------------------------- */
router.get('/restaurant/assigned-tables', protect, async (req, res) => {
	try {
		const assignedTables = await Order.find({
			restaurant: req.shopkeeperId,
			tableNumber: { $exists: true, $ne: null },
		})
			.populate('user', 'name email')
			.populate('items.food', 'name price imageUrl')
			.populate('restaurant', 'restaurantName')
			.sort({ tableAssignedAt: -1 });

		const formatted = assignedTables.map((order) => ({
			orderId: order._id,
			tableNumber: order.tableNumber,
			customerName: order.user.name,
			customerEmail: order.user.email,
			totalPrice: order.totalPrice,
			status: order.status,
			assignedAt: order.tableAssignedAt,
			specialInstructions: order.specialInstructions,
			items: order.items.map((i) => ({
				name: i.food.name,
				price: i.food.price,
				quantity: i.quantity,
			})),
		}));

		res.json(formatted);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  USER: Cancel Own Order */
/* -------------------------------------------------------------------------- */
router.put('/orders/:id/cancel', protectUser, async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ error: 'Order not found' });
		if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

		if (order.status === 'Table Assigned')
			return res.status(400).json({
				error: 'Cannot cancel after table assignment',
			});

		order.status = 'Cancelled';
		order.cancelledBy = 'User';
		order.cancelReason = 'Cancelled by user before table assignment';
		await order.save();

		res.json({ message: 'Order cancelled successfully', order });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  SHOPKEEPER: Delete Pending Table Request */
/* -------------------------------------------------------------------------- */
router.delete('/restaurant/orders/:id', protect, async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);
		if (!order) return res.status(404).json({ error: 'Order not found' });
		if (order.restaurant.toString() !== req.shopkeeperId.toString()) return res.status(403).json({ error: 'Not authorized' });

		if (order.status === 'Table Assigned') return res.status(400).json({ error: 'Cannot delete after table assignment' });

		await order.deleteOne();
		res.json({ message: 'Order request deleted successfully' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

/* -------------------------------------------------------------------------- */
/*  SHOPKEEPER: Live Table Status (40 Tables) */
/* -------------------------------------------------------------------------- */
router.get('/restaurant/tables/status', protect, async (req, res) => {
	try {
		const assignedOrders = await Order.find({
			restaurant: req.shopkeeperId,
			status: 'Table Assigned',
		})
			.select('tableNumber user tableAssignedAt')
			.populate('user', 'name email');

		const tables = Array.from({ length: 40 }, (_, i) => {
			const tableNo = i + 1;
			const assigned = assignedOrders.find((o) => o.tableNumber === tableNo);

			return {
				tableNumber: tableNo,
				status: assigned ? 'Booked' : 'Available',
				customer: assigned ? assigned.user.name : null,
				email: assigned ? assigned.user.email : null,
				assignedAt: assigned ? assigned.tableAssignedAt : null,
			};
		});

		res.json({ success: true, tables });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
});
/* SHOPKEEPER: Mark Order as Done → Free Table */
router.put('/restaurant/orders/:id/done', protect, async (req, res) => {
	try {
		const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.food', 'name price imageUrl').populate('restaurant', 'restaurantName');

		if (!order) return res.status(404).json({ error: 'Order not found' });

		if (order.restaurant._id.toString() !== req.shopkeeperId.toString()) return res.status(403).json({ error: 'Not authorized' });

		if (order.status !== 'Table Assigned') return res.status(400).json({ error: 'Only assigned tables can be marked done' });

		// Free the table
		order.status = 'Done';
		order.tableNumber = null; 
		order.tableAssignedAt = null;
		await order.save();

		res.json({
			message: 'Order marked as done. Table is now free.',
			order,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
export default router;
