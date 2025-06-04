const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Order = require("../models/Order")
const Restaurant = require("../models/Restaurant")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Create new order
router.post(
  "/",
  auth,
  [
    body("restaurantId").isMongoId().withMessage("Valid restaurant ID is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.menuItemId").notEmpty().withMessage("Menu item ID is required"),
    body("items.*.name").trim().notEmpty().withMessage("Item name is required"),
    body("items.*.price").isFloat({ min: 0 }).withMessage("Item price must be a positive number"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Item quantity must be at least 1"),
    body("deliveryAddress.name").trim().notEmpty().withMessage("Delivery name is required"),
    body("deliveryAddress.street").trim().notEmpty().withMessage("Street address is required"),
    body("deliveryAddress.city").trim().notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").trim().notEmpty().withMessage("State is required"),
    body("pricing.subtotal").isFloat({ min: 0 }).withMessage("Subtotal must be a positive number"),
    body("pricing.deliveryFee").isFloat({ min: 0 }).withMessage("Delivery fee must be a positive number"),
    body("pricing.serviceFee").isFloat({ min: 0 }).withMessage("Service fee must be a positive number"),
    body("pricing.tax").isFloat({ min: 0 }).withMessage("Tax must be a positive number"),
    body("pricing.total").isFloat({ min: 0 }).withMessage("Total must be a positive number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      // Verify restaurant exists
      const restaurant = await Restaurant.findById(req.body.restaurantId)
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      // Create order
      const orderData = {
        ...req.body,
        customer: req.user._id,
        restaurant: req.body.restaurantId,
      }

      const order = new Order(orderData)

      // Add initial timeline entry
      order.timeline.push({
        status: "pending",
        note: "Order placed successfully",
        timestamp: new Date(),
      })

      await order.save()

      // Populate order with customer and restaurant details
      await order.populate([
        { path: "customer", select: "firstName lastName email phoneNumber" },
        { path: "restaurant", select: "name images contact" },
      ])

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          order,
        },
      })
    } catch (error) {
      console.error("Create order error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      })
    }
  },
)

// Get orders (with filtering for admin/customer)
router.get(
  "/",
  auth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    query("search").optional().trim().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const page = Number.parseInt(req.query.page) || 1
      const limit = Number.parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      // Build filter object
      const filter = {}

      // If not admin, only show user's orders
      if (req.user.role !== "admin") {
        filter.customer = req.user._id
      }

      if (req.query.status) {
        filter.status = req.query.status
      }

      if (req.query.search) {
        filter.$or = [{ orderNumber: { $regex: req.query.search, $options: "i" } }]
      }

      // Get orders
      const orders = await Order.find(filter)
        .populate("customer", "firstName lastName email phoneNumber")
        .populate("restaurant", "name images contact")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Get total count for pagination
      const total = await Order.countDocuments(filter)
      const totalPages = Math.ceil(total / limit)

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      })
    } catch (error) {
      console.error("Get orders error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      })
    }
  },
)

// Get single order
router.get("/:id", auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id }

    // If not admin, only allow access to own orders
    if (req.user.role !== "admin") {
      filter.customer = req.user._id
    }

    const order = await Order.findOne(filter)
      .populate("customer", "firstName lastName email phoneNumber")
      .populate("restaurant", "name images contact location")
      .populate("timeline.updatedBy", "firstName lastName")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      data: {
        order,
      },
    })
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    })
  }
})

// Update order status (admin only)
router.patch(
  "/:id/status",
  adminAuth,
  [
    body("status")
      .isIn(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    body("note").optional().trim().isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { status, note } = req.body

      const order = await Order.findById(req.params.id)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Update status
      order.status = status

      // Add timeline entry
      order.timeline.push({
        status,
        note: note || `Order status updated to ${status}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      })

      // Set delivery time if delivered
      if (status === "delivered") {
        order.actualDeliveryTime = new Date()
      }

      await order.save()

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: {
          order,
        },
      })
    } catch (error) {
      console.error("Update order status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      })
    }
  },
)

// Update order payment
router.patch(
  "/:id/payment",
  auth,
  [
    body("paymentReference").trim().notEmpty().withMessage("Payment reference is required"),
    body("status").isIn(["pending", "confirmed", "failed"]).withMessage("Invalid payment status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { paymentReference, status } = req.body

      const filter = { _id: req.params.id }

      // If not admin, only allow access to own orders
      if (req.user.role !== "admin") {
        filter.customer = req.user._id
      }

      const order = await Order.findOne(filter)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Update payment information
      order.payment.reference = paymentReference
      order.payment.status = status

      // Add timeline entry
      order.timeline.push({
        status: "payment_updated",
        note: `Payment reference updated: ${paymentReference}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      })

      await order.save()

      res.json({
        success: true,
        message: "Payment information updated successfully",
        data: {
          order,
        },
      })
    } catch (error) {
      console.error("Update payment error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update payment information",
        error: error.message,
      })
    }
  },
)

module.exports = router
