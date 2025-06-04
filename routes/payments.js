const express = require("express")
const { body, validationResult } = require("express-validator")
const Order = require("../models/Order")
const { auth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// Process bank transfer
router.post(
  "/bank-transfer",
  auth,
  [
    body("orderNumber").trim().notEmpty().withMessage("Order number is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
    body("customerEmail").isEmail().withMessage("Valid customer email is required"),
    body("reference").trim().notEmpty().withMessage("Transfer reference is required"),
    body("bankAccount").trim().notEmpty().withMessage("Bank account is required"),
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

      const { orderNumber, amount, customerEmail, reference, bankAccount } = req.body

      // Find the order
      const order = await Order.findOne({ orderNumber })
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Verify order belongs to user (unless admin)
      if (req.user.role !== "admin" && order.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Update order with bank transfer details
      order.payment.method = "bank_transfer"
      order.payment.reference = reference
      order.payment.bankTransfer = {
        amount,
        reference,
        confirmed: false,
        transferDate: new Date(),
      }

      // Add timeline entry
      order.timeline.push({
        status: "payment_initiated",
        note: `Bank transfer initiated with reference: ${reference}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      })

      await order.save()

      res.json({
        success: true,
        message: "Bank transfer details recorded successfully",
        data: {
          reference,
          orderNumber,
          amount,
        },
      })
    } catch (error) {
      console.error("Bank transfer error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to process bank transfer",
        error: error.message,
      })
    }
  },
)

// Confirm payment (admin only)
router.post(
  "/confirm",
  adminAuth,
  [
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
    body("adminId").optional().isMongoId().withMessage("Valid admin ID required"),
    body("adminName").optional().trim().notEmpty().withMessage("Admin name required"),
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

      const { orderId } = req.body

      const order = await Order.findById(orderId)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Update payment status
      order.payment.status = "confirmed"

      if (order.payment.bankTransfer) {
        order.payment.bankTransfer.confirmed = true
        order.payment.bankTransfer.confirmationDate = new Date()
        order.payment.bankTransfer.confirmedBy = req.user._id
      }

      // Update order status if still pending
      if (order.status === "pending") {
        order.status = "confirmed"
      }

      // Add timeline entry
      order.timeline.push({
        status: "payment_confirmed",
        note: `Payment confirmed by admin: ${req.user.firstName} ${req.user.lastName}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      })

      await order.save()

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          order,
        },
      })
    } catch (error) {
      console.error("Confirm payment error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to confirm payment",
        error: error.message,
      })
    }
  },
)

module.exports = router
