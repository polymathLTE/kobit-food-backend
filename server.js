const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")
require("dotenv").config()

const app = express()

// Import routes
const authRoutes = require("./src/routes/auth")
const restaurantRoutes = require("./src/routes/restaurants")
const orderRoutes = require("./src/routes/orders")
const userRoutes = require("./src/routes/users")
const paymentRoutes = require("./src/routes/payments")

// Security middleware
app.use(helmet())
app.use(morgan("combined"))

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
})
app.use("/api/", limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", JSON.stringify(req.body, null, 2))
  }
  next()
})

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas")
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  })

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KOBIT API Server",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      restaurants: "/api/restaurants",
      orders: "/api/orders",
      payments: "/api/payments",
      health: "/api/health",
    },
  })
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KOBIT Backend API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// API Routes - Mount all routes under /api prefix
app.use("/api/auth", authRoutes)
app.use("/api/restaurants", restaurantRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/users", userRoutes)
app.use("/api/payments", paymentRoutes)

// Global error handler (must be before 404 handler)
app.use((error, req, res, next) => {
  console.error("❌ Error:", error)

  // Handle specific error types
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(error.errors).map((err) => err.message),
    })
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    })
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value",
    })
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
})

// 404 handler - This should be LAST
app.use("*", (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      auth: "/api/auth (POST /login, /register, GET /profile)",
      users: "/api/users (GET /profile, PUT /profile, POST /addresses)",
      restaurants: "/api/restaurants (GET /, GET /:slug, POST /)",
      orders: "/api/orders (GET /, POST /, GET /:id, PATCH /:id/status, PATCH /:id/payment)",
      payments: "/api/payments (POST /bank-transfer, POST /confirm)",
      health: "/api/health (GET)",
    },
    tip: "Make sure your frontend is making requests to the correct endpoints with /api prefix",
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 KOBIT Backend Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`)
})

module.exports = app
