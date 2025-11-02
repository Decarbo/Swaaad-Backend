import express from 'express';
import Shopkeeper from '../models/Shopkeeper.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { name, email, password, restaurantName } = req.body;
		const existing = await Shopkeeper.findOne({ email });
		if (existing) return res.status(400).json({ error: 'Email already registered' });
		const hashed = await bcrypt.hash(password, 10);
		const shopkeeper = await Shopkeeper.create({
			name,
			email,
			password: hashed,
			restaurantName,
		});
		const token = jwt.sign({ id: shopkeeper._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
		// res.cookie('token', token, {
		// 	httpOnly: true,
		// 	secure: false,
		// 	sameSite: 'lax',
		// 	maxAge: 24 * 60 * 60 * 1000,
		// });
		res.cookie('token', token, {
			httpOnly: true,
			secure: true, // must be true in production (Render uses HTTPS)
			sameSite: 'none', // allow cross-site cookies
			maxAge: 24 * 60 * 60 * 1000, // 1 day
		});

		res.status(201).json({
			message: 'Registration successful',
			shopkeeper: {
				id: shopkeeper._id,
				name: shopkeeper.name,
				email: shopkeeper.email,
				restaurantName: shopkeeper.restaurantName,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const shopkeeper = await Shopkeeper.findOne({ email });
		if (!shopkeeper) return res.status(404).json({ error: 'Shopkeeper not found' });

		const isMatch = await bcrypt.compare(password, shopkeeper.password);
		if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

		const token = jwt.sign({ id: shopkeeper._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

		// res.cookie('token', token, {
		// 	httpOnly: true,
		// 	secure: false,
		// 	sameSite: 'lax',
		// 	maxAge: 24 * 60 * 60 * 1000,
		// });
		res.cookie('token', token, {
			httpOnly: true,
			secure: true, // must be true in production (Render uses HTTPS)
			sameSite: 'none', // allow cross-site cookies
			maxAge: 24 * 60 * 60 * 1000, // 1 day
		});
		res.status(200).json({
			message: 'Login successful',
			shopkeeper: {
				id: shopkeeper._id,
				name: shopkeeper.name,
				email: shopkeeper.email,
				restaurantName: shopkeeper.restaurantName,
			},
			token,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,         // true for HTTPS (Render uses HTTPS)
    sameSite: 'none',     // match sameSite config used in login
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
