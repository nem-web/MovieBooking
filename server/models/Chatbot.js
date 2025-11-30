import mongoose from "mongoose";

const chatbotSchema = new mongoose.Schema({
    intent: {type: String, required: true  },
    patterns: {type: [String], required: true  },
    answer: { type: String, required: true  },
});

const chatbotQA = mongoose.model('chatbotQA', chatbotSchema);

export default chatbotQA;