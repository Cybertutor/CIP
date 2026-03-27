import { NextRequest } from 'next/server';
import { streamPMConversation } from '@/lib/agents';
import type { PMRequest } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body: PMRequest = await request.json();
    const { messages, taskDescription } = body;

    if (!taskDescription || taskDescription.trim() === '') {
      return new Response(
        JSON.stringify({ error: '任務描述不能為空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.MINIMAX_API_KEY) {
      return new Response(
        JSON.stringify({ error: '未設定 MINIMAX_API_KEY 環境變數' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamPMConversation(messages, taskDescription);

          for await (const chunk of generator) {
            const data = JSON.stringify({ type: 'text', content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '未知錯誤';
          const data = JSON.stringify({ type: 'error', message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
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
