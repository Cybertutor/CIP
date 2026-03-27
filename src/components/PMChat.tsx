'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/lib/types';

interface PMChatProps {
  messages: Message[];
  taskDescription: string;
  isLoading: boolean;
  isPRDReady: boolean;
  onReply: (message: string) => void;
  onConfirm: () => void;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    // Remove [PRD_READY] marker from display
    const cleaned = content.replace('[PRD_READY]', '').trim();

    return cleaned.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-white">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-gray-200">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc text-gray-300">{line.slice(2)}</li>;
      }
      if (line.match(/^\d+\. /)) {
        return <li key={i} className="ml-4 list-decimal text-gray-300">{line.replace(/^\d+\. /, '')}</li>;
      }
      if (line === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-gray-300">{line}</p>;
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-lg">
          👩‍💼
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 border border-gray-700 rounded-tl-sm'
        }`}
      >
        {!isUser && (
          <div className="text-xs text-blue-400 font-semibold mb-1">👩‍💼 產品經理</div>
        )}
        <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : ''}`}>
          {renderContent(message.content)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-lg">
          👤
        </div>
      )}
    </div>
  );
}

export default function PMChat({
  messages,
  taskDescription,
  isLoading,
  isPRDReady,
  onReply,
  onConfirm,
}: PMChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onReply(input.trim());
      setInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-xl">
            👩‍💼
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">需求分析階段</h2>
            <p className="text-sm text-gray-400">與產品經理釐清需求</p>
          </div>
        </div>
        <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-400">
          <span className="text-gray-500">任務：</span>
          <span className="text-gray-300">{taskDescription}</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="h-[480px] overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-lg">
                👩‍💼
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="text-xs text-blue-400 font-semibold mb-1">👩‍💼 產品經理</div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}

          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-lg">
                👩‍💼
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="text-xs text-blue-400 font-semibold mb-1">👩‍💼 產品經理</div>
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* PRD Ready confirmation */}
        {isPRDReady && !isLoading && (
          <div className="px-5 py-4 bg-green-950/50 border-t border-green-800/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-green-400 text-xl">✅</span>
              <div>
                <p className="text-green-400 font-semibold text-sm">需求文件已完成！</p>
                <p className="text-gray-400 text-xs">產品需求文件(PRD)已準備就緒，可以開始開發</p>
              </div>
            </div>
            <button
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              確認需求，開始開發
            </button>
          </div>
        )}

        {/* Input area */}
        {!isPRDReady && (
          <div className="border-t border-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="回答產品經理的問題..."
                rows={2}
                disabled={isLoading}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm transition-colors disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1 text-sm font-medium"
              >
                {isLoading ? '⏳' : '發送'}
              </button>
            </form>
            <p className="text-xs text-gray-600 mt-2 text-center">Enter 發送 · Shift+Enter 換行</p>
          </div>
        )}
      </div>
    </div>
  );
}
