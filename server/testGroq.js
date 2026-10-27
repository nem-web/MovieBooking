import "dotenv/config";
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0,
    timeout: 30000,
    maxRetries: 0,
});

try {
    console.time("Groq Test");

    const response = await model.invoke(
        "Reply with only the word OK."
    );

    console.timeEnd("Groq Test");
    console.log(response.content);

} catch (error) {
    console.error("Error:", error.name, error.message);
}