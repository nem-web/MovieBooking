import express from "express";
import Razorpay from "razorpay";
import Booking from "../models/Booking.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Create a new Razorpay order when retrying payment
router.post("/retry", async (req, res) => {
  try {
    const { orderId } = req.body;

    const booking = await Booking.findOne({ paymentLink: orderId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const newOrder = await razorpay.orders.create({
      amount: booking.amount * 100,
      currency: "INR",
      receipt: booking._id.toString(),
      notes: {
        bookingId: booking._id.toString(),
      },
    });

    booking.paymentLink = newOrder.id;
    await booking.save();

    return res.json({
      success: true,
      order: {
        id: newOrder.id,
        amount: newOrder.amount,
        currency: newOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
      },
    });
  } catch (err) {
    console.error("Retry payment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
