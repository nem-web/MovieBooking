import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data in database 
const syncUserCreation = inngest.createFunction(
  { id: 'create-user-with-clerk' },
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

const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-with-clerk' },
  { event: 'clerk/user.updated' },
  async (event) => {
    const data = event.data;

    console.log("📤 Received user update event:", JSON.stringify(data, null, 2));

    if (!data?.id || !data?.email_addresses?.[0]?.email_address) {
      console.error("❌ Missing user ID or email. Skipping update.");
      return;
    }

    const userData = {
      _id: data.id,
      email: data.email_addresses[0].email_address,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      image: data.image_url || '',
    };

    try {
      const updated = await User.findByIdAndUpdate(data.id, userData, { new: true, upsert: true });
      console.log("✅ User updated:", updated);
    } catch (err) {
      console.error("❌ Error updating user:", err.message);
    }
  }
);

const logAllEvents = inngest.createFunction(
  { id: "log-all-events" },
  { event: "*" },
  async (event) => {
    console.log("🌐 Wildcard event caught:", event.name, JSON.stringify(event.data, null, 2));
  }
);



// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, logAllEvents];
