import "dotenv/config";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
}

const start = Date.now();

try {
    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b",
                messages: [
                    {
                        role: "user",
                        content: "Say Hello",
                    },
                ],
                max_completion_tokens: 100,
            }),
            signal: AbortSignal.timeout(30000),
        }
    );

    console.log("Status:", response.status);
    console.log("Time:", Date.now() - start, "ms");

    const data = await response.json();

    console.log(
        "Response:",
        data.choices?.[0]?.message?.content || data.error
    );

} catch (error) {
    console.error("Error:", error.name, error.message);
    console.error("Cause:", error.cause?.message);
    console.log("Time:", Date.now() - start, "ms");
}