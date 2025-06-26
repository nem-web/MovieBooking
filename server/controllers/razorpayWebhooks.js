import crypto from 'crypto';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

export const razorpayWebhooks = async (req, res) => {
  console.log("📡 Razorpay webhook hit:", req.body);
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const payload = req.body.toString('utf8');
  console.log("📡 Webhook called");
  console.log("🔐 Signature:", signature);
  console.log("📦 Raw Payload:", payload);



  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.log('❌ Invalid Razorpay signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const bookingId = payment.notes?.bookingId;

    if (!bookingId) {
      console.log('❌ Missing bookingId in payment notes');
      return res.status(400).send('Missing bookingId');
    }

    // Update DB: mark as paid, remove payment link
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        isPaid: true,
        paymentLink: '',
      },
      { new: true }
    );

    if (!updatedBooking) {
      console.log('❌ Booking not found for ID:', bookingId);
      return res.status(404).send('Booking not found');
    }

    console.log('✅ Booking updated:', updatedBooking);

    await inngest.send({
      name: 'app/show.booked',
      data: { bookingId },
    });

    console.log('📨 Inngest event sent');
    return res.status(200).json({ received: true });
  }

  console.log('⚠️ Unhandled event type:', event.event);
  res.status(200).json({ received: true });
};
