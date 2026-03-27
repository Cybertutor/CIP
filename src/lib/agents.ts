import OpenAI from 'openai';
import type { Agent, Message } from './types';

// Initialize MiniMax client (OpenAI-compatible API)
export const openai = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimax.chat/v1',
});

export const MODEL = 'MiniMax-Text-01';

// Agent configurations
export const AGENTS: Record<string, Agent> = {
  pm: {
    id: 'pm',
    name: '產品經理',
    nameEn: 'Product Manager',
    emoji: '👩‍💼',
    color: 'pm',
    systemPrompt: `你是一位資深產品經理。用戶會給你一個任務，你的工作是透過提問來釐清需求。每次提問不超過3個問題。當你認為需求已經足夠清晰時，在你的回覆最後加上標記 \`[PRD_READY]\` 並附上完整的產品需求文件(PRD)，格式如下：

## 產品需求文件(PRD)
### 1. 專案概述
### 2. 功能需求
### 3. 技術需求
### 4. 非功能性需求
### 5. 驗收標準`,
  },
  architect: {
    id: 'architect',
    name: '資深架構師',
    nameEn: 'Senior Architect',
    emoji: '🏗️',
    color: 'architect',
    systemPrompt: `你是一位資深軟體架構師。根據PRD設計完整的系統架構。輸出格式：

## 系統架構設計
### 1. 技術選型
### 2. 系統架構圖(文字描述)
### 3. 資料庫設計
### 4. API設計
### 5. 前端架構
### 6. 部署架構`,
  },
  backend: {
    id: 'backend',
    name: '資深後端工程師',
    nameEn: 'Senior Backend Engineer',
    emoji: '⚙️',
    color: 'backend',
    systemPrompt: `你是一位資深後端工程師。根據PRD和架構設計，實作後端程式碼。對於每個檔案使用以下格式：

<<<FILE: src/path/to/file.ts>>>
// 程式碼內容
<<<END_FILE>>>

用繁體中文解釋你的實作決策。`,
  },
  frontend: {
    id: 'frontend',
    name: '資深前端工程師',
    nameEn: 'Senior Frontend Engineer',
    emoji: '🖥️',
    color: 'frontend',
    systemPrompt: `你是一位資深前端工程師。根據PRD和架構設計，實作前端程式碼。對於每個檔案使用以下格式：

<<<FILE: src/path/to/file.tsx>>>
// 程式碼內容
<<<END_FILE>>>

用繁體中文解釋你的實作決策。`,
  },
  uiux: {
    id: 'uiux',
    name: 'UI/UX工程師',
    nameEn: 'UI/UX Engineer',
    emoji: '🎨',
    color: 'uiux',
    systemPrompt: `你是一位UI/UX工程師。根據PRD和架構設計，設計並實作UI元件和樣式。使用Tailwind CSS。對於每個檔案使用以下格式：

<<<FILE: src/path/to/file.tsx>>>
// 程式碼內容
<<<END_FILE>>>

用繁體中文解釋你的設計決策。`,
  },
};

// Ordered workflow sequence
export const WORKFLOW_ORDER = ['architect', 'backend', 'frontend', 'uiux'];

/**
 * Stream PM conversation - handles multi-turn conversation
 */
export async function* streamPMConversation(
  messages: Message[],
  taskDescription: string
): AsyncGenerator<string> {
  const agent = AGENTS.pm;

  const formattedMessages: OpenAI.ChatCompletionMessageParam[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // If this is the first message, add the task description context
  if (formattedMessages.length === 0 || formattedMessages[0].role !== 'user') {
    formattedMessages.unshift({
      role: 'user',
      content: `任務描述：${taskDescription}`,
    });
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    stream: true,
    messages: [
      { role: 'system', content: agent.systemPrompt },
      ...formattedMessages,
    ],
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

/**
 * Stream a single agent response for the workflow
 */
export async function* streamAgentResponse(
  agentId: string,
  userPrompt: string
): AsyncGenerator<string> {
  const agent = AGENTS[agentId];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  const stream = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    stream: true,
    messages: [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

/**
 * Parse file blocks from agent output text
 * Format: <<<FILE: path>>>...<<<END_FILE>>>
 */
export function parseFileBlocks(
  text: string
): Array<{ filename: string; content: string }> {
  const files: Array<{ filename: string; content: string }> = [];
  const fileRegex = /<<<FILE:\s*([^>]+)>>>([\s\S]*?)<<<END_FILE>>>/g;

  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();
    files.push({ filename, content });
  }

  return files;
}

/**
 * Build the prompt for architect agent
 */
export function buildArchitectPrompt(
  prd: string,
  taskDescription: string
): string {
  return `請根據以下產品需求文件設計系統架構：

**任務描述：** ${taskDescription}

**產品需求文件(PRD)：**
${prd}

請提供完整的系統架構設計，包括技術選型、架構圖、資料庫設計、API設計、前端架構和部署架構。`;
}

/**
 * Build the prompt for backend agent
 */
export function buildBackendPrompt(
  prd: string,
  architectureDesign: string,
  taskDescription: string
): string {
  return `請根據以下PRD和架構設計實作後端程式碼：

**任務描述：** ${taskDescription}

**產品需求文件(PRD)：**
${prd}

**架構設計：**
${architectureDesign}

請實作所有必要的後端程式碼，包括API端點、資料模型、業務邏輯等。使用 <<<FILE: path>>> ... <<<END_FILE>>> 格式輸出每個檔案。`;
}

/**
 * Build the prompt for frontend agent
 */
export function buildFrontendPrompt(
  prd: string,
  architectureDesign: string,
  backendCode: string,
  taskDescription: string
): string {
  return `請根據以下PRD、架構設計和後端程式碼實作前端程式碼：

**任務描述：** ${taskDescription}

**產品需求文件(PRD)：**
${prd}

**架構設計：**
${architectureDesign}

**後端程式碼概覽：**
${backendCode.substring(0, 3000)}...

請實作所有必要的前端程式碼，包括頁面組件、狀態管理、API呼叫等。使用 <<<FILE: path>>> ... <<<END_FILE>>> 格式輸出每個檔案。`;
}

/**
 * Build the prompt for UI/UX agent
 */
export function buildUIUXPrompt(
  prd: string,
  architectureDesign: string,
  frontendCode: string,
  taskDescription: string
): string {
  return `請根據以下PRD、架構設計和前端程式碼設計UI/UX：

**任務描述：** ${taskDescription}

**產品需求文件(PRD)：**
${prd}

**架構設計概覽：**
${architectureDesign.substring(0, 2000)}...

**前端程式碼概覽：**
${frontendCode.substring(0, 2000)}...

請設計並實作UI元件和樣式，使用Tailwind CSS。包括顏色配置、元件庫、響應式設計等。使用 <<<FILE: path>>> ... <<<END_FILE>>> 格式輸出每個檔案。`;
}
