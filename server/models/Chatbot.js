import mongoose from "mongoose";

const chatbotSchema = new mongoose.Schema({
    // 1. Core Fields (Same)
    intent: { 
        type: String, 
        required: true,
        unique: true // Ensure intent names are unique for organization
    },
    patterns: { 
        type: [String], 
        required: true,
        lowercase: true, // Crucial for reliable keyword matching
        trim: true
    },
    answer: { 
        type: String, 
        required: true 
    },

    // 2. NEW FIELD: Quick Reply Buttons
    next_options: {
        type: [String],
        default: [] // Use an array of strings for the button labels
    },

    // 3. NEW FIELD: Agent Handover Flag
    is_agent_handover: {
        type: Boolean,
        default: false // Set to true if this response requires a human agent
    },
});

const ChatbotQA = mongoose.model('ChatbotQA', chatbotSchema);

export default ChatbotQA;