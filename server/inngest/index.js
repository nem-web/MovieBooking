import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// Helper  function to generate ticket email
const generateTicketHTML = (booking, movie) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f8fa; padding: 30px;">
  <div style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(to right, #4a00e0, #8e2de2); color: #fff; padding: 24px 32px;">
      <h2 style="margin: 0; font-size: 22px;">🎉 Booking Confirmed – QuickShow</h2>
      <p style="margin: 8px 0 0; font-size: 14px;">Booking ID: <strong>${String(booking._id).slice(-6).toUpperCase()}</strong></p>
    </div>
    <div style="padding: 24px 32px;">
      <table style="width: 100%;">
        <tr>
          <td style="width: 100px;"><img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" style="width: 100px; border-radius: 8px;" /></td>
          <td style="padding-left: 16px; vertical-align: top;">
            <h3 style="margin: 0 0 8px; font-size: 20px; color: #2c3e50;">${movie.title}</h3>
            <p style="margin: 0; font-size: 14px; color: #888;">${movie.tagline || ''}</p>
          </td>
          <td style="text-align: right;"><img src="https://quickchart.io/qr?text=BOOKING-${booking._id}" style="border-radius: 4px;" /></td>
        </tr>
      </table>
      <div style="margin-top: 20px; background: #f9f9fb; border: 1px dashed #ccc; border-radius: 8px; padding: 16px;">
        <p><strong>🎟️ Seats:</strong> ${booking.bookedSeats.join(', ')}</p>
        <p><strong>🕒 Show Time:</strong> ${new Date(booking.show.showDateTime).toLocaleString()}</p>
        <p><strong>💰 Amount Paid:</strong> ₹${booking.amount} <span style="color: green;">(Paid)</span></p>
      </div>
      <h4 style="margin-top: 30px; font-size: 16px; color: #4a00e0;">🧾 Order Summary</h4>
      <table style="width: 100%; font-size: 14px; margin-top: 10px;">
        <tr>
          <td>🎫 Ticket Price (x${booking.bookedSeats.length})</td>
          <td style="text-align: right;">₹${(booking.amount - 30).toFixed(2)}</td>
        </tr>
        <tr>
          <td>💻 Internet Handling Fees</td>
          <td style="text-align: right;">₹30.00</td>
        </tr>
        <tr>
          <td colspan="2"><hr style="border: none; border-top: 1px dashed #ccc;" /></td>
        </tr>
        <tr>
          <td><strong>Total Paid</strong></td>
          <td style="text-align: right;"><strong>₹${booking.amount.toFixed(2)}</strong></td>
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
</div>`;

const generatePDFBuffer = async (html) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return buffer;
};

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
export const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId)
      .populate({ path: 'show', populate: { path: 'movie' } })
      .populate('user');

    const movie = booking.show.movie;
    const html = generateTicketHTML(booking, movie);
    const pdfBuffer = await generatePDFBuffer(html);

    await sendEmail({
      to: booking.user.email,
      subject: `🎟️ Booking Confirmation: "${movie.title}"`,
      body: html,
      attachments: [
        {
          filename: 'QuickShow_Ticket.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }
);


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
