import express from 'express';
import Food from '../models/Food.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uplode.js';

const router = express.Router();

// ----------------------------
// Create a new food (shopkeeper only)
// ----------------------------
router.post('/', protect, upload.single('image'), async (req, res) => {
	try {
		const { name, price, description, category, isAvailable, imageUrl } = req.body;

		if (!name || !price) {
			return res.status(400).json({ error: 'Name and price are required.' });
		}

		const food = await Food.create({
			name,
			price,
			description,
			category,
			isAvailable,
			shopkeeper: req.shopkeeperId,
			imageUrl: imageUrl || (req.file ? `/uploads/${req.file.filename}` : ''),
		});

		res.status(201).json(food);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ----------------------------
// Get all foods for logged-in shopkeeper
// ----------------------------
router.get('/', protect, async (req, res) => {
	try {
		const foods = await Food.find({ shopkeeper: req.shopkeeperId }).sort({ createdAt: -1 });
		res.json(foods);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ----------------------------
// Get all foods (public for everyone)
// ----------------------------
router.get('/all', async (req, res) => {
	try {
		const foods = await Food.find().sort({ createdAt: -1 });
		res.json(foods);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ----------------------------
// Update a food (shopkeeper only)
// ----------------------------
router.put('/:id', protect, upload.single('image'), async (req, res) => {
	try {
		const { name, price, description, category, isAvailable, imageUrl } = req.body;

		// find the food and ensure it's owned by this shopkeeper
		const food = await Food.findOne({ _id: req.params.id, shopkeeper: req.shopkeeperId });
		if (!food) return res.status(404).json({ error: 'Food not found' });

		if (name) food.name = name;
		if (price) food.price = price;
		if (description) food.description = description;
		if (category) food.category = category;
		if (typeof isAvailable !== 'undefined') food.isAvailable = isAvailable;

		if (req.file) food.imageUrl = `/uploads/${req.file.filename}`;
		else if (imageUrl) food.imageUrl = imageUrl;

		const updated = await food.save();
		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// ----------------------------
// Delete a food (shopkeeper only)
// ----------------------------
router.delete('/:id', protect, async (req, res) => {
	try {
		const deleted = await Food.findOneAndDelete({ _id: req.params.id, shopkeeper: req.shopkeeperId });
		if (!deleted) return res.status(404).json({ error: 'Food not found' });
		res.json({ message: 'Food deleted' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ----------------------------
// Public menu for a specific shopkeeper
// ----------------------------
router.get('/public/:shopkeeperId/menu', async (req, res) => {
	try {
		const foods = await Food.find({ shopkeeper: req.params.shopkeeperId, isAvailable: true }).sort({ category: 1 });
		res.json(foods);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
