import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import {
  streamAgentResponse,
  parseFileBlocks,
  buildArchitectPrompt,
  buildBackendPrompt,
  buildFrontendPrompt,
  buildUIUXPrompt,
  AGENTS,
  WORKFLOW_ORDER,
} from '@/lib/agents';
import type { WorkflowRequest, WorkflowEvent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

function sendEvent(controller: ReadableStreamDefaultController, encoder: TextEncoder, event: WorkflowEvent) {
  const data = JSON.stringify(event);
  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkflowRequest = await request.json();
    const { prd, taskDescription } = body;

    if (!prd || prd.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'PRD 不能為空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.MINIMAX_API_KEY) {
      return new Response(
        JSON.stringify({ error: '未設定 MINIMAX_API_KEY 環境變數' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create output directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(process.cwd(), 'outputs', timestamp);
    fs.mkdirSync(outputDir, { recursive: true });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentOutputs: Record<string, string> = {};

          for (const agentId of WORKFLOW_ORDER) {
            const agent = AGENTS[agentId];

            // Emit agent_start event
            sendEvent(controller, encoder, {
              type: 'agent_start',
              agent: agentId,
              name: agent.name,
              emoji: agent.emoji,
            });

            // Build prompt based on agent
            let userPrompt: string;
            if (agentId === 'architect') {
              userPrompt = buildArchitectPrompt(prd, taskDescription);
            } else if (agentId === 'backend') {
              userPrompt = buildBackendPrompt(prd, agentOutputs['architect'] || '', taskDescription);
            } else if (agentId === 'frontend') {
              userPrompt = buildFrontendPrompt(
                prd,
                agentOutputs['architect'] || '',
                agentOutputs['backend'] || '',
                taskDescription
              );
            } else if (agentId === 'uiux') {
              userPrompt = buildUIUXPrompt(
                prd,
                agentOutputs['architect'] || '',
                agentOutputs['frontend'] || '',
                taskDescription
              );
            } else {
              userPrompt = `請根據以下PRD完成你的工作：\n\n${prd}`;
            }

            // Stream the agent's response
            let fullText = '';
            const generator = streamAgentResponse(agentId, userPrompt);

            for await (const chunk of generator) {
              fullText += chunk;
              sendEvent(controller, encoder, {
                type: 'text',
                agent: agentId,
                content: chunk,
              });
            }

            // Store full output for next agents
            agentOutputs[agentId] = fullText;

            // Parse and save files from agent output
            const files = parseFileBlocks(fullText);
            for (const file of files) {
              // Emit file event
              sendEvent(controller, encoder, {
                type: 'file',
                agent: agentId,
                filename: file.filename,
                content: file.content,
              });

              // Save file to outputs directory
              try {
                const filePath = path.join(outputDir, file.filename);
                const fileDir = path.dirname(filePath);
                fs.mkdirSync(fileDir, { recursive: true });
                fs.writeFileSync(filePath, file.content, 'utf-8');
              } catch (fileError) {
                console.error(`Failed to save file ${file.filename}:`, fileError);
              }
            }

            // Also save the full agent narrative
            try {
              const narrativePath = path.join(outputDir, `${agentId}-output.md`);
              fs.writeFileSync(narrativePath, fullText, 'utf-8');
            } catch (saveError) {
              console.error(`Failed to save agent narrative for ${agentId}:`, saveError);
            }

            // Emit phase_complete
            sendEvent(controller, encoder, {
              type: 'phase_complete',
              agent: agentId,
            });
          }

          // Workflow complete
          sendEvent(controller, encoder, {
            type: 'workflow_complete',
            outputDir: outputDir,
          });

          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : '工作流程執行失敗';
          sendEvent(controller, encoder, {
            type: 'error',
            message,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '請求處理失敗';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
