import mongoose from "mongoose";
import dotenv from "dotenv";
import Chatbot from "./models/Chatbot.js";  // <- model import

dotenv.config();

const data = [
  {
    intent: "how_to_book_ticket",
    patterns: [
      "how to book ticket",
      "ticket kaise book karu",
      "movie book kaise karte hain",
      "show kaise book karu"
    ],
    answer: "Select your city → choose movie → choose cinema → choose time → pick seats → pay. That's it!"
  },
  {
    intent: "payment_methods",
    patterns: [
      "payment method",
      "UPI accept?",
      "card payment?",
      "kya payment options hai"
    ],
    answer: "We support UPI, debit/credit cards and wallets. All payments are secure."
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");

    await Chatbot.deleteMany({});
    await Chatbot.insertMany(data);

    console.log("Chatbot data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();


// this file is just to seed the messages to the database
