const express = require("express")
const { query } = require("express-validator")
const Order = require("../models/Order")
const User = require("../models/User")
const Restaurant = require("../models/Restaurant")
const { adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get dashboard stats
router.get("/dashboard/stats", adminAuth, async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalRestaurants, recentOrders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Restaurant.countDocuments({ status: "active" }),
      Order.find()
        .populate("customer", "firstName lastName email")
        .populate("restaurant", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ])

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { "payment.status": "confirmed" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ])
    const totalRevenue = revenueResult[0]?.total || 0

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalUsers,
          totalRestaurants,
          totalRevenue,
        },
        recentOrders,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    })
  }
})

// Get all customers
router.get("/customers", adminAuth, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments({ role: "customer" })

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get customers error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    })
  }
})

module.exports = router
