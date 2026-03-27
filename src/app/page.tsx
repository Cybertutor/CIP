'use client';

import { useState, useCallback } from 'react';
import TaskInput from '@/components/TaskInput';
import PMChat from '@/components/PMChat';
import WorkflowFeed from '@/components/WorkflowFeed';
import type { AppState, Message, WorkflowFeedItem } from '@/lib/types';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [taskDescription, setTaskDescription] = useState('');
  const [pmMessages, setPmMessages] = useState<Message[]>([]);
  const [prd, setPrd] = useState('');
  const [feedItems, setFeedItems] = useState<WorkflowFeedItem[]>([]);
  const [outputDir, setOutputDir] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle task submission: start PM conversation
  const handleTaskSubmit = useCallback(async (task: string) => {
    setTaskDescription(task);
    setAppState('pm_conversation');
    setIsLoading(true);
    setError(null);
    setPmMessages([]);

    try {
      const response = await fetch('/api/pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], taskDescription: task }),
      });

      if (!response.ok || !response.body) {
        throw new Error('PM API 請求失敗');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'text') {
                assistantContent += event.content;
                setPmMessages([
                  { role: 'user', content: task },
                  { role: 'assistant', content: assistantContent },
                ]);
              } else if (event.type === 'done') {
                // Check if PRD is ready
                if (assistantContent.includes('[PRD_READY]')) {
                  const prdMatch = assistantContent.match(/## 產品需求文件\(PRD\)[\s\S]*/);
                  if (prdMatch) {
                    setPrd(prdMatch[0]);
                  }
                }
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseError) {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle PM user reply in multi-turn conversation
  const handlePMReply = useCallback(async (userMessage: string) => {
    const newMessages: Message[] = [
      ...pmMessages,
      { role: 'user', content: userMessage },
    ];
    setPmMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, taskDescription }),
      });

      if (!response.ok || !response.body) {
        throw new Error('PM API 請求失敗');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // Temporarily add placeholder for assistant message
      setPmMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'text') {
                assistantContent += event.content;
                setPmMessages([
                  ...newMessages,
                  { role: 'assistant', content: assistantContent },
                ]);
              } else if (event.type === 'done') {
                if (assistantContent.includes('[PRD_READY]')) {
                  const prdMatch = assistantContent.match(/## 產品需求文件\(PRD\)[\s\S]*/);
                  if (prdMatch) {
                    setPrd(prdMatch[0]);
                  }
                }
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
    } finally {
      setIsLoading(false);
    }
  }, [pmMessages, taskDescription]);

  // Handle confirm PRD and start workflow
  const handleConfirmPRD = useCallback(async () => {
    setAppState('building');
    setFeedItems([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd, taskDescription }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Workflow API 請求失敗');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'agent_start') {
                setFeedItems(prev => [...prev, {
                  id: `${event.agent}-start-${Date.now()}`,
                  type: 'agent_start',
                  agent: event.agent,
                  agentName: event.name,
                  agentEmoji: event.emoji,
                  timestamp: Date.now(),
                }]);
              } else if (event.type === 'text') {
                setFeedItems(prev => {
                  const lastItem = prev[prev.length - 1];
                  // Append text to last text item for same agent if possible
                  if (lastItem && lastItem.type === 'text' && lastItem.agent === event.agent) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastItem, content: (lastItem.content || '') + event.content },
                    ];
                  }
                  return [...prev, {
                    id: `${event.agent}-text-${Date.now()}`,
                    type: 'text',
                    agent: event.agent,
                    content: event.content,
                    timestamp: Date.now(),
                  }];
                });
              } else if (event.type === 'file') {
                setFeedItems(prev => [...prev, {
                  id: `${event.agent}-file-${event.filename}-${Date.now()}`,
                  type: 'file',
                  agent: event.agent,
                  filename: event.filename,
                  fileContent: event.content,
                  timestamp: Date.now(),
                }]);
              } else if (event.type === 'phase_complete') {
                setFeedItems(prev => [...prev, {
                  id: `${event.agent}-complete-${Date.now()}`,
                  type: 'phase_complete',
                  agent: event.agent,
                  timestamp: Date.now(),
                }]);
              } else if (event.type === 'workflow_complete') {
                setOutputDir(event.outputDir);
                setFeedItems(prev => [...prev, {
                  id: `workflow-complete-${Date.now()}`,
                  type: 'workflow_complete',
                  outputDir: event.outputDir,
                  timestamp: Date.now(),
                }]);
                setAppState('complete');
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                setError(parseErr.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤');
      setAppState('complete');
    } finally {
      setIsLoading(false);
    }
  }, [prd, taskDescription]);

  // Reset to idle
  const handleReset = useCallback(() => {
    setAppState('idle');
    setTaskDescription('');
    setPmMessages([]);
    setPrd('');
    setFeedItems([]);
    setOutputDir('');
    setError(null);
    setIsLoading(false);
  }, []);

  const isPRDReady = pmMessages.some(
    m => m.role === 'assistant' && m.content.includes('[PRD_READY]')
  );

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-lg font-bold text-white">CIP AI 開發團隊</h1>
              <p className="text-xs text-gray-400">多代理人協作開發系統</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* State indicator */}
            <div className="flex items-center gap-2">
              {['idle', 'pm_conversation', 'building', 'complete'].map((state, i) => (
                <div key={state} className="flex items-center gap-1">
                  {i > 0 && <div className="w-6 h-px bg-gray-700" />}
                  <div className={`w-2 h-2 rounded-full ${
                    appState === state
                      ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                      : i < ['idle', 'pm_conversation', 'building', 'complete'].indexOf(appState)
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                  }`} />
                </div>
              ))}
            </div>
            {appState !== 'idle' && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-800"
              >
                重新開始
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            <span className="font-semibold">錯誤：</span> {error}
          </div>
        )}

        {appState === 'idle' && (
          <TaskInput onSubmit={handleTaskSubmit} isLoading={isLoading} />
        )}

        {appState === 'pm_conversation' && (
          <PMChat
            messages={pmMessages}
            taskDescription={taskDescription}
            isLoading={isLoading}
            isPRDReady={isPRDReady}
            onReply={handlePMReply}
            onConfirm={handleConfirmPRD}
          />
        )}

        {(appState === 'building' || appState === 'complete') && (
          <WorkflowFeed
            feedItems={feedItems}
            isBuilding={appState === 'building'}
            outputDir={outputDir}
          />
        )}
      </div>
    </main>
  );
}
