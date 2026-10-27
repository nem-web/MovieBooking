import React, {useState, useRef, useEffect} from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const quickPrompts = [
    "Recommended action movies",
    "I want something funny",
    "Suggest a thriller",
    "Surprise me"
];

const MovieAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [threadId] = useState(() => crypto.randomUUID());

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hey! 🍿 I'm QuickShow AI. What kind of movie are you in the mood for?",
            movies: [],
        }
    ]);

    const bottomRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading, isOpen]);

    const sendMessage = async (text = input) => {
        const message = text.trim();

        if(!message || loading) return;

        setInput("");
        setLoading(true);

        setMessages((prev) => [
            ...prev,
            {role : "user", content: message},
        ]);

        try {
            const response = await fetch(`${API_URL}/api/ai/recommend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    threadId,
                }),
            });

            if(!response.ok){
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();

            console.log("AI API Response:", data);
            console.log("Recommended Movies:", data.movies);

            if (data.success === false){
                throw new Error(data.message || "Recommendation failed");
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply || "Here are my recommendations.",
                    movies: Array.isArray(data.movies) ? data.movies : [],
                },
            ]);

        } catch(err){
            console.error("AI chatbot error: ", err);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I couldn't get recommendations right now. Please try again.",
                    movies: [],
                },
            ]);
        } finally {
            setLoading(false)
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-110"
                    aria-label="Open movie assistant"
                >
                    <span className="text-2xl">✦</span>
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-4 right-4 z-50 flex h-[min(580px,85dvh)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#18181f] text-white shadow-2xl sm:bottom-6 sm:right-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-700 bg-[#22222c] px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                                ✦
                            </div>

                            <div>
                                <h3 className="font-semibold">QuickShow AI</h3>
                                <p className="text-xs text-gray-400">Your personal movie guide</p>
                            </div>
                        </div>

                        <button onClick={() => setIsOpen(false)} 
                            className="rounded-full px-3 py-1 text-1xl text-gray-400 hover:bg-gray-700 hover:text-white"
                            aria-label="Close chatbot"
                        >
                            x
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
                        {messages.map((msg, idx) => (
                            <div 
                                key={idx}
                                className={`flex ${
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div 
                                    className={`max-w-[90%] rounded-2xl px-3 py-3 text-sm leading-relaxed ${
                                        msg.role === "user" ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-[#292934] text-gray-100"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">
                                        {msg.content}
                                    </p>

                                    {/* Recommended movie cards */}
                                    {msg.movies?.length > 0 && (
                                        <div className="mt-3 space-y-3">
                                            {msg.movies.map((movie) => (
                                                <div 
                                                    key={movie.id}
                                                    className="flex gap-3"
                                                >
                                                    {movie.poster_path && (
                                                        <img
                                                            src={
                                                                movie.poster_path.startsWith("http") ? movie.poster_path : `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                                                            }
                                                            alt={movie.title}
                                                            className="h-24 w-16 rounded-md object-cover"
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium">{movie.title}</h4>

                                                        {movie.reason && (
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                {movie.reason}
                                                            </p>
                                                        )}

                                                        <button 
                                                            onClick={() => {
                                                                setIsOpen(false);
                                                                navigate(`/movies/${movie.id}`);
                                                            }}
                                                            className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                                                        >
                                                            View movie
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Quick suggestions */}
                        {messages.length === 1 && (
                            <div className="flex flex-wrap gap-2">
                                {quickPrompts.map((prompt) => (
                                    <button 
                                        key={prompt}
                                        onClick={() => sendMessage(prompt)}
                                        disabled={loading}
                                        className="rounded-full border border-gray-600 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-primary hover:text-white disabled:opacity-50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading animation */}
                        {loading && (
                            <div className="w-fit rounded-xl px-4 y-3 text-sm text-gray-400 bg-[#292934]">
                                <span className="animate-pulse">Finding movies for you...</span>
                            </div>
                        )}

                        <div ref={bottomRef}/>
                    </div>

                    {/* Messages input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex items-center gap-2 border-t border-gray-700 bg-[#22222c] p-3"
                    >
                        <input
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask for a movie..."
                            disabled={loading}
                            className="min-w-0 flex-1 rounded-full bg-[#30303d] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-primary disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-white transition-opacity hover:opacity-90 disable:opacity-40"
                            aria-label="Send message"
                        >
                            ↗
                        </button>
                    </form>
                </div>
            )}
        </>
    )
};

export default MovieAssistant;

