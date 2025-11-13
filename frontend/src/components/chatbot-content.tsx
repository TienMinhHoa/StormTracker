"use client"

import { useState } from "react"
import { Send } from "lucide-react"

interface Message {
  id: number
  text: string
  sender: "user" | "system"
}

export default function ChatbotContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hãy chi ra cho tôi khoảng máy giờ báo qua nhà tôi",
      sender: "system",
    },
    {
      id: 2,
      text: "Dựa trên vị trí nhà của bạn và dường đi dự báo của con bão, dự kiến mật bão sẽ đi qua vào khoảng 3-15 sáng. Tôi đã phóng to bản đó đến vị trí của bạn để bạn có thể theo dõi mặc dù bão sẽ tới.",
      sender: "user",
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          text: inputValue,
          sender: "user",
        },
      ])
      setInputValue("")
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Chat */}
      <div className="w-96 border-r border-border bg-card overflow-y-auto flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-secondary text-secondary-foreground rounded-bl-none"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSendMessage()
              }}
              placeholder="Ask about weather..."
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSendMessage}
              className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right - Map */}
      <div className="flex-1 bg-gradient-to-br from-teal-900 via-blue-900 to-teal-800 relative overflow-hidden">
        <img
          src="/world-map-topography.jpg"
          alt="Global weather map"
          className="w-full h-full object-cover opacity-90"
        />
        {/* Map Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
          <button className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-foreground shadow-lg">
            +
          </button>
          <button className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-lg flex items-center justify-center text-foreground shadow-lg">
            −
          </button>
        </div>
        {/* Target Button */}
        <div className="absolute bottom-8 right-24">
          <button className="w-12 h-12 bg-accent hover:bg-accent/90 rounded-lg flex items-center justify-center text-accent-foreground shadow-lg">
            ⊙
          </button>
        </div>
      </div>
    </div>
  )
}
