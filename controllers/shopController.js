const Shop = require('../models/Shop');

exports.registerShop = async (req, res) => {
  try {
    const { name, owner, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Shop name required' });
    }

    const shop = await Shop.create({ name, owner, email });

    res.status(201).json({
      success: true,
      shop
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
