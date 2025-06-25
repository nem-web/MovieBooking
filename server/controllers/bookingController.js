// Function to check availability of selected seats for a movie 

import Booking from "../models/Booking.js";
import Show from '../models/Show.js'; // ✅ required
import Movie from '../models/Movie.js'; 
import Stripe from 'stripe';
import { inngest } from "../inngest/index.js";

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try{
    const showData = await Show.findById(showId)
    if(!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);
    return !isAnySeatTaken;
  } catch (err) {
    console.log('Error checking seat availability:', err);
    return false;
  }
}

export const createBooking = async (req, res) => {
  try{
    const {userId} = req.auth();
    const {showId, selectedSeats} = req.body;
    const {origin} = req.headers;

    // Check if the selected seats are available
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if(!isAvailable){
      return res.json({success: false, message: 'Selected seats are not available'});
    }

    // Get the show details
    const showData = await Show.findById(showId).populate('movie');

    // Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats
    })

    selectedSeats.map((seat)=> {
      showData.occupiedSeats[seat]= userId;
    })

    showData.markModified('occupiedSeats');
    await showData.save();

    // Stripe Gateway Integration
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Creating line items to for Stripe payment
    const line_items = [{
      price_data: {
        currency: 'inr',
        product_data: {
          name: showData.movie.title
        },
        unit_amount: showData.showPrice * 100, // Amount in paise
      }, quantity: 1
    }]

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: 'payment',
      metadata:{
        bookingId: booking._id.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min expiry
    })

    booking.paymentLink = session.url
    await booking.save();

    // Run inngest function to check payment status
    await inngest.send({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString()
      }
    })

    res.json({ success: true, 
      url: session.url})
  }
  catch(err){
    console.log(err.message);
    res.json({ success: false, message: err.message});
  }
}

export const getOccupiedSeats = async (req, res) => {
  try {

    const {showId} = req.params;
    const showData = await Show.findById(showId).populate('movie');

    const occupiedSeats = Object.keys(showData.occupiedSeats)

    res.json({ success: true, occupiedSeats });
    
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
    
  }
}