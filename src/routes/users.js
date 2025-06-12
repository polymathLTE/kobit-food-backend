const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    })
  }
})

// Update user profile
router.put(
  "/profile",
  auth,
  [
    body("firstName").optional().trim().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
    body("lastName").optional().trim().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
    body("phoneNumber").optional().isMobilePhone().withMessage("Please enter a valid phone number"),
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

      const { firstName, lastName, phoneNumber } = req.body

      const user = await User.findById(req.user._id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Update fields
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
      if (phoneNumber) user.phoneNumber = phoneNumber

      await user.save()

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user,
        },
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      })
    }
  },
)

// Add address
router.post(
  "/addresses",
  auth,
  [
    body("name").trim().notEmpty().withMessage("Address name is required"),
    body("street").trim().notEmpty().withMessage("Street address is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("zipCode").optional().trim(),
    body("coordinates.latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("coordinates.longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
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

      const user = await User.findById(req.user._id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const newAddress = req.body

      // If this is set as default, unset other defaults
      if (newAddress.isDefault) {
        user.addresses.forEach((addr) => (addr.isDefault = false))
      }

      user.addresses.push(newAddress)
      await user.save()

      res.status(201).json({
        success: true,
        message: "Address added successfully",
        data: {
          user,
        },
      })
    } catch (error) {
      console.error("Add address error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to add address",
        error: error.message,
      })
    }
  },
)

module.exports = router
