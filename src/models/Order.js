const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Delivered, etc.
});

module.exports = mongoose.model('Order', orderSchema);
