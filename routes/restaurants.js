const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get all restaurants with filtering and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("search").optional().trim().isLength({ min: 1 }).withMessage("Search term cannot be empty"),
    query("cuisine").optional().trim().isLength({ min: 1 }).withMessage("Cuisine cannot be empty"),
    query("featured").optional().isBoolean().withMessage("Featured must be a boolean"),
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
      const filter = { status: "active" }

      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
          { cuisine: { $in: [new RegExp(req.query.search, "i")] } },
        ]
      }

      if (req.query.cuisine) {
        filter.cuisine = { $in: [req.query.cuisine] }
      }

      // Get restaurants
      const restaurants = await Restaurant.find(filter)
        .populate("owner", "firstName lastName email")
        .select("-menu") // Exclude menu for list view
        .sort({ "rating.average": -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Get total count for pagination
      const total = await Restaurant.countDocuments(filter)
      const totalPages = Math.ceil(total / limit)

      // Add review count to each restaurant
      const restaurantsWithReviewCount = restaurants.map((restaurant) => ({
        ...restaurant.toObject(),
        reviewCount: restaurant.rating.count || 0,
      }))

      res.json({
        success: true,
        data: {
          restaurants: restaurantsWithReviewCount,
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
      console.error("Get restaurants error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to fetch restaurants",
        error: error.message,
      })
    }
  },
)

// Get restaurant by slug
router.get("/:slug", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      status: "active",
    }).populate("owner", "firstName lastName email")

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    res.json({
      success: true,
      data: {
        restaurant,
      },
    })
  } catch (error) {
    console.error("Get restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant",
      error: error.message,
    })
  }
})

// Create restaurant (admin only)
router.post(
  "/",
  adminAuth,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Restaurant name must be at least 2 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("cuisine").isArray({ min: 1 }).withMessage("At least one cuisine type is required"),
    body("location.address").trim().notEmpty().withMessage("Address is required"),
    body("location.city").trim().notEmpty().withMessage("City is required"),
    body("location.state").trim().notEmpty().withMessage("State is required"),
    body("location.coordinates.latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
    body("location.coordinates.longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
    body("contact.phone").trim().notEmpty().withMessage("Phone number is required"),
    body("deliveryInfo.fee").isFloat({ min: 0 }).withMessage("Delivery fee must be a positive number"),
    body("deliveryInfo.time").trim().notEmpty().withMessage("Delivery time is required"),
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

      const restaurantData = {
        ...req.body,
        owner: req.user._id,
      }

      const restaurant = new Restaurant(restaurantData)
      await restaurant.save()

      res.status(201).json({
        success: true,
        message: "Restaurant created successfully",
        data: {
          restaurant,
        },
      })
    } catch (error) {
      console.error("Create restaurant error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create restaurant",
        error: error.message,
      })
    }
  },
)

module.exports = router
