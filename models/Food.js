import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		price: { type: Number, required: true },
		description: { type: String, default: '' },
		category: { type: String, default: 'General' },
		isAvailable: { type: Boolean, default: true },
		imageUrl: { type: String, default: '' },

		shopkeeper: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Shopkeeper',
			required: true,
		},
		isSpecial: { type: Boolean, default: false },

		tags: [{ type: String }],
	},
	{ timestamps: true }
);

export default mongoose.model('Food', foodSchema);
