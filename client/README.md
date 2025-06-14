# 🎬 Movie Booking Website (MERN Stack)

A full-featured movie ticket booking web application built using the **MERN** stack: **MongoDB**, **Express.js**, **React**, and **Node.js**. The platform includes user authentication, seat booking, movie management, and a secure admin dashboard.

> 🚧 This project is currently in development. New features and improvements are being added regularly.

---

## 🔥 Features

### 🎟 User Functionality
- 🎞 Browse and filter movies by genre, language, and date
- 📍 Choose cinemas and showtimes
- 🪑 Interactive seat selection
- ✅ Instant booking confirmation
- 🧾 View past bookings and ticket details
- 🔐 Secure sign-up and login with JWT

### 🛠 Admin Dashboard
- ➕ Add/Edit/Delete movies and showtimes
- 📊 View real-time booking analytics
- 👥 Manage users and roles
- 🔐 Admin authentication and protected routes

---

## 🛠 Tech Stack

| Layer            | Technologies                        |
|------------------|-------------------------------------|
| Frontend         | React, Tailwind CSS, Axios          |
| Backend          | Node.js, Express.js                 |
| Database         | MongoDB, Mongoose                   |
| Authentication   | JWT, bcrypt                         |
| State Management | React Context (or Redux planned)    |
| Admin UI         | Custom dashboard (React-based)      |

---

## 📦 Installation Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/movie-booking-app.git
cd movie-booking-app
```

### 2️⃣ Install Dependencies

**For Frontend:**
```bash
cd client
npm install
```

**For Backend:**
```bash
cd ../server
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file inside the `/server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace `your_mongodb_connection_string` and `your_secret_key` with your actual credentials.

### 4️⃣ Start Development Server

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

Now open your browser and navigate to [http://localhost:5173](http://localhost:5173) (or whatever port Vite/React is running on).

---

## 📁 Project Structure

```
movie-booking-app/
├── client/               # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/               # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── .env
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ✅ TODO

- [ ] Set up authentication
- [ ] Admin dashboard UI
- [ ] Implement full CRUD for movies and shows
- [ ] Seat selection UI
- [ ] Payment gateway integration
- [ ] Email/SMS ticket confirmation
- [ ] Deploy to production (Render/Vercel + MongoDB Atlas)

---

## 🤝 Contributing

Contributions are welcome!

To contribute:

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📸 Screenshots

(Coming soon — once UI is more polished)

---

## 🌐 Live Demo

(Deployment in progress — link will be updated once available)

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Made with ❤️ by Your Name

---

### ✅ Final Notes:
- Replace `nem-web` with your GitHub username
- Add any deployment or demo links when ready
- You can also include screenshots/gifs later under the `📸 Screenshots` section