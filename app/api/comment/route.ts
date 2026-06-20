import { NextResponse } from "next/server";
import { getRank } from "@/lib/rank/get-rank";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

type CommentRequest = {
  score?: unknown;
  rank?: unknown;
};

function fallbackComment(score: number): string {
  if (score >= 30) return "もはや手刀ではなく、素材のほうから道を譲っています。";
  if (score >= 20) return "切り株があなたを常連として覚えはじめました。";
  if (score >= 10) return "いい太刀筋です。豆腐だけは少し身構えていました。";
  if (score >= 4) return "伸びしろが大きい。つまり次回がいちばんおいしい段位です。";
  return "刃は心にあり。今日は素材との顔合わせということで。";
}

function readOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  let body: CommentRequest;
  try {
    body = (await request.json()) as CommentRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const score = body.score;
  const rank = body.rank;
  if (
    !Number.isInteger(score) ||
    typeof score !== "number" ||
    score < 0 ||
    score > 200 ||
    typeof rank !== "string" ||
    rank.length < 1 ||
    rank.length > 32 ||
    rank !== getRank(score)
  ) {
    return NextResponse.json({ error: "invalid_result" }, { status: 400 });
  }

  const fallback = fallbackComment(score);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ comment: fallback, source: "fallback" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions:
          "あなたは和風の手刀ゲーム『柔断』の愉快な師範です。結果を褒めつつ軽く笑える、親しみやすい日本語の一言だけを返してください。人を傷つける表現、絵文字、引用符、改行は使わず、60文字以内にしてください。",
        input: `スコアは${score}断、認定段位は柔断 ${rank}です。`,
        max_output_tokens: 80,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);

    const text = readOutputText(await response.json())
      ?.replace(/[\r\n]+/g, " ")
      .trim()
      .slice(0, 60);
    return NextResponse.json({
      comment: text || fallback,
      source: text ? "openai" : "fallback",
    });
  } catch {
    return NextResponse.json({ comment: fallback, source: "fallback" });
  } finally {
    clearTimeout(timeout);
  }
}
