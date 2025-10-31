import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true },
		items: [
			{
				food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
				quantity: { type: Number, required: true },
			},
		],
		totalPrice: { type: Number, required: true },
		status: {
			type: String,
			enum: ['Pending', 'Accepted', 'Preparing', 'Delivered', 'Cancelled', 'Table Assigned', 'Table Requested','Done'],
			default: 'Pending',
		},
		tableNumber: {
			type: Number,
			default: null,
		},
		tableAssignedAt: {
			type: Date,
			default: null,
		},

		specialInstructions: {
			type: String,
			default: '',
			trim: true,
		},
		cancelledBy: {
			type: String,
			enum: ['User', 'Admin', null],
			default: null,
		},
		cancelReason: {
			type: String,
			default: null,
		},
	},

	{ timestamps: true }
);

export default mongoose.model('Order', orderSchema);
