import { NextResponse } from "next/server";
import { getRank } from "@/lib/rank/get-rank";
import {
  insertLeaderboardEntry,
  isLeaderboardConfigured,
  readLeaderboard,
} from "@/lib/supabase/leaderboard";

const ALLOWED_FIELDS = new Set(["displayName", "score", "rank"]);

function cleanDisplayName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  if (!isLeaderboardConfigured()) {
    return NextResponse.json({ available: false, entries: [] });
  }
  try {
    const entries = await readLeaderboard(10);
    return NextResponse.json({ available: true, entries });
  } catch {
    return NextResponse.json(
      { available: true, entries: [], error: "leaderboard_read_failed" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_entry" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => !ALLOWED_FIELDS.has(key))) {
    return NextResponse.json({ error: "unexpected_field" }, { status: 400 });
  }

  const rawName = record.displayName;
  const score = record.score;
  const rank = record.rank;
  if (
    typeof rawName !== "string" ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 200 ||
    typeof rank !== "string" ||
    rank !== getRank(score)
  ) {
    return NextResponse.json({ error: "invalid_entry" }, { status: 400 });
  }

  const displayName = cleanDisplayName(rawName);
  if (Array.from(displayName).length < 1 || Array.from(displayName).length > 16) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 });
  }

  if (!isLeaderboardConfigured()) {
    return NextResponse.json(
      { error: "leaderboard_unavailable" },
      { status: 503 }
    );
  }

  try {
    const entry = await insertLeaderboardEntry({ displayName, score, rank });
    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "leaderboard_write_failed" },
      { status: 502 }
    );
  }
}
