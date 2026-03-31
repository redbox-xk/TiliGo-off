const express = require('express');
const router = express.Router();

const Shop = require('../models/Shop');

const createShop = async (req, res) => {
    try {
        const shop = await Shop.create(req.body);
        res.status(201).json({ success: true, data: shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getShops = async (req, res) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/', getShops);
router.post('/', createShop);
router.post('/register', createShop);
router.get('/list', getShops);

module.exports = router;
