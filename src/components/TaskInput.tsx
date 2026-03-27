'use client';

import { useState } from 'react';

interface TaskInputProps {
  onSubmit: (task: string) => void;
  isLoading: boolean;
}

const EXAMPLE_TASKS = [
  '建立一個待辦事項管理應用程式，支援新增、編輯、刪除和分類功能',
  '開發一個部落格系統，具有文章發布、評論和標籤分類功能',
  '設計一個電商購物車系統，支援商品瀏覽、加入購物車和結帳流程',
];

export default function TaskInput({ onSubmit, isLoading }: TaskInputProps) {
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim() && !isLoading) {
      onSubmit(task.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setTask(example);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-white mb-3">
            描述你的專案需求
          </h2>
          <p className="text-gray-400 text-lg">
            AI 開發團隊將協助你從需求分析到程式碼實作
          </p>
        </div>

        {/* Agent team preview */}
        <div className="flex justify-center gap-4 mb-10">
          {[
            { emoji: '👩‍💼', name: '產品經理', color: 'text-blue-400' },
            { emoji: '🏗️', name: '架構師', color: 'text-purple-400' },
            { emoji: '⚙️', name: '後端工程師', color: 'text-green-400' },
            { emoji: '🖥️', name: '前端工程師', color: 'text-orange-400' },
            { emoji: '🎨', name: 'UI/UX', color: 'text-pink-400' },
          ].map((agent) => (
            <div key={agent.name} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl">
                {agent.emoji}
              </div>
              <span className={`text-xs ${agent.color}`}>{agent.name}</span>
            </div>
          ))}
        </div>

        {/* Task input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="例如：建立一個待辦事項應用程式，支援用戶登入、新增任務、設定截止日期和優先級別..."
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-base leading-relaxed transition-colors"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-600">
              Cmd+Enter 送出
            </div>
          </div>

          <button
            type="submit"
            disabled={!task.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                處理中...
              </>
            ) : (
              <>
                <span>🚀</span>
                開始需求分析
              </>
            )}
          </button>
        </form>

        {/* Example tasks */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3 text-center">範例任務：</p>
          <div className="space-y-2">
            {EXAMPLE_TASKS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-200 text-sm transition-all duration-200 disabled:opacity-50"
              >
                <span className="text-gray-600 mr-2">→</span>
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
