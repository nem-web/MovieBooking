import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data in database 
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-creation' },
  { event: 'clerk/user.created' },
  async (event) => {
    console.log("📥 Received clerk/user.created event:", JSON.stringify(event, null, 2));

    const data = event.data;

    if (!data || !data.id || !data.email_addresses?.[0]?.email_address) {
      console.error("❌ Invalid user creation event payload:", data);
      return;
    }

    const userData = {
      _id: data.id,
      email: data.email_addresses[0].email_address,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      image: data.image_url || '',
    };

    try {
      await User.create(userData);
      console.log("✅ User created in DB:", userData);
    } catch (error) {
      console.error("❌ Error creating user:", error.message, error);
    }
  }
);


// Inngest function to delete user data from database
const syncUserDeletion = inngest.createFunction(
  {id: 'delete-user-with-clerk'}, 
  {event: 'clerk.user.deleted'},
  async (event) => {
    const { id } = event.data || {};
    await User.findByIdAndDelete(id);
  }
);

// Inngest function to Update user data from database
const syncUserUpdation = inngest.createFunction(
  {id: 'update-user-with-clerk'}, 
  {event: 'clerk/user.updated'},
  async (event) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      image: image_url,
    }
    await User.findByIdAndUpdate(id, userData)
  }
);



// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
