import mongoose from "mongoose";
import dotenv from "dotenv";
import ChatbotQA from "./models/Chatbot.js"; // Use ChatbotQA model

dotenv.config();

// --- Comprehensive Data Set for Movie Booking Chatbot ---
const data = [
    // ----------------------------------------------------------------------
    // 1. Initial Greetings / Menu Entry (Fallback)
    // ----------------------------------------------------------------------
    {
        intent: "initial_greeting",
        patterns: ["hi", "hello", "start", "menu", "help", "agent", "advisor"],
        answer: "Welcome to CineBook Support! How can I assist you with your movie experience?",
        next_options: [
            "Cancellation/Refund", 
            "Ticket Booking", 
            "Other Queries",
            "BookMyShow Stream" // Note: Frontend list items are used as the first quick replies
        ],
        is_agent_handover: false,
    },
    
    // ----------------------------------------------------------------------
    // 2. Cancellation / Refund (High Priority)
    // ----------------------------------------------------------------------
    {
        intent: "cancellation_prompt",
        patterns: ["cancel", "refund", "exchange", "cancel ticket", "money back"],
        answer: "I can help with cancellation. Do you have your Booking ID ready?",
        next_options: ["Yes, I have it", "I don't have the ID", "View Cancellation Policy"],
        is_agent_handover: false,
    },
    {
        intent: "cancellation_policy",
        patterns: ["policy", "rules", "cancellation rules"],
        answer: "Tickets can be cancelled up to 2 hours before showtime. A 10% processing fee applies. Funds are returned within 5-7 business days.",
        next_options: ["Proceed to Cancel", "Chat with Agent"],
        is_agent_handover: false,
    },
    {
        intent: "no_booking_id",
        patterns: ["i don't have it", "lost id", "no id"],
        answer: "No problem. I will connect you to a live advisor who can locate your booking using your phone number or email.",
        next_options: ["Connect to Agent Now", "Try finding ID myself"],
        is_agent_handover: true, // Flag this as needing agent
    },

    // ----------------------------------------------------------------------
    // 3. Ticket Booking / Issues
    // ----------------------------------------------------------------------
    {
        intent: "ticket_booking_issue",
        patterns: ["booking issue", "ticket not received", "confirmation problem", "book ticket"],
        answer: "Is your issue related to a ticket you already booked, or is it about how to book a ticket?",
        next_options: ["Already Booked (Not Received)", "How to Book a Ticket"],
        is_agent_handover: false,
    },
    {
        intent: "how_to_book_ticket",
        patterns: ["how to book", "ticket kaise book karu", "movie book kaise karte hain"],
        answer: "It's easy! Select your city → choose a movie → pick a cinema and time → pick seats → complete payment. Do you need help with a specific step?",
        next_options: ["Trouble with Payment", "Choose Cinema", "Main Menu"],
        is_agent_handover: false,
    },

    // ----------------------------------------------------------------------
    // 4. Offers & Discounts
    // ----------------------------------------------------------------------
    {
        intent: "offers_discounts",
        patterns: ["offers", "discounts", "card offer", "promo code", "coupon"],
        answer: "We have several exciting offers right now! Are you looking for credit card offers or general promotional deals?",
        next_options: ["Credit/Debit Card Offers", "General Promotions"],
        is_agent_handover: false,
    },
    
    // ----------------------------------------------------------------------
    // 5. Live Agent Handover
    // ----------------------------------------------------------------------
    {
        intent: "escalate_to_agent",
        patterns: ["talk to agent", "live advisor", "connect me", "human", "talk to support"],
        answer: "I am connecting you now. Please wait a moment while I transfer you to the next available advisor.",
        next_options: [], // No options needed, as conversation is handed over
        is_agent_handover: true, 
    },

    // ----------------------------------------------------------------------
    // 6. Final Fallback (Catch-All)
    // ----------------------------------------------------------------------
    {
        intent: "fallback_unmatched",
        patterns: ["unmatched_query"], // A keyword that is unlikely to be matched, used for manual search
        answer: "I'm sorry, I couldn't understand that query. Can you try phrasing it differently or select an option below?",
        next_options: ["Cancellation/Refund", "Chat with Agent", "Main Menu"],
        is_agent_handover: false, 
    },
];

async function seed() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connection successful.");

        // Clean slate: Delete all existing chatbot data
        await ChatbotQA.deleteMany({});
        
        // Insert all new data
        await ChatbotQA.insertMany(data);

        console.log(`Chatbot data inserted successfully! Total records: ${data.length}`);
        
        // Disconnect and exit
        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error("SEEDING ERROR:", err);
        process.exit(1);
    }
}

seed();