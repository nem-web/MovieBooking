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

// Inngest to send reminder email to user 1 day before the show
const sendShowReminders = inngest.createFunction(
  {id: 'send-show-reminders'},
  {cron: "0 */8 * * *"}, // Every 8 hours
  async ({step})=>{
    const now = new Date();
    const in8Hours = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    // prepare reminder tasks
    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours },
      }).populate('movie');

      const tasks = [];
      for (const show of shows) {
        if(!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if(userIds.length === 0) continue;

        const users = await User.find({ _id: { $in: userIds } }).select("name email");

        for(const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime,
          })
        }
      }
      return tasks;
    })
    if(reminderTasks.length === 0) return {sent: 0, message: "No reminders to send"};

    // send reminder emails
    const results = await step.run("send-all-reminders", async()=> {
      return await Promise.allSettled(
        reminderTasks.map(task => sendEmail({
          to: task.userEmail,
          subject: `Reminder: Upcoming Show - ${task.movieTitle}`,
          body: `
            <h1>Show Reminder</h1>
            <p>Dear ${task.userName},</p>
            <p>This is a reminder for your upcoming show of <strong>${task.movieTitle}</strong> on <strong>${task.showTime}</strong>.</p>
            <p>We look forward to seeing you there!</p>
          `
        }))
      )
    })
    const sent = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Sent ${sent} reminders, failed to send ${failed} reminders`
    }
  }
)

const sendNewShowNotification = inngest.createFunction(
  {id: 'send-new-show-notifications'},
  {event: "app/show.added"},
  async ({event}) => {
    const {movieTitle, movieId} = event.data;

    const users = await User.find({})

    for (const user of users) {
      const userEmail = user.email;
      const userName = user.name;

      const subject = `New Show Alert: ${show.movie.title}`
      const body = `
        <h1>New Show Available</h1>
        <p>Dear ${user.name},</p>
        <p>We are excited to announce a new show for the movie <strong>${show.movie.title}</strong>.</p>
        <p>Show Date and Time: ${show.showDateTime}</p>
        <p>Don't miss out on this opportunity!</p>
      `;
      await sendEmail({
        to: userEmail,
        subject,
        body
      })
    }
    return { success: true, message: `Notifications sent to ${users.length} users` };
  }
)

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotification
];

