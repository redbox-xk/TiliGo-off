const express = require('express');
const router = express.Router();

const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/add', createProduct);
router.get('/list', getProducts);

module.exports = router;
