import Razorpay from "razorpay";
import Booking from "../models/Booking.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const retryPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("show");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    const newOrder = await razorpay.orders.create({
      amount: booking.amount * 100, // in paise
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
        description: "Retry payment for your booking",
        bookingId: booking._id,
      },
    });
  } catch (err) {
    console.error("[RETRY PAYMENT] Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
