'use client';

import { useEffect, useRef } from 'react';
import FileCard from './FileCard';
import type { WorkflowFeedItem } from '@/lib/types';

interface WorkflowFeedProps {
  feedItems: WorkflowFeedItem[];
  isBuilding: boolean;
  outputDir: string;
}

const AGENT_COLORS: Record<string, {
  bg: string;
  border: string;
  text: string;
  badge: string;
  dot: string;
}> = {
  architect: {
    bg: 'bg-purple-950/30',
    border: 'border-purple-800/50',
    text: 'text-purple-300',
    badge: 'bg-purple-900/50 text-purple-300 border-purple-700',
    dot: 'bg-purple-500',
  },
  backend: {
    bg: 'bg-green-950/30',
    border: 'border-green-800/50',
    text: 'text-green-300',
    badge: 'bg-green-900/50 text-green-300 border-green-700',
    dot: 'bg-green-500',
  },
  frontend: {
    bg: 'bg-orange-950/30',
    border: 'border-orange-800/50',
    text: 'text-orange-300',
    badge: 'bg-orange-900/50 text-orange-300 border-orange-700',
    dot: 'bg-orange-500',
  },
  uiux: {
    bg: 'bg-pink-950/30',
    border: 'border-pink-800/50',
    text: 'text-pink-300',
    badge: 'bg-pink-900/50 text-pink-300 border-pink-700',
    dot: 'bg-pink-500',
  },
  pm: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/50',
    text: 'text-blue-300',
    badge: 'bg-blue-900/50 text-blue-300 border-blue-700',
    dot: 'bg-blue-500',
  },
};

const DEFAULT_COLORS = {
  bg: 'bg-gray-900',
  border: 'border-gray-700',
  text: 'text-gray-300',
  badge: 'bg-gray-800 text-gray-300 border-gray-600',
  dot: 'bg-gray-500',
};

function getColors(agent?: string) {
  return (agent && AGENT_COLORS[agent]) || DEFAULT_COLORS;
}

function AgentStartCard({ item }: { item: WorkflowFeedItem }) {
  const colors = getColors(item.agent);
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${colors.bg} ${colors.border} animate-slide-up`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${colors.border} bg-gray-900`}>
        {item.agentEmoji}
      </div>
      <div className="flex-1">
        <div className={`font-bold text-base ${colors.text}`}>{item.agentEmoji} {item.agentName}</div>
        <div className="text-gray-400 text-sm mt-0.5">開始工作中...</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
        <span className="text-xs text-gray-500">進行中</span>
      </div>
    </div>
  );
}

function TextCard({ item }: { item: WorkflowFeedItem }) {
  const colors = getColors(item.agent);

  const renderLine = (line: string, i: number) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-base font-bold mt-3 mb-1 text-white">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-sm font-semibold mt-2 mb-0.5 text-gray-200">{line.slice(4)}</h3>;
    }
    if (line.startsWith('#### ')) {
      return <h4 key={i} className="text-sm font-medium mt-1.5 text-gray-300">{line.slice(5)}</h4>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc text-gray-400 text-sm">{line.slice(2)}</li>;
    }
    if (line.match(/^\d+\. /)) {
      return <li key={i} className="ml-4 list-decimal text-gray-400 text-sm">{line.replace(/^\d+\. /, '')}</li>;
    }
    if (line.startsWith('```')) {
      return null; // skip code fence markers in narrative
    }
    if (line === '') {
      return <div key={i} className="h-1" />;
    }
    // Check for inline code
    if (line.includes('`')) {
      const parts = line.split('`');
      return (
        <p key={i} className="text-gray-400 text-sm leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <code key={j} className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-xs font-mono">{part}</code>
              : part
          )}
        </p>
      );
    }
    return <p key={i} className="text-gray-400 text-sm leading-relaxed">{line}</p>;
  };

  // Filter out FILE blocks from display text
  const displayContent = (item.content || '').replace(/<<<FILE:[\s\S]*?<<<END_FILE>>>/g, '');
  const lines = displayContent.split('\n');

  if (!displayContent.trim()) return null;

  return (
    <div className={`p-4 rounded-xl border ${colors.border} bg-gray-900/50 animate-fade-in`}>
      <div className={`text-xs font-semibold mb-2 ${colors.text}`}>
        {/* agent label shown in parent context */}
      </div>
      <div className="space-y-0.5">
        {lines.map((line, i) => renderLine(line, i))}
      </div>
    </div>
  );
}

function PhaseCompleteCard({ item }: { item: WorkflowFeedItem }) {
  const colors = getColors(item.agent);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.border} ${colors.bg} animate-fade-in`}>
      <span className="text-green-400 text-lg">✅</span>
      <span className={`text-sm font-medium ${colors.text}`}>
        {item.agent && (AGENT_COLORS[item.agent] ? item.agent : 'agent')} 階段完成
      </span>
    </div>
  );
}

function WorkflowCompleteCard({ item }: { item: WorkflowFeedItem }) {
  return (
    <div className="p-6 rounded-2xl border border-green-700 bg-green-950/30 text-center animate-slide-up">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="text-xl font-bold text-green-400 mb-2">開發完成！</h3>
      <p className="text-gray-400 text-sm mb-4">AI 開發團隊已完成所有工作</p>
      {item.outputDir && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-left">
          <p className="text-xs text-gray-500 mb-1">輸出目錄：</p>
          <code className="text-green-400 text-xs font-mono break-all">{item.outputDir}</code>
        </div>
      )}
    </div>
  );
}

// Group feed items by agent session
function groupItemsByAgent(items: WorkflowFeedItem[]) {
  const groups: Array<{
    agent: string;
    agentName: string;
    agentEmoji: string;
    items: WorkflowFeedItem[];
  }> = [];

  let currentGroup: typeof groups[0] | null = null;

  for (const item of items) {
    if (item.type === 'agent_start') {
      currentGroup = {
        agent: item.agent || '',
        agentName: item.agentName || '',
        agentEmoji: item.agentEmoji || '',
        items: [item],
      };
      groups.push(currentGroup);
    } else if (item.type === 'workflow_complete') {
      groups.push({
        agent: '__complete__',
        agentName: '',
        agentEmoji: '',
        items: [item],
      });
    } else if (currentGroup) {
      currentGroup.items.push(item);
    }
  }

  return groups;
}

export default function WorkflowFeed({ feedItems, isBuilding, outputDir }: WorkflowFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const groups = groupItemsByAgent(feedItems);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedItems]);

  const WORKFLOW_AGENT_ORDER = ['architect', 'backend', 'frontend', 'uiux'];
  const completedAgents = feedItems
    .filter(i => i.type === 'phase_complete')
    .map(i => i.agent);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">開發進度</h2>
          {isBuilding && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              開發中...
            </div>
          )}
          {!isBuilding && feedItems.some(i => i.type === 'workflow_complete') && (
            <span className="text-xs text-green-400">✅ 已完成</span>
          )}
        </div>
        <div className="flex gap-2">
          {WORKFLOW_AGENT_ORDER.map((agentId) => {
            const isComplete = completedAgents.includes(agentId);
            const isActive = isBuilding && feedItems.some(i => i.type === 'agent_start' && i.agent === agentId) && !isComplete;
            const colors = getColors(agentId);
            const agentInfo = feedItems.find(i => i.type === 'agent_start' && i.agent === agentId);

            return (
              <div key={agentId} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  isComplete ? colors.dot : isActive ? `${colors.dot} animate-pulse` : 'bg-gray-700'
                }`} />
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-xs">{agentInfo?.agentEmoji || ''}</span>
                  <span className={`text-xs truncate ${isComplete ? colors.text : isActive ? colors.text : 'text-gray-600'}`}>
                    {agentInfo?.agentName || agentId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {groups.map((group, gi) => {
          if (group.agent === '__complete__') {
            return (
              <WorkflowCompleteCard
                key={gi}
                item={group.items[0]}
              />
            );
          }

          const colors = getColors(group.agent);
          const textItems = group.items.filter(i => i.type === 'text');
          const fileItems = group.items.filter(i => i.type === 'file');
          const isComplete = group.items.some(i => i.type === 'phase_complete');

          // Merge all text content for this agent
          const mergedText = textItems.map(i => i.content || '').join('');
          const displayText = mergedText.replace(/<<<FILE:[\s\S]*?<<<END_FILE>>>/g, '').trim();

          return (
            <div key={gi} className={`rounded-2xl border ${colors.border} overflow-hidden animate-slide-up`}>
              {/* Agent header */}
              <div className={`px-5 py-3 flex items-center gap-3 ${colors.bg} border-b ${colors.border}`}>
                <div className="text-2xl">{group.agentEmoji}</div>
                <div className="flex-1">
                  <span className={`font-bold text-base ${colors.text}`}>{group.agentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <span className="text-green-400 text-sm">✅ 完成</span>
                  ) : isBuilding ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                      進行中
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Agent content */}
              <div className="bg-gray-900 p-5 space-y-4">
                {/* Narrative text */}
                {displayText && (
                  <div className="space-y-0.5">
                    {displayText.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-base font-bold mt-3 mb-1 text-white">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-sm font-semibold mt-2 mb-0.5 text-gray-200">{line.slice(4)}</h3>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <li key={i} className="ml-4 list-disc text-gray-400 text-sm">{line.slice(2)}</li>;
                      }
                      if (line.match(/^\d+\. /)) {
                        return <li key={i} className="ml-4 list-decimal text-gray-400 text-sm">{line.replace(/^\d+\. /, '')}</li>;
                      }
                      if (line === '') {
                        return <div key={i} className="h-1" />;
                      }
                      if (line.includes('`')) {
                        const parts = line.split('`');
                        return (
                          <p key={i} className="text-gray-400 text-sm leading-relaxed">
                            {parts.map((part, j) =>
                              j % 2 === 1
                                ? <code key={j} className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-xs font-mono">{part}</code>
                                : part
                            )}
                          </p>
                        );
                      }
                      return <p key={i} className="text-gray-400 text-sm leading-relaxed">{line}</p>;
                    })}
                  </div>
                )}

                {/* Loading indicator for active agent */}
                {!isComplete && isBuilding && gi === groups.length - 1 && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span className={`w-2 h-2 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <span className={`w-2 h-2 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-2 h-2 rounded-full ${colors.dot} animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                )}

                {/* Generated files */}
                {fileItems.length > 0 && (
                  <div>
                    <div className={`text-xs font-semibold ${colors.text} mb-2`}>
                      📁 生成的檔案 ({fileItems.length} 個)
                    </div>
                    <div className="space-y-1">
                      {fileItems.map((fileItem, fi) => (
                        <FileCard
                          key={fi}
                          filename={fileItem.filename || ''}
                          content={fileItem.fileContent || ''}
                          agentColor={group.agent}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state when building just started */}
        {isBuilding && feedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-bounce">🤖</div>
            <p className="text-gray-400">AI 開發團隊正在啟動...</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
