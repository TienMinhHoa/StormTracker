'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from './chatbotTypes';

const initialMessages: Message[] = [
  {
    id: 1,
    text: 'Hãy chỉ ra cho tôi khoảng mấy giờ bão qua nhà tôi',
    isUser: true,
  },
  {
    id: 2,
    text: 'Dựa trên vị trí nhà của bạn và đường đi dự báo của cơn bão, dự kiến mắt bão sẽ đi qua vào khoảng 3:15 sáng. Tôi đã phóng to bản đồ đến vị trí của bạn để bạn có thể theo dõi trực tiếp.',
    isUser: false,
  },
];

export default function ChatbotTab() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: 'Tôi đang phân tích dữ liệu thời tiết để trả lời câu hỏi của bạn...',
        isUser: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.isUser
                    ? 'bg-gray-700 text-white'
                    : 'bg-[#137fec] text-white'
                }`}
              >
                <p className="text-sm leading-normal">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 border-t border-white/10 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-lg border border-gray-700 bg-[#1c2127] px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="px-4 py-2 rounded-lg bg-[#137fec] text-white hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
