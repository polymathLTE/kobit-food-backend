const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get menu items for a restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId).select("menu name")

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    res.json({
      success: true,
      data: {
        menu: restaurant.menu || [],
        restaurantName: restaurant.name,
      },
    })
  } catch (error) {
    console.error("Get menu error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu",
      error: error.message,
    })
  }
})

// Add menu item (admin only)
router.post(
  "/restaurant/:restaurantId/items",
  adminAuth,
  [
    body("name").trim().notEmpty().withMessage("Item name is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("description").optional().trim(),
    body("ingredients").optional().isArray(),
    body("preparationTime").optional().isInt({ min: 1 }),
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

      const restaurant = await Restaurant.findById(req.params.restaurantId)
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      const newItem = {
        ...req.body,
        id: Date.now().toString(), // Simple ID generation
        available: true,
        createdAt: new Date(),
      }

      restaurant.menu.push(newItem)
      await restaurant.save()

      res.status(201).json({
        success: true,
        message: "Menu item added successfully",
        data: { item: newItem },
      })
    } catch (error) {
      console.error("Add menu item error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to add menu item",
        error: error.message,
      })
    }
  },
)

module.exports = router
