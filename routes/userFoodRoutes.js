import express from "express";
import Food from "../models/Food.js";

const router = express.Router();

// 1Get all available foods (Public)
router.get("/foods", async (req, res) => {
	try {
		const foods = await Food.find().populate("shopkeeper", "restaurantName");
		res.json(foods);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// 2 Get single food detail
router.get("/foods/:id", async (req, res) => {
	try {
		const food = await Food.findById(req.params.id).populate("shopkeeper", "restaurantName");
		if (!food) return res.status(404).json({ error: "Food not found" });
		res.json(food);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
