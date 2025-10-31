import mongoose from 'mongoose';

const shopkeeperSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		restaurantName: { type: String, required: true },
	},
	{ timestamps: true }
);

export default mongoose.model('Shopkeeper', shopkeeperSchema, 'shopkeepers');
