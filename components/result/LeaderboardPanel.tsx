"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";

type Props = {
  score: number;
  rank: string;
};

type RegistrationState = "asking" | "saving" | "saved" | "skipped";

export default function LeaderboardPanel({ score, rank }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [registration, setRegistration] =
    useState<RegistrationState>("asking");
  const [message, setMessage] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/leaderboard", {
      method: "GET",
      cache: "no-store",
      signal,
    });
    const data = (await response.json()) as {
      available?: unknown;
      entries?: unknown;
    };
    if (!response.ok) throw new Error("leaderboard read failed");
    setAvailable(data.available === true);
    setEntries(Array.isArray(data.entries) ? data.entries : []);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLeaderboard(controller.signal).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setAvailable(false);
      }
    });
    return () => controller.abort();
  }, [loadLeaderboard]);

  const register = async () => {
    const name = displayName.trim();
    if (Array.from(name).length < 1 || Array.from(name).length > 16) {
      setMessage("表示名は1〜16文字で入力してください。");
      return;
    }

    setRegistration("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 写真や認定証データはこの送信オブジェクトに含めない。
        body: JSON.stringify({ displayName: name, score, rank }),
      });
      if (!response.ok) throw new Error("leaderboard write failed");
      setRegistration("saved");
      setMessage("ランキングに記録しました。");
      await loadLeaderboard();
    } catch {
      setRegistration("asking");
      setMessage("記録できませんでした。時間をおいてもう一度お試しください。");
    }
  };

  return (
    <section className="ink-panel w-full max-w-3xl rounded-lg p-5 sm:p-6">
      <div className="text-center">
        <p className="font-brush text-2xl text-kin">段位ランキング</p>
        <p className="mt-1 font-mincho text-xs text-washi/65">
          ランキングに記録しますか？ 写真・映像・認定証は送信されません。
        </p>
      </div>

      {registration === "asking" || registration === "saving" ? (
        <div className="mx-auto mt-4 flex max-w-md flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="leaderboard-name">
            ランキング表示名
          </label>
          <input
            id="leaderboard-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={16}
            autoComplete="nickname"
            placeholder="表示名（16文字まで）"
            disabled={registration === "saving" || available !== true}
            className="min-w-0 flex-1 rounded border border-kin/45 bg-sumi/70 px-3 py-2 font-mincho text-sm text-washi outline-none placeholder:text-washi/35 focus:border-kin disabled:opacity-45"
          />
          <button
            type="button"
            onClick={register}
            disabled={registration === "saving" || available !== true}
            className="rounded border border-kin/70 bg-kin/10 px-4 py-2 font-mincho text-sm text-washi transition hover:bg-kin/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {registration === "saving" ? "記録中…" : "記録する"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRegistration("skipped");
              setMessage(null);
            }}
            disabled={registration === "saving"}
            className="rounded border border-washi/25 px-4 py-2 font-mincho text-sm text-washi/75 hover:border-washi/45 disabled:opacity-45"
          >
            今回は記録しない
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center font-mincho text-sm text-washi/80">
          {registration === "saved"
            ? "あなたの記録をランキングに追加しました。"
            : "今回はランキングに記録しません。"}
        </p>
      )}

      {available === null && (
        <p className="mt-3 text-center font-mincho text-xs text-washi/55">
          ランキングを読み込んでいます…
        </p>
      )}
      {available === false && (
        <p className="mt-3 text-center font-mincho text-xs text-washi/55">
          ランキングは現在準備中です。Supabase設定後に記録できます。
        </p>
      )}
      {message && registration !== "skipped" && (
        <p className="mt-3 text-center font-mincho text-xs text-kin" aria-live="polite">
          {message}
        </p>
      )}

      {entries.length > 0 && (
        <div className="mt-5 overflow-hidden rounded border border-kin/25">
          <div className="grid grid-cols-[3rem_1fr_4rem_6rem] bg-kin/10 px-3 py-2 font-mincho text-xs text-washi/60">
            <span>順位</span>
            <span>名前</span>
            <span className="text-right">スコア</span>
            <span className="text-right">段位</span>
          </div>
          <ol>
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className="grid grid-cols-[3rem_1fr_4rem_6rem] border-t border-washi/10 px-3 py-2 font-mincho text-sm text-washi/85"
              >
                <span className={index < 3 ? "text-kin" : ""}>{index + 1}</span>
                <span className="truncate">{entry.displayName}</span>
                <span className="text-right">{entry.score}</span>
                <span className="text-right">{entry.rank}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
