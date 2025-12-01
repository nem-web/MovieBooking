import express from 'express';
import ChatbotQA from '../models/Chatbot.js';

const router = express.Router();

/**
 * Helper function to clean user input for reliable keyword search.
 * It removes punctuation, converts to lowercase, and trims whitespace.
 */
const normalizeText = (text) => {
    // We replace punctuation with an empty string, convert to lower case, and trim whitespace
    return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
};

/**
 * POST /api/chat/send
 * Handles user messages and returns a structured bot reply based on keyword matching.
 */
router.post('/send', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ reply: "Message is required." });
    }

    const cleanInput = normalizeText(message);
    // 1. Extract significant words (length > 2) to build the search pattern
    // This helps ignore common words like 'a', 'the', 'is', etc.
    const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 2); 

    // Create a regular expression for an OR match across all significant words
    // Example: inputWords = ["need", "refund"] -> wordPattern = "need|refund"
    const wordPattern = inputWords.join('|');
    const searchRegex = new RegExp(wordPattern, 'i'); // 'i' for case-insensitivity

    try {
        // 2. Attempt to find the best match: Find a document where ANY element 
        // in the 'patterns' array matches the constructed regex.
        const matchedPattern = await ChatbotQA.findOne({
            patterns: { $regex: searchRegex } 
        }).lean(); 
        
        let responseData;

        if (matchedPattern) {
            // Match found: Success!
            responseData = {
                reply: matchedPattern.answer,
                options: matchedPattern.next_options,
                intent: matchedPattern.intent,
                is_agent_handover: matchedPattern.is_agent_handover,
            };
        } else {
            // 3. Fallback: Query the database for the explicit fallback intent
            const fallback = await ChatbotQA.findOne({ intent: 'fallback_unmatched' }).lean();
            
            if (fallback) {
                // Return the database's fallback message
                responseData = {
                    reply: fallback.answer,
                    options: fallback.next_options,
                    intent: fallback.intent,
                    is_agent_handover: fallback.is_agent_handover,
                };
            } else {
                // 4. Final Hardcoded Safety Net (If DB fallback is also missing)
                responseData = {
                    reply: "I couldn't find an exact match. Please rephrase or select a main menu option.",
                    options: ["Cancellation/Refund", "Chat with Agent"],
                    intent: "fallback_hardcoded",
                };
            }
        }

        return res.json(responseData);

    } catch (error) {
        console.error("Chatbot Runtime Error:", error);
        // Send a generic internal server error message
        return res.status(500).json({ reply: "An internal server error occurred." });
    }
});

export default router;