import { useState, useRef, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { MdSupportAgent, MdConfirmationNumber , MdLocalOffer } from "react-icons/md";
import { BiMoviePlay, BiHelpCircle } from "react-icons/bi";
import { IoMdSend } from "react-icons/io";
import { RiRefund2Line } from "react-icons/ri";
// import { options } from "../../../server/routes/chat";

// 1. CONFIGURATION: Define your Menu Hierarchy here
const MENU_DATA = {
  main: [
    { id: "stream", label: "BookMyShow Stream", sub: "Rent movies", icon: <BiMoviePlay />, color: "bg-blue-500" },
    { id: "cancel", label: "Cancellation/Refund", sub: "Cancel booking", icon: <RiRefund2Line />, color: "bg-red-500" },
    { id: "ticket", label: "Ticket Booking", sub: "Booking issues", icon: <MdConfirmationNumber />, color: "bg-yellow-500" },
    { id: "other", label: "Other Queries", sub: "More options...", icon: <BiHelpCircle />, color: "bg-gray-500", action: "submenu" }, // Special Action
  ],
  other: [
    { id: "offers", label: "Offers & Discounts", sub: "Credit card offers", icon: <MdLocalOffer />, color: "bg-purple-500" },
    { id: "feedback", label: "Cinema Feedback", sub: "Report an issue", icon: <BiHelpCircle />, color: "bg-orange-500" },
    { id: "agent", label: "Chat with Agent", sub: "Live support", icon: <MdSupportAgent />, color: "bg-green-600", action: "chat" }, // Triggers Chat
  ]
};

export default function BookMyShowWidget() {
  const [open, setOpen] = useState(false);
  
  // VIEW STATE: 'menu' shows the list, 'chat' shows the conversation
  const [view, setView] = useState("menu"); 
  
  // MENU LEVEL: 'main' is the first screen, 'other' is the second screen
  const [menuLevel, setMenuLevel] = useState("main"); 
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  // Handle clicking an item in the Menu
  const handleMenuClick = (item) => {
    // 1. If it's a Submenu trigger (like "Other")
    if (item.action === "submenu") {
      setMenuLevel("other");
      return;
    }

    // 2. If it's a normal option or "Chat with Agent"
    setView("chat");

    // Add initial messages based on selection
    if (item.id === "agent") {
      setMessages([
        { text: "Connecting you to an advisor...", sender: "system" },
        { text: "Hi! I'm your support agent. How can I help?", sender: "bot" }
      ]);
    } else {
      setMessages([
        { text: `I have a query regarding ${item.label}`, sender: "user" },
        { text: `Sure, let me help you with ${item.label}. Please provide your Booking ID if you have one.`, sender: "bot" }
      ]);
    }
  };

  // Handle standard Chat sending
  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");

    try{
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });

      if(!response.ok){
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const botReply = {
        text: data.reply,
        sender: "bot",
        options: data.options || []
      }

      setMessages((prev) => [...prev, botReply]);
    } catch(err){
      console.error("Chatbot API Error:", error);
      setMessages((prev) => [...prev, { 
          text: "Sorry, I can't connect to the server right now. Try again.", 
          sender: "system" 
      }]);
    }

    


    
    // Simulate generic response
    setTimeout(() => {
        setMessages((prev) => [...prev, { text: "Thanks for the details. Checking...", sender: "bot" }]);
    }, 1000);
  };

  // Go back logic
  const handleBack = () => {
    if (view === "chat") {
      // If in chat, go back to main menu and clear chat
      setView("menu");
      setMenuLevel("main"); 
      setMessages([]); 
    } else if (view === "menu" && menuLevel === "other") {
      // If in sub-menu, go back to main menu
      setMenuLevel("main");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-[1300] flex h-14 w-14 items-center justify-center rounded-full bg-[#da2f48] text-white shadow-lg transition-all hover:bg-[#b01e34] cursor-pointer ${
          open ? "rotate-90 scale-100 opacity-50" : "scale-100 opacity-100"
        }`}
      >
        <MdSupportAgent size={28} />
      </button>

      {/* Main Container */}
      <div
        className={`fixed bottom-24 right-6 z-[1300] flex w-[360px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"
        }`}
        style={{ height: "550px", fontFamily: "sans-serif" }}
      >
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between bg-[#da2f48] p-4 text-white">
          <div className="flex items-center gap-3">
             {/* Show Back Arrow if in Submenu or Chat */}
            {(view === "chat" || menuLevel !== "main") ? (
              <button onClick={handleBack} className="hover:bg-white/20 rounded-full p-1 transition cursor-pointer">
                 <ArrowBackIcon fontSize="small" />
              </button>
            ) : (
                <div className="bg-white/20 p-1 rounded">
                    <MdSupportAgent size={20} />
                </div>
            )}
            
            <div className="flex flex-col">
               <span className="text-sm font-bold">
                 {view === "chat" ? "Support Chat" : "Chat with us"}
               </span>
               {view === "chat" && <span className="text-xs opacity-80">Virtual Advisor</span>}
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* --- BODY CONTENT SWITCHER --- */}
        <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide relative">
            
            {/* VIEW 1: MENU LIST (Like Image 2) */}
            {view === "menu" && (
                <div className="p-2 animate-fadeIn">
                    {MENU_DATA[menuLevel].map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => handleMenuClick(item)}
                            className="flex items-center gap-4 p-4 bg-white mb-2 rounded-lg border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:border-[#da2f48]/30 group"
                        >
                            {/* Icon Box */}
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${item.color}`}>
                                {item.icon}
                            </div>
                            
                            {/* Text */}
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#da2f48]">{item.label}</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Can we connect you to an advisor...</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 2: CHAT INTERFACE (Like Image 1) */}
            {view === "chat" && (
                <div className="flex flex-col h-full">
                    
                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        
                         {/* The "New Messages" Dotted Line (Visual Detail from Image 1) */}
                         <div className="flex items-center gap-2 my-4 opacity-50">
                            <div className="h-[1px] flex-1 border-t border-dashed border-teal-600"></div>
                            <span className="text-xs text-teal-700 font-medium">New Messages</span>
                            <div className="h-[1px] flex-1 border-t border-dashed border-teal-600"></div>
                         </div>

                        {/* Messages */}
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.sender === "bot" && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-xs">🤖</div>
                                    )}
                                    <div
                                        className={`max-w-[80%] px-4 py-3 text-sm shadow-sm ${
                                            msg.sender === "user"
                                                ? "bg-[#da2f48] text-white rounded-2xl rounded-tr-none"
                                                : msg.sender === "system" 
                                                    ? "bg-yellow-50 text-gray-600 text-xs italic border border-yellow-100 w-full text-center"
                                                    : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                         <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                             <input 
                                type="text"
                                className="flex-1 bg-transparent text-sm outline-none"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                             />
                             <button onClick={handleSend} className="text-[#da2f48]">
                                <IoMdSend size={20} />
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </>
  );
}