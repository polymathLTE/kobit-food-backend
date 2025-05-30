const express = require('express');
const {getRestaurants, addRestaurants}

const router = express.Router();

router.get('/', getRestaurants);
router.post('/', addRestaurants);

module.exports = router;