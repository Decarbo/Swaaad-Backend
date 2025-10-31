import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const protect = (req, res, next) => {
	let token;

	if (req.cookies && req.cookies.token) {
		token = req.cookies.token;
	}
	else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return res.status(401).json({ error: 'NO TOKEN PROVIDED' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.shopkeeperId = decoded.id;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
};
