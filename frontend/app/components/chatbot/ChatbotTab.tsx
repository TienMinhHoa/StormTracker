'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './chatbotTypes';

interface ChatbotTabProps {
  stormId?: string;
}

const WEBSOCKET_URL = 'ws://118.70.181.146:58888/chatbot/ws';

export default function ChatbotTab({ stormId }: ChatbotTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdCounter = useRef<number>(1);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: messageIdCounter.current++,
      text,
      isUser,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        // addMessage('Đã kết nối với AI Assistant. Bạn có thể bắt đầu trò chuyện!', false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Lỗi kết nối WebSocket');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        setIsTyping(false);
        wsRef.current = null;

        // Auto-reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionError('Không thể kết nối đến server');
      setIsConnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsTyping(false);
  };

  const handleServerMessage = (data: any) => {
    const type = data.type;

    if (type === 'status') {
      if (data.status === 'processing') {
        setIsTyping(true);
      } else if (data.status === 'ready') {
        setIsTyping(false);
        if (data.message) {
          addMessage(data.message, false);
        }
      } else if (data.status === 'connected') {
        if (data.message) {
          addMessage(data.message, false);
        }
      }
    } else if (type === 'response') {
      setIsTyping(false);
      if (data.response) {
        addMessage(data.response, false);
      }
    } else if (type === 'error') {
      setIsTyping(false);
      addMessage(`Lỗi: ${data.error || 'Đã xảy ra lỗi không xác định'}`, false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !isConnected) return;

    const messageText = inputText.trim();
    addMessage(messageText, true);
    setInputText('');

    // Send message via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // If live mode (NOWLIVE1234 or any NOW*), use NOLIVE1234Connected to Storm Tracker AI assistant. Send your message! for chatbot
      const stormIdToSend = stormId === 'NOWLIVE1234' || (stormId && stormId.startsWith('NOW')) 
        ? 'NOWLIVE1234' 
        : (stormId || 'STORM001');
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          message: messageText,
          storm_id: stormIdToSend,
        })
      );
      setIsTyping(true);
    } else {
      addMessage('Không thể gửi tin nhắn. Vui lòng kết nối lại.', false);
    }
  };

  const handleReset = () => {
    if (!isConnected) {
      addMessage('Vui lòng kết nối trước khi reset cuộc trò chuyện.', false);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'reset',
        })
      );
      setMessages([]);
      addMessage('Cuộc trò chuyện đã được reset.', false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Reconnect when stormId changes
  useEffect(() => {
    if (isConnected && stormId) {
      // Optionally reset conversation when storm changes
      // handleReset();
    }
  }, [stormId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-green-500'
                  : isConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected
                ? 'Đã kết nối'
                : isConnecting
                ? 'Đang kết nối...'
                : 'Chưa kết nối'}
            </span>
          </div>
          <div className="flex gap-2">
            {!isConnected && !isConnecting && (
              <button
                onClick={connectWebSocket}
                className="text-xs px-2 py-1 rounded bg-[#137fec] text-white hover:bg-[#137fec]/90 transition-colors"
              >
                Kết nối
              </button>
            )}
            {isConnected && (
              <button
                onClick={handleReset}
                className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {connectionError && (
          <p className="text-xs text-red-400 mt-1">{connectionError}</p>
        )}
        {stormId && (
          <p className="text-xs text-gray-500 mt-1">Storm ID: {stormId}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {messages.length === 0 && !isConnecting && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm text-center">
              {isConnected
                ? 'Bắt đầu trò chuyện với AI Assistant...'
                : 'Đang kết nối với AI Assistant...'}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.isUser
                    ? 'bg-gray-700 text-white'
                    : 'bg-[#137fec] text-white'
                }`}
              >
                {message.isUser ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <div className="text-sm markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Paragraphs
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                        ),
                        // Headings
                        h1: ({ node, ...props }) => (
                          <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0" {...props} />
                        ),
                        // Lists
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        // Code
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block bg-white/20 p-2 rounded text-xs font-mono overflow-x-auto my-2"
                              {...props}
                            />
                          ),
                        pre: ({ node, ...props }) => (
                          <pre className="bg-white/20 p-2 rounded overflow-x-auto my-2" {...props} />
                        ),
                        // Links
                        a: ({ node, ...props }) => (
                          <a
                            className="underline hover:text-white/80 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        // Blockquotes
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-2 border-white/40 pl-3 my-2 italic"
                            {...props}
                          />
                        ),
                        // Tables
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-2">
                            <table className="min-w-full border-collapse" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="border border-white/30 px-2 py-1 bg-white/10" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-white/30 px-2 py-1" {...props} />
                        ),
                        // Strong/Bold
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold" {...props} />
                        ),
                        // Emphasis/Italic
                        em: ({ node, ...props }) => (
                          <em className="italic" {...props} />
                        ),
                        // Horizontal rule
                        hr: ({ node, ...props }) => (
                          <hr className="my-3 border-white/30" {...props} />
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-3 py-2 bg-[#137fec] text-white">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
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
            placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
            disabled={!isConnected}
            className="flex-1 rounded-lg border border-gray-700 bg-[#1c2127] px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || !isConnected}
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
