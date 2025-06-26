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
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const fiveMinutesLater = new Date(Date.now() + 5 * 60 * 1000);
    await step.sleepUntil("wait-for-5-minutes", fiveMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      // If booking doesn't exist or is already paid, do nothing
      if (!booking || booking.isPaid) return;

      const show = await Show.findById(booking.show);

      // Free the seats
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });

      show.markModified("occupiedSeats");
      await show.save();

      // Delete the unpaid booking
      await Booking.findByIdAndDelete(bookingId);
    });
  }
);


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
          <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <h1 style="color: #ff0066; text-align: center;">🎉 Booking Confirmed!</h1>
              
              <p style="font-size: 16px; color: #333;">Hi <strong>${booking.user.name}</strong>,</p>
              
              <p style="font-size: 16px; color: #333;">
                We're excited to confirm your booking for the movie:
              </p>

              <div style="margin: 20px 0; padding: 20px; background-color: #f0f0f5; border-left: 4px solid #ff0066;">
                <p style="margin: 5px 0;"><strong>🎬 Movie:</strong> <span style="color: #000;">${booking.show.movie.title}</span></p>
                <p style="margin: 5px 0;"><strong>📅 Show Time:</strong> <span style="color: #000;">${new Date(booking.show.showDateTime).toLocaleString()}</span></p>
                <p style="margin: 5px 0;"><strong>💺 Seats:</strong> <span style="color: #000;">${booking.bookedSeats.join(", ")}</span></p>
                <p style="margin: 5px 0;"><strong>💰 Total Amount:</strong> <span style="color: #000;">₹${booking.amount}</span></p>
              </div>

              <p style="font-size: 15px; color: #555;">
                You can view your bookings anytime by visiting your account. We look forward to seeing you at the show!
              </p>

              <p style="font-size: 15px; color: #555;">
                Need help? Feel free to reply to this email.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

              <p style="text-align: center; font-size: 14px; color: #aaa;">
                Thank you for choosing <strong>QuickShow</strong>!<br />
                🎬 Your movie, your moment.
              </p>
            </div>
          </div>
        `

    })
  }
)

const sendNewShowNotification = inngest.createFunction(
  { id: 'send-new-show-notifications' },
  { event: "app/show.added" },
  async ({ event }) => {
    const { movieTitle, movieId } = event.data;

    const users = await User.find({});

    for (const user of users) {
      const subject = `New Show Alert: ${movieTitle}`;
      const body = `
          <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <h1 style="color: #ff0066; text-align: center;">🎬 New Show Alert!</h1>

              <p style="font-size: 16px; color: #333;">Hi <strong>${user.name}</strong>,</p>

              <p style="font-size: 16px; color: #333;">
                We’re thrilled to let you know about a brand new show now available for booking!
              </p>

              <div style="margin: 20px 0; padding: 20px; background-color: #f0f0f5; border-left: 4px solid #ff0066;">
                <p style="font-size: 18px; margin: 0;"><strong>🎥 Movie Title:</strong> <span style="color: #000;">${movieTitle}</span></p>
              </div>

              <p style="font-size: 15px; color: #555;">
                Be the first to grab your favorite seats before they’re gone!
              </p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://quickshow-pi.vercel.app" style="background-color: #ff0066; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                  🎟️ Book Now
                </a>
              </div>

              <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />

              <p style="text-align: center; font-size: 13px; color: #aaa;">
                You're receiving this email because you're subscribed to updates from <strong>QuickShow</strong>.<br />
                Unsubscribe anytime by managing your preferences.
              </p>
            </div>
          </div>
        `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    return { success: true, message: `Notifications sent to ${users.length} users` };
  }
);


export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendNewShowNotification
];

