const Restaurant = require('../models/Restaurant');

// Get all restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new restaurant
exports.addRestaurant = async (req, res) => {
  const { name, address, menu } = req.body;
  try {
    const restaurant = await Restaurant.create({ name, address, menu });
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};