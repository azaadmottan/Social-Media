import { getSocket } from "@/helper/socket";
import { useEffect, useRef, useState } from "react";

const Chat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // const [userId] = useState("1234567890"); // Replace with real ID
  const [chatId] = useState("chat123");    // Replace with real chat/group ID
  const socket = getSocket();

  // const [chatId, setChatId] = useState<string>();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!socket || !chatId) return;

    if (!isTyping) {
      socket.emit("chat:typing", { chatId });
    }
  

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to emit stopTyping
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stopTyping", { chatId });
      
      setIsTyping(false);
    }, 400); // 0.4s of inactivity = stop typing
  };

  useEffect(() => {

    socket?.on("user:online", () => {
      setIsConnected(true);
      socket?.emit("chat:join", { chatId });
    });

    socket?.on("chat:message", (message) => {
      if (message.sender != socket?.id) {
        setMessages((prev) => [...prev, `Other: ${message.content}`]);
      }
    });

    
    socket?.on("chat:typing", () => {
      // if (socket?.id == chat.sender) {

        setIsTyping(true);
      // }
    });

    socket?.on("chat:stopTyping", () => {
      setIsTyping(false);
    });

    socket?.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket?.disconnect();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!message?.trim()) return;

    socket?.emit("chat:message", {
      chatId,
      message: message,
    });

    setMessages((prev) => [...prev, `You: ${message}`]);
    setMessage("");
  };

  return (
    // <div style={{ padding: "1rem" }}>
    //   <p>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
    //   <p>{isTyping ? "Typing..." : ""}</p>
    //   <div>
    //     <input 
    //       type="text" 
    //       value={chatId} 
    //       // onChange={(e) => setChatId(e.target.value)}
    //       style={{ width: "70%", padding: "8px" }}
    //       placeholder="Enter chat id"/>
    //   </div>
    //   <div style={{ marginBottom: "1rem" }}>
    //     <input
    //       type="text"
    //       placeholder="Type message..."
    //       value={message}
    //       onChange={handleInputChange}
    //       style={{ width: "70%", padding: "8px" }}
    //     />
    //     <button onClick={sendMessage} style={{ padding: "8px 12px" }}>
    //       Send
    //     </button>
    //   </div>

    //   <div>
    //     <h4>Messages:</h4>
    //     {messages.map((msg, i) => (
    //       <p key={i} style={{ margin: "0.5rem 0" }}>{msg}</p>
    //     ))}
    //   </div>
    // </div>
  <>
  <div className="w-full flex flex-1">
    <section
    className="w-4/12 border-r-2 overflow-y-auto"
    >
      <h2>Users</h2>
    </section>

    <section className="w-8/12 h-full">
      {/* {Array.from({ length: 30 }).map((_, i) => (
      <p key={i}>user chat {i + 1}</p>
    ))} */}
    user chat
    </section>
  </div>
  </>
  );
};

export default Chat;