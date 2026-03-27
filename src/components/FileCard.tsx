'use client';

import { useState } from 'react';

interface FileCardProps {
  filename: string;
  content: string;
  agentColor?: string;
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return '📘';
    case 'js':
    case 'jsx':
      return '📙';
    case 'css':
    case 'scss':
      return '🎨';
    case 'html':
      return '🌐';
    case 'json':
      return '📋';
    case 'md':
      return '📝';
    case 'sql':
      return '🗃️';
    case 'env':
      return '🔑';
    case 'yaml':
    case 'yml':
      return '⚙️';
    default:
      return '📄';
  }
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'text';
  }
}

export default function FileCard({ filename, content, agentColor = 'gray' }: FileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lineCount = content.split('\n').length;
  const icon = getFileIcon(filename);
  const language = getLanguage(filename);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortPath = filename.split('/').slice(-2).join('/');
  const dirPath = filename.split('/').slice(0, -1).join('/');

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900 my-2 animate-fade-in">
      {/* File header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium text-gray-200 truncate">
              {shortPath}
            </span>
            {dirPath && (
              <span className="text-xs text-gray-500 truncate hidden sm:block">
                ({dirPath})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{language}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-500">{lineCount} 行</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {copied ? '✅ 已複製' : '📋 複製'}
          </button>
          <span className="text-gray-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* File content */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          <pre className="p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed max-h-[500px] overflow-y-auto bg-gray-950">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
