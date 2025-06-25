import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data in database 
const syncUserCreation = inngest.createFunction(
  {id: 'sync-user-creation'},
{event: 'clerk/user.created'},
async ({event})=>{
  const {id, first_name, last_name, email_addresses, image_url} = event.data
  const userData = {
    _id: id,
    email: email_addresses[0].email_address,
    name: first_name + " " + last_name,
    image: image_url
  }
  await User.create(userData)
})

// Inngest function to delete user data in database 
const syncUserDeletion = inngest.createFunction(
  {id: 'delete-user-with-clerk'},
{event: 'clerk/user.deleted'},
async ({event})=>{
  const {id} = event.data
  await User.findByIdAndDelete(id)
})

// Inngest function to update user data in database 
const syncUserUpdate = inngest.createFunction(
  {id: 'sync-user-update'},
{event: 'clerk/user.updated'},
async ({event})=>{
  const {id, first_name, last_name, email_addresses, image_url} = event.data
  const userData = {
    _id: id,
    email: email_addresses[0].email_address,
    name: first_name + " " + last_name,
    image: image_url
  }
  await User.findByIdAndUpdate(id, userData)
})

// Inngest Function to cancel user booking
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  {id: 'release-seats-delete-booking'},
  {event: "app/checkpayment"},
  async ({event, step}) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

    await step.run('check-payment-status', async ()=> {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId)

      // if payment is not done, release seats and delete booking
      if(!booking.isPaid){
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat)=> {
          delete show.bookedSeats[seat]
        });
        show.markModified('occupiedSeats')
        await show.save();
        await Booking.findByIdAndDelete(bookingId._id);
      }
    })
  }
)

// Send email to user after booking
const sendBookingConfirmationEmail = inngest.createFunction(
  {id: 'send-booking-confirmation-email'},
  {event: "app/show.booked"},
  async ({event, step}) => {
    const {bookingId} = event.data;

    const booking = await Booking.findById(bookingId).populate({path: 'show', populate: {path: "movie"}}).populate('user');

    await sendEmail({
      to: booking.user.email,
      subject: `Booking Confirmation: "${booking.show.movie.title}"`,
      body: `
        <h1>Booking Confirmation</h1>
        <p>Dear ${booking.user.name},</p>
        <p>Your booking for the movie <strong>${booking.show.movie.title}</strong> on <strong>${booking.show.showDateTime}</strong> has been confirmed.</p>
        <p>Total Amount: ${booking.amount}</p>
        <p>Thank you for choosing us!</p>
      `
    })
  }
)

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail
];

