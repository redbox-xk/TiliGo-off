const Product = require('../models/Product');

exports.addProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name required' });
    }

    const product = await Product.create({ name, price, stock });

    res.status(201).json({
      success: true,
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
