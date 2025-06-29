import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

// --- 📧 Ticket HTML Generator ---
const generateTicketHTML = (booking, movie) => {
  const totalPaid = booking.amount;
  const convenienceFee = 11;
  const gst = +(0.18 * (totalPaid - 11)).toFixed(2);
  const basePrice = +(totalPaid - convenienceFee - gst).toFixed(2);

  const qrData = {
    bookingId: booking._id.toString(),
    showId: booking.show._id.toString(),
    movie: booking.show.movie.title,
    seats: booking.bookedSeats,
    amount: booking.amount,
    time: booking.show.showDateTime
  };
  
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(JSON.stringify(qrData))}`;
  


  return `
<div style="font-family: 'Segoe UI', sans-serif; background-color: #f6f8fa; padding: 5vw;">
  <div style="width: 100%; max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(to right, #4a00e0, #8e2de2); color: #fff; padding: 24px 5%;">
      <h2 style="margin: 0; font-size: 22px;">🎉 Booking Confirmed – QuickShow</h2>
      <p style="margin: 8px 0 0; font-size: 14px;">Booking ID: <strong>${String(booking._id).slice(-6).toUpperCase()}</strong></p>
    </div>

    <div style="padding: 24px 5%;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 100px;">
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title} Poster" style="width: 100%; border-radius: 8px;" />
          </td>
          <td style="padding-left: 16px; vertical-align: top;">
            <h3 style="margin: 0 0 8px; font-size: 20px; color: #2c3e50;">${movie.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #888;">${movie.tagline || ''}</p>
          </td>
          <td style="text-align: right;">
            <img src="${qrUrl}" alt="QR Code with booking details" style="width: 80px; border-radius: 4px;" />

          </td>
        </tr>
      </table>

      <div style="margin-top: 20px; background: #f9f9fb; border: 1px dashed #ccc; border-radius: 8px; padding: 16px;">
        <p><strong>🎟️ Seats:</strong> ${booking.bookedSeats.join(', ')}</p>
        <p><strong>🕒 Show Time:</strong> ${new Date(booking.show.showDateTime).toLocaleString()}</p>
        <p><strong>💰 Amount Paid:</strong> ₹${totalPaid} <span style="color: green;">(Paid)</span></p>
      </div>

      <h4 style="margin-top: 30px; font-size: 16px; color: #4a00e0;">🧾 Order Summary</h4>
      <table style="width: 100%; font-size: 14px; margin-top: 10px;">
        <tr>
          <td>🎫 Base Ticket Price</td>
          <td style="text-align: right;">₹${basePrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td>💻 Convenience Fee</td>
          <td style="text-align: right;">₹${convenienceFee.toFixed(2)}</td>
        </tr>
        <tr>
          <td>🧾 GST (18%)</td>
          <td style="text-align: right;">₹${gst.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2"><hr style="border: none; border-top: 1px dashed #ccc;" /></td>
        </tr>
        <tr>
          <td><strong>Total Paid</strong></td>
          <td style="text-align: right;"><strong>₹${totalPaid}</strong></td>
        </tr>
      </table>

      <div style="margin-top: 30px; font-size: 12px; color: #888; line-height: 1.6;">
        <p><strong>Important:</strong></p>
        <ul style="padding-left: 20px;">
          <li>This booking is final and cannot be canceled or modified.</li>
          <li>Please carry a valid ID proof for verification at entry.</li>
          <li>Seats not claimed 10 minutes before showtime may be released.</li>
          <li>One ticket is required per person, including children above 3 years.</li>
        </ul>
      </div>
    </div>

    <div style="background-color: #f1f1f1; text-align: center; padding: 16px; font-size: 12px; color: #888;">
      Thank you for choosing <strong>QuickShow</strong>!<br />🎬 Your movie, your moment.
    </div>
  </div>
</div>
  `;
};

// --- Inngest Setup ---
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// User Functions
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-creation' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    await User.create({
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url
    });
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

const syncUserUpdate = inngest.createFunction(
  { id: 'sync-user-update' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    await User.findByIdAndUpdate(id, {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url
    });
  }
);

// Booking Cancellation if unpaid
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const bookingId = event.data.bookingId;

    await step.sleepUntil("wait-5-min", new Date(Date.now() + 5 * 60 * 1000));

    await step.run("cancel-if-unpaid", async () => {
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.isPaid) return;

      const show = await Show.findById(booking.show);
      booking.bookedSeats.forEach(seat => delete show.occupiedSeats[seat]);
      show.markModified("occupiedSeats");
      await show.save();
      await Booking.findByIdAndDelete(bookingId);
    });
  }
);

// Booking Confirmation Email (Responsive + Fee Summary)
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event }) => {
    const booking = await Booking.findById(event.data.bookingId)
      .populate({ path: 'show', populate: { path: 'movie' } })
      .populate('user');

    const movie = booking.show.movie;
    const html = generateTicketHTML(booking, movie);

    await sendEmail({
      to: booking.user.email,
      subject: `🎟️ Booking Confirmation: "${movie.title}"`,
      body: html
    });
  }
);

// Show Notification
const sendNewShowNotification = inngest.createFunction(
  { id: 'send-new-show-notifications' },
  { event: "app/show.added" },
  async ({ event }) => {
    const { movieTitle } = event.data;
    const users = await User.find();

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: `New Show Alert: ${movieTitle}`,
        body: `
          <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <h1 style="color: #ff0066; text-align: center;">🎬 New Show Alert!</h1>
              <p style="font-size: 16px; color: #333;">Hi <strong>${user.name}</strong>,</p>
              <p style="font-size: 16px; color: #333;">We’re thrilled to let you know about a brand new show now available for booking!</p>
              <div style="margin: 20px 0; padding: 20px; background-color: #f0f0f5; border-left: 4px solid #ff0066;">
                <p style="font-size: 18px; margin: 0;"><strong>🎥 Movie Title:</strong> <span style="color: #000;">${movieTitle}</span></p>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://quickshow-pi.vercel.app" style="background-color: #ff0066; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                  🎟️ Book Now
                </a>
              </div>
              <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
              <p style="text-align: center; font-size: 13px; color: #aaa;">You're receiving this because you're subscribed to updates from <strong>QuickShow</strong>.</p>
            </div>
          </div>
        `
      });
    }

    return { success: true, message: `Sent to ${users.length} users` };
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
