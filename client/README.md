# 🎬 QuickShow

A sleek, full-stack movie ticket booking web application built with modern technologies: **React**, **Tailwind CSS**, **Clerk Authentication**, **Razorpay Payments**, **Inngest**, and the **TMDB API**.

🌐 **Live Demo:** [quickshow-pi.vercel.app](https://quickshow-pi.vercel.app)


---

## 🚀 Features

- ✨ Modern UI/UX with Tailwind CSS
- 🎬 Browse movies with TMDB integration
- 🔐 User authentication with Clerk (Signup/Login)
- 🎟️ Book movie tickets with interactive seat selection
- 💳 Razorpay payment integration
- 📧 Booking confirmation emails via Inngest
- 🛠️ Admin panel to add shows dynamically
- ⏳ Auto-cancel unpaid bookings after 5 minutes
- 🔁 Retry failed payments
- 📱 Fully responsive on all devices

---

## 🧪 Tech Stack

| Frontend           | Backend                  | Integrations        |
|--------------------|--------------------------|---------------------|
| React (Vite)       | Node.js + Express.js     | Razorpay Payments   |
| Tailwind CSS       | MongoDB (Mongoose)       | Clerk Auth          |
| React Context API  | Inngest (Event handling) | TMDB Movie API      |
| Axios, Razorpay SDK| Cloud Deployment (Vercel)| Nodemailer (Emails) |

---

## 🛠️ Setup & Installation

> 💡 **Requirements:** Node.js, MongoDB, Clerk account, Razorpay account, TMDB API key.

### 1️⃣ Clone & Configure Environment

```bash
git clone https://github.com/nem-web/MovieBooking.git
cd MovieBooking
```

Create a `.env` file in the `/server` directory:

```env
# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret

# MongoDB
MONGODB_URI=mongodb+srv://your_user:pass@cluster.mongodb.net/quickshow

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Inngest
INNGEST_EVENT_KEY=your_inngest_key

# TMDB
TMDB_API_KEY=your_tmdb_api_key
```

---

### 2️⃣ Start the Frontend

```bash
cd client
npm install
npm run dev
```

### 3️⃣ Start the Backend

```bash
cd ../server
npm install
npm run dev
```

---

## ⚙️ Folder Structure

```
quickshow/
├── client/                # React frontend
│   ├── components/        # Reusable components
│   ├── context/           # AppContext for Axios & auth
│   └── pages/             # Routes: Home, MyBookings, Admin etc.
├── server/                # Express backend
│   ├── controllers/       # Route logic
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── inngest/           # Email and booking events
│   └── utils/             # Helper functions
```

---

## 💌 Booking Confirmation Email (Inngest)

- Emails are automatically sent after successful payment with Razorpay using Inngest.
- If payment fails, seat booking auto-expires after 5 minutes.
- Admins can notify users on new show additions via email.

---

## 👨‍💻 Admin Access

- Add new shows by selecting date/time
- View all added movies/shows
- Admin interface is protected via Clerk roles (extendable)

---

## 🧠 Lessons Learned

- Event-driven architecture with Inngest improves reliability
- Razorpay’s web-based payment flow is smooth for users
- Managing concurrent seat bookings is key to avoiding race conditions
- TMDB offers a rich API for movie data with minimal config

---

## 🧾 License

This project is licensed under the MIT License.

---

## 📬 Contact

Have suggestions or found a bug?  
Feel free to reach out:

- 📧 Email: kathariyanemchandra@gmail.com
- 🐙 GitHub: [https://github.com/nem-web](https://github.com/nem-web)

⭐️ If you like this project, give it a star on GitHub!

---