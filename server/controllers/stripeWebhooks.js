// controllers/stripeWebhooks.js
import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

export const stripeWebhooks = async (req, res) => {
  console.log('📩 Webhook route hit!');

  console.log('📩 Webhook route hit at', new Date().toISOString());

  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers['stripe-signature'];
  console.log('🔐 Stripe signature received:', sig);

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Stripe signature verified. Event type:', event.type);
  } catch (error) {
    console.error('❌ Stripe verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('🎟️ Session received from Stripe:', session);

      const bookingId = session.metadata?.bookingId;
      console.log('🆔 Extracted bookingId from session:', bookingId);

      if (!bookingId) {
        console.error('❌ bookingId missing in metadata');
        return res.status(400).send('Missing bookingId in metadata');
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          isPaid: true,
          paymentLink: '',
        },
        { new: true }
      );

      if (!updatedBooking) {
        console.error('❌ Booking not found for ID:', bookingId);
        return res.status(404).send('Booking not found');
      }

      console.log('✅ Booking updated in DB:', updatedBooking);

      await inngest.send({
        name: 'app/show.booked',
        data: { bookingId },
      });

      console.log('📨 Inngest event sent for bookingId:', bookingId);
    } else {
      console.log('⚠️ Unhandled event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('🔥 Error inside webhook handler:', err);
    res.status(500).send(`Webhook handler error: ${err.message}`);
  }
};
