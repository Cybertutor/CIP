// TypeScript types for the CIP AI Agent Team system

export type AppState = 'idle' | 'pm_conversation' | 'building' | 'complete';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Agent {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  color: AgentColor;
  systemPrompt: string;
}

export type AgentColor = 'pm' | 'architect' | 'backend' | 'frontend' | 'uiux';

export type WorkflowEvent =
  | { type: 'agent_start'; agent: string; name: string; emoji: string }
  | { type: 'text'; agent: string; content: string }
  | { type: 'file'; agent: string; filename: string; content: string }
  | { type: 'phase_complete'; agent: string }
  | { type: 'workflow_complete'; outputDir: string }
  | { type: 'error'; message: string };

export interface PMRequest {
  messages: Message[];
  taskDescription: string;
}

export interface WorkflowRequest {
  prd: string;
  taskDescription: string;
}

export interface GeneratedFile {
  filename: string;
  content: string;
  agent: string;
}

export interface AgentOutput {
  agentId: string;
  text: string;
  files: GeneratedFile[];
}

export interface WorkflowFeedItem {
  id: string;
  type: 'agent_start' | 'text' | 'file' | 'phase_complete' | 'workflow_complete' | 'error';
  agent?: string;
  agentName?: string;
  agentEmoji?: string;
  content?: string;
  filename?: string;
  fileContent?: string;
  outputDir?: string;
  errorMessage?: string;
  timestamp: number;
}
