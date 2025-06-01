const express = require('express');
const {getRestaurants, addRestaurant} = require('../controllers/restaurantController');

const router = express.Router();

router.get('/getRestaurants', getRestaurants);
router.post('/addRestaurants', addRestaurant);

module.exports = router;
