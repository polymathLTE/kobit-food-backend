require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const Restaurant = require('./src/models/Restaurant');
const User = require('./src/models/User');
const Order = require('./src/models/Order');

const NUM_USERS = 10;
const NUM_RESTAURANTS = 5;
const MAX_MENU_ITEMS = 8;
const NUM_ORDERS = 15;

async function generateUsers() {
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const password = await bcrypt.hash('password123', 10);
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password,
    });
  }
  return users;
}

function generateRestaurants() {
  const restaurants = [];
  for (let i = 0; i < NUM_RESTAURANTS; i++) {
    const menu = [];
    const menuItems = faker.number.int({ min: 2, max: MAX_MENU_ITEMS });
    for (let j = 0; j < menuItems; j++) {
      menu.push({
        name: faker.commerce.productName(),
        price: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
      });
    }
    restaurants.push({
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      menu,
    });
  }
  return restaurants;
}

function generateOrders(users, restaurants) {
  const orders = [];
  for (let i = 0; i < NUM_ORDERS; i++) {
    const user = faker.helpers.arrayElement(users);
    const restaurant = faker.helpers.arrayElement(restaurants);
    const orderItems = [];
    const numItems = faker.number.int({ min: 1, max: 3 });
    let totalPrice = 0;
    for (let j = 0; j < numItems; j++) {
      const menuItem = faker.helpers.arrayElement(restaurant.menu);
      const quantity = faker.number.int({ min: 1, max: 4 });
      orderItems.push({
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      });
      totalPrice += menuItem.price * quantity;
    }
    orders.push({
      userId: user._id,
      restaurantId: restaurant._id,
      items: orderItems,
      totalPrice: Number(totalPrice.toFixed(2)),
      status: faker.helpers.arrayElement(['Pending', 'Delivered', 'Preparing']),
    });
  }
  return orders;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Restaurant.deleteMany();
  await User.deleteMany();
  await Order.deleteMany();

  const users = await User.insertMany(await generateUsers());
  const restaurants = await Restaurant.insertMany(generateRestaurants());
  const orders = generateOrders(users, restaurants);
  await Order.insertMany(orders);

  console.log('Dynamic database seeded!');
  mongoose.connection.close();
}

seed().catch(err => {
  console.error(err);
  mongoose.connection.close();
});