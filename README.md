#Kobit-Food-App
--
## 1. **Make Sure You Have the Prerequisites**
- **Node.js** (v14 or newer): [Download](https://nodejs.org/)
- **npm** (comes with Node)
- **MongoDB** running locally or a MongoDB Atlas URI

---

## 2. **Install Dependencies**

In your project directory (where `package.json` is):

```bash
npm install
```

---

## 3. **Set Up Your `.env` File**

Create a `.env` file in the root of your project with values like:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```
- Replace `your_mongodb_connection_string` with your actual MongoDB URI.
- Replace `your_super_secret_jwt_key` with any strong secret string e.g `openssl random -base64 32`.


---

## 4. **Start MongoDB**

- If you’re running MongoDB **locally**, open a terminal and run:
  ```bash
  mongod
  ```
- If you’re using **MongoDB Atlas**, just make sure your `MONGO_URI` in `.env` is correct and accessible.

---

## 5. **Start the Server**

You have two options:
- For production:
  ```bash
  npm start
  ```
- For development (auto-restarts on changes, recommended):
  ```bash
  npm run dev
  ```

---

## 6. **Test Your Server**

- You should see output like:  
  `Server running on port 5000`
- Test endpoints (e.g., `http://localhost:5000/api/restaurants`) using [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/), or `curl`.