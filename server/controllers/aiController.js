import { recommendMovies } from "../ai/movieAgent.js";

export const getAIRecommendations = async (req, res) => {
    try {
        const { message, threadId } = req.body;

        if (
            typeof message !== "string" || !message.trim() || message.length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "A message of 1-1000 characters is required.",
            });
        }

        if (
            typeof threadId != "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(threadId)
        ){
            return res.status(400).json({
                success: false,
                message: "A valid conversation ID is required",
            });
        }

        const result = await recommendMovies(
            message.trim(),
            threadId
        );

        return res.status(200).json(result);
    } catch(err) {
        console.error("AI recommendations error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to generate movie recommendations.",
        });
    }
};

