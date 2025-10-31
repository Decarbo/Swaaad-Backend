import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import userOrderRoutes from './routes/userOrderRoutes.js';
import cookieParser from 'cookie-parser';
import userAuthRoutes from './routes/userAuthRoutes.js';
import userFoodRoutes from './routes/userFoodRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use('/uploads', express.static('uploads'));

app.use(cookieParser());
app.use(express.json());

app.use(
	cors({
		origin: ['http://localhost:5173', 'http://localhost:3000',"https://swaaad-eight.vercel.app"],
		credentials: true,
	})
);

// Routes shopkeeper
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/user', userOrderRoutes);

// Routes user
app.use('/api/auth/user', userAuthRoutes);
app.use('/api/foods/user', userFoodRoutes);

app.get('/', (req, res) => res.send('Restaurant API is running'));

// DB connection
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log(' Connected to MongoDB Atlas'))
	.catch((err) => console.log(' Not connected:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
