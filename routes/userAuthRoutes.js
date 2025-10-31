import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/register', async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ error: 'Please provide name, email and password' });
		}
		const exixting = await User.findOne({ email });
		if (exixting) return res.status(400).json({ error: 'Email already registered' });

		const user = await User.create({ name, email, password });
		res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email } });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ error: 'Invalid email or password' });

		const isMatch = await user.matchPassword(password);
		if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER, {
			expiresIn: '7d',
		});

		res.cookie('userToken', token, {
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
		}).json({
			message: 'Login successful',
			token, 
			user: { id: user._id, name: user.name, email: user.email },
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
