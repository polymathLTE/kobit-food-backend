const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', createOrder); // Place a new order
router.get('/', getOrders); // Fetch all orders
router.get('/:id', getOrderById); // Fetch one order by ID
router.patch('/:id', updateOrderStatus); // Update order status
router.delete('/:id', deleteOrder); // Delete an order

module.exports = router;