import "server-only";

import type { LeaderboardEntry } from "@/lib/leaderboard/types";

type SupabaseConfig = {
  url: string;
  secretKey: string;
};

type LeaderboardRow = {
  id: unknown;
  display_name: unknown;
  score: unknown;
  rank: unknown;
  created_at: unknown;
};

function getConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}

function headers(config: SupabaseConfig): HeadersInit {
  const result: Record<string, string> = {
    apikey: config.secretKey,
    "Content-Type": "application/json",
  };
  // 従来のservice_role JWTだけがAuthorization Bearerを必要とする。
  // 新しいsb_secret_キーはJWTではないため、apikeyヘッダーのみで送る。
  if (!config.secretKey.startsWith("sb_secret_")) {
    result.Authorization = `Bearer ${config.secretKey}`;
  }
  return result;
}

function toEntry(row: LeaderboardRow): LeaderboardEntry {
  if (
    typeof row.id !== "string" ||
    typeof row.display_name !== "string" ||
    typeof row.score !== "number" ||
    typeof row.rank !== "string" ||
    typeof row.created_at !== "string"
  ) {
    throw new Error("Invalid leaderboard row");
  }
  return {
    id: row.id,
    displayName: row.display_name,
    score: row.score,
    rank: row.rank,
    createdAt: row.created_at,
  };
}

export function isLeaderboardConfigured(): boolean {
  return getConfig() !== null;
}

export async function readLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const config = getConfig();
  if (!config) return [];

  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const query =
    "select=id,display_name,score,rank,created_at" +
    "&order=score.desc,created_at.asc" +
    `&limit=${safeLimit}`;
  const response = await fetch(
    `${config.url}/rest/v1/judan_leaderboard?${query}`,
    {
      headers: headers(config),
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);

  const rows = (await response.json()) as LeaderboardRow[];
  if (!Array.isArray(rows)) throw new Error("Invalid leaderboard response");
  return rows.map(toEntry);
}

export async function insertLeaderboardEntry(input: {
  displayName: string;
  score: number;
  rank: string;
}): Promise<LeaderboardEntry> {
  const config = getConfig();
  if (!config) throw new Error("Supabase is not configured");

  const response = await fetch(`${config.url}/rest/v1/judan_leaderboard`, {
    method: "POST",
    headers: {
      ...headers(config),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      display_name: input.displayName,
      score: input.score,
      rank: input.rank,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase insert failed: ${response.status}`);

  const rows = (await response.json()) as LeaderboardRow[];
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Invalid leaderboard insert response");
  }
  return toEntry(rows[0]);
}
