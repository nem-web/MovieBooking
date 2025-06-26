import express from "express";
import fetch from "node-fetch";
import Booking from "../models/Booking.js"; // Adjust path if needed

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

// Fetch Razorpay order by ID
async function getOrderDetails(orderId) {
  const url = `https://api.razorpay.com/v1/orders/${orderId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_SECRET_KEY}`).toString("base64"),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const rawBody = req.body.toString("utf8");
      const event = JSON.parse(rawBody);


      if (event.event === "order.paid") {
        const orderId = event.payload.order.entity.id;

        const orderDetails = await getOrderDetails(orderId);

        if (orderDetails.status === "paid" && orderDetails.amount_due === 0) {
          const bookingId = orderDetails.notes?.bookingId;

          const booking = await Booking.findById(bookingId);

          if (booking) {
            if (booking.status !== "confirmed") {
              booking.status = "confirmed";
            }

            booking.isPaid = true;
            booking.paymentLink = "";

            await booking.save();
            
          } else {
            console.log("[WEBHOOK] Booking not found for ID:", bookingId);
          }
        } else {
          console.log("[WEBHOOK] Payment not complete ❌");
        }
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[WEBHOOK] Error:", err);
      return res.status(500).json({ success: false });
    }
  }
);

export default router;
