require("dotenv").config();

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


const User = require("../src/models/User")
const Restaurant = require("../src/models/Restaurant")

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Restaurant.deleteMany({})
    console.log("Cleared existing data")

    // Create admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@kobit.com",
      password: "admin123",
      role: "admin",
      phoneNumber: "+2348012345678",
    })
    await adminUser.save()
    console.log("Admin user created")

    // Create sample customer
    const customer = new User({
      firstName: "John",
      lastName: "Doe",
      email: "customer@kobit.com",
      password: "customer123",
      role: "customer",
      phoneNumber: "+2348087654321",
    })
    await customer.save()
    console.log("Sample customer created")

    // Create sample restaurants
    const restaurants = [
      {
        name: "Iya-Oge Buka",
        slug: "Swallow-joint",
        description: "Authentic Nigerian home cooking with traditional recipes passed down through generations",
        cuisine: ["Nigerian", "African"],
        owner: adminUser._id,
        location: {
          address: "Ijanikin Lagos",
          city: "Lagos",
          state: "Lagos",
          zipCode: "101001",
          coordinates: {
            latitude: 6.4281,
            longitude: 3.4219,
          },
        },
        contact: {
          phone: "+2348012345678",
          email: "femmi.k33@gmail.com",
        },
        menu: [
          {
            name: "Jollof Rice with Chicken",
            description: "Spicy Nigerian rice dish with tender grilled chicken",
            price: 3500,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 25,
            ingredients: ["Rice", "Chicken", "Tomatoes", "Onions", "Spices"],
          },
          {
            name: "Moi Moi",
            description: "Steamed bean pudding with fish and eggs",
            price: 1500,
            category: "Sides",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 15,
            ingredients: ["Black-eyed beans", "Fish", "Eggs", "Palm oil"],
          },
          {
            name: "Pounded Yam with Egusi",
            description: "Traditional pounded yam served with rich egusi soup",
            price: 4000,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 30,
            ingredients: ["Yam", "Egusi seeds", "Meat", "Fish", "Vegetables"],
          },
          {
            name: "Suya",
            description: "Grilled spiced meat skewers",
            price: 2000,
            category: "Appetizer",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 20,
            ingredients: ["Beef", "Suya spice", "Onions", "Tomatoes"],
          },
          {
            name: "Chapman",
            description: "Nigerian cocktail drink",
            price: 1000,
            category: "Beverages",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 5,
            ingredients: ["Fanta", "Sprite", "Grenadine", "Cucumber", "Orange"],
          },
        ],
        rating: {
          average: 4.5,
          count: 127,
        },
        deliveryInfo: {
          fee: 500,
          time: "30-45 min",
          radius: 15,
          minimumOrder: 2000,
        },
        features: {
          hasCustomMeals: true,
          acceptsOnlinePayment: true,
          hasDelivery: true,
          hasPickup: true,
        },
        status: "active",
        isVerified: true,
      },
      {
        name: "Dele Foods",
        slug: "dele-foods",
        description: "Premium grilled dishes and continental cuisine",
        cuisine: ["Continental", "Grilled"],
        owner: adminUser._id,
        location: {
          address: "456 Ikoyi Road, Ikoyi",
          city: "Lagos",
          state: "Lagos",
          zipCode: "101001",
          coordinates: {
            latitude: 6.4474,
            longitude: 3.4553,
          },
        },
        contact: {
          phone: "+2348087654321",
          email: "info@lagosgrill.com",
        },
        menu: [
          {
            name: "Grilled Chicken Breast",
            description: "Tender grilled chicken breast with herbs and spices",
            price: 4500,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 25,
            ingredients: ["Chicken breast", "Herbs", "Spices", "Olive oil"],
          },
          {
            name: "Beef Steak",
            description: "Juicy beef steak cooked to perfection",
            price: 6000,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 30,
            ingredients: ["Beef", "Black pepper", "Garlic", "Butter"],
          },
          {
            name: "Caesar Salad",
            description: "Fresh romaine lettuce with caesar dressing",
            price: 2500,
            category: "Salads",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 10,
            ingredients: ["Romaine lettuce", "Croutons", "Parmesan", "Caesar dressing"],
          },
          {
            name: "French Fries",
            description: "Crispy golden french fries",
            price: 1500,
            category: "Sides",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 15,
            ingredients: ["Potatoes", "Salt", "Oil"],
          },
        ],
        rating: {
          average: 4.7,
          count: 89,
        },
        deliveryInfo: {
          fee: 800,
          time: "25-40 min",
          radius: 12,
          minimumOrder: 3000,
        },
        features: {
          hasCustomMeals: false,
          acceptsOnlinePayment: true,
          hasDelivery: true,
          hasPickup: true,
        },
        status: "active",
        isVerified: true,
      },
      {
        name: "Iya Blessing",
        slug: "iya-blessing",
        description: "Fast and affordable Nigerian meals",
        cuisine: ["Nigerian", "Fast Food"],
        owner: adminUser._id,
        location: {
          address: "Ijanikin Lagos",
          city: "Lagos",
          state: "Lagos",
          zipCode: "101001",
          coordinates: {
            latitude: 6.4969,
            longitude: 3.3567,
          },
        },
        contact: {
          phone: "+2348098765432",
          email: "femmi.k2003@gmail.com",
        },
        menu: [
          {
            name: "Rice and Stew",
            description: "White rice with tomato stew and choice of protein",
            price: 2000,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 15,
            ingredients: ["Rice", "Tomato stew", "Chicken/Beef/Fish"],
          },
          {
            name: "Beans and Plantain",
            description: "Cooked beans with fried plantain",
            price: 1800,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 20,
            ingredients: ["Beans", "Plantain", "Palm oil", "Onions"],
          },
          {
            name: "Amala and Ewedu",
            description: "Yam flour with ewedu soup",
            price: 2500,
            category: "Main Course",
            image: "/placeholder.svg?height=150&width=200",
            isAvailable: true,
            preparationTime: 25,
            ingredients: ["Yam flour", "Ewedu leaves", "Locust beans", "Fish"],
          },
        ],
        rating: {
          average: 4.2,
          count: 203,
        },
        deliveryInfo: {
          fee: 500,
          time: "20-30 min",
          radius: 10,
          minimumOrder: 1500,
        },
        features: {
          hasCustomMeals: true,
          acceptsOnlinePayment: true,
          hasDelivery: true,
          hasPickup: false,
        },
        status: "active",
        isVerified: true,
      },
    ]

    for (const restaurantData of restaurants) {
      const restaurant = new Restaurant(restaurantData)
      await restaurant.save()
    }

    console.log("Sample restaurants created")
    console.log("✅ Database seeded successfully!")

    console.log("\n📋 Login Credentials:")
    console.log("Admin: admin@kobit.com / admin123")
    console.log("Customer: customer@kobit.com / customer123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding error:", error)
    process.exit(1)
  }
}

seedData()
