# KOBIT Food Delivery Backend

A robust Express.js backend API for the KOBIT food delivery application with MongoDB Atlas integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Navigate to backend directory:**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup:**
   Update the `.env` file with your MongoDB Atlas connection string:
   \`\`\`env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/kobit_delivery?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-long-and-random
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   \`\`\`

4. **Seed the database:**
   \`\`\`bash
   npm run seed
   \`\`\`

5. **Start the server:**
   \`\`\`bash
   npm run dev
   \`\`\`

The backend will run on `http://localhost:5000`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - User logout

### Restaurants
- `GET /api/restaurants` - Get all restaurants (with pagination & filtering)
- `GET /api/restaurants/:slug` - Get restaurant by slug
- `POST /api/restaurants` - Create restaurant (admin only)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders (admin sees all)
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status (admin only)
- `PATCH /api/orders/:id/payment` - Update payment info

### Payments
- `POST /api/payments/bank-transfer` - Process bank transfer
- `POST /api/payments/confirm` - Confirm payment (admin only)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/addresses` - Add user address

### Health Check
- `GET /api/health` - API health status

## 🔑 Default Login Credentials

After seeding the database:

- **Admin**: admin@kobit.com / admin123
- **Customer**: customer@kobit.com / customer123

## 🏗️ Project Structure

\`\`\`
backend/
├── models/           # Mongoose models
│   ├── User.js
│   ├── Restaurant.js
│   └── Order.js
├── routes/           # API routes
│   ├── auth.js
│   ├── restaurants.js
│   ├── orders.js
│   ├── payments.js
│   └── users.js
├── middleware/       # Custom middleware
│   └── auth.js
├── scripts/          # Utility scripts
│   └── seed.js
├── .vscode/          # VS Code configuration
│   └── launch.json
├── server.js         # Main server file
├── package.json
├── .env
└── README.md
\`\`\`

## 🛡️ Security Features

- JWT Authentication with refresh tokens
- Password hashing with bcrypt
- Input validation with express-validator
- Rate limiting
- CORS protection
- Helmet security headers
- Request logging with Morgan

## 🗄️ Database Models

### User Model
- Authentication & profile management
- Role-based access (customer, admin, restaurant_owner)
- Address management
- Account status tracking

### Restaurant Model
- Restaurant information & location
- Menu management with categories
- Rating & review system
- Operating hours & delivery info
- Feature flags (custom meals, payments, etc.)

### Order Model
- Complete order lifecycle tracking
- Payment processing (bank transfer focus)
- Timeline tracking for status updates
- Delivery address management
- Item customization support

## 🔧 Development

### Running in VS Code

1. Open the `backend` folder in VS Code
2. Use the built-in debugger with the provided launch configurations:
   - "Start KOBIT Backend" - Run the server with debugging
   - "Seed Database" - Run the database seeding script

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## 📊 Sample Data

The seed script creates:
- 1 Admin user
- 1 Customer user  
- 3 Nigerian restaurants with authentic menu items:
  - Mama Put Kitchen (Traditional Nigerian)
  - Lagos Grill House (Continental & Grilled)
  - Bukka Express (Fast Nigerian Food)

## 🚀 Deployment Ready

- Production-ready error handling
- Environment-based configuration
- Comprehensive logging
- Database connection management
- Graceful shutdown handling

## 📝 API Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "errors": [
    // Validation errors (if any)
  ]
}
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
\`\`\`

Now let's update the frontend to connect to the backend:

```ts file="lib/api-client.ts"
[v0-no-op-code-block-prefix]const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Add proper error handling and token management
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'API request failed')
    }

    return data
  }

  // Auth methods
  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: any) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  async getProfile() {
    return this.request('/auth/profile')
  }

  // Restaurant methods
  async getRestaurants(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request(`/restaurants${queryString}`)
  }

  async getRestaurant(slug: string) {
    return this.request(`/restaurants/${slug}`)
  }

  // Order methods
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getOrders(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request(`/orders${queryString}`)
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`)
  }

  // Payment methods
  async processBankTransfer(paymentData: any) {
    return this.request('/payments/bank-transfer', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  async confirmPayment(paymentData: any) {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }
}

export const apiClient = new ApiClient()
