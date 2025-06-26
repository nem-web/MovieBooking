// Function to check availability of selected seats for a movie 

import Booking from "../models/Booking.js";
import Show from '../models/Show.js'; // ✅ required
import Movie from '../models/Movie.js'; 
import Razorpay from 'razorpay';
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
    console.log("Booking created:", booking);

    selectedSeats.map((seat)=> {
      showData.occupiedSeats[seat]= userId;
    })

    showData.markModified('occupiedSeats');
    await showData.save();

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: booking.amount * 100,
      currency: 'INR',
      receipt: booking._id.toString(),
      notes: {
        bookingId: booking._id.toString()
      }
    });
    console.log("Razorpay order created:", razorpayOrder);

    booking.paymentLink = razorpayOrder.id;
    await booking.save();

    console.log("Booking updated with payment link:", booking);


    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        name: showData.movie.title,
        description: `Tickets for ${showData.movie.title}`,
        bookingId: booking._id.toString()
      }
    });

    console.log('Booking created successfully!');

    

    
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