// Global top-10 client for /api/score (served by the router Worker on
// seanmh.com, backed by Cloudflare KV). Everything degrades silently: if the
// endpoint is missing (local dev, pages.dev direct) the panel simply never
// appears.

import { formatScore } from "./scoring";
import { getInitials, setInitials } from "./storage";

export interface LbEntry {
  i: string;
  s: number;
}

interface RunStats {
  dur: number;
  landings: number;
}

const TIMEOUT_MS = 4000;

async function api(init?: RequestInit): Promise<{ top: LbEntry[]; rank?: number | null } | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch("/api/score", { ...init, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { top?: unknown; rank?: number | null };
    if (!Array.isArray(data.top)) return null;
    return { top: data.top as LbEntry[], rank: data.rank ?? null };
  } catch {
    return null;
  }
}

function render(list: HTMLElement, top: LbEntry[], highlightRank: number | null): void {
  list.textContent = "";
  top.forEach((e, idx) => {
    const row = document.createElement("li");
    row.className =
      "flex items-baseline justify-between gap-4 rounded px-2 py-0.5" +
      (highlightRank === idx + 1 ? " bg-accent/15 text-accent-light" : "");
    const left = document.createElement("span");
    left.textContent = `${String(idx + 1).padStart(2, " ")}  ${e.i.padEnd(3, " ")}`;
    left.className = "whitespace-pre";
    const right = document.createElement("span");
    right.textContent = formatScore(e.s);
    right.className = "tabular-nums";
    row.append(left, right);
    list.appendChild(row);
  });
}

/** Called on game over. Shows the board, and the claim form if the score makes the cut. */
export async function showLeaderboardPanel(score: number, run: RunStats): Promise<void> {
  const panel = document.getElementById("over-lb");
  const list = document.getElementById("lb-list");
  const form = document.getElementById("lb-form") as HTMLFormElement | null;
  const input = document.getElementById("lb-initials") as HTMLInputElement | null;
  const status = document.getElementById("lb-status");
  if (!panel || !list || !form || !input || !status) return;

  panel.classList.add("hidden");
  form.classList.add("hidden");
  form.classList.remove("flex");
  status.classList.add("hidden");

  const fetched = await api();
  if (!fetched) return; // no endpoint — stay invisible

  render(list, fetched.top, null);
  panel.classList.remove("hidden");

  const cut = fetched.top.length < 10 || score > (fetched.top[fetched.top.length - 1]?.s ?? 0);
  if (score < 1 || run.landings < 1 || !cut) return;

  input.value = getInitials();
  form.classList.remove("hidden");
  form.classList.add("flex");

  let submitted = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;
    const initials = input.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,3}$/.test(initials)) {
      input.focus();
      return;
    }
    submitted = true;
    setInitials(initials);
    const res = await api({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initials, score, run }),
    });
    form.classList.add("hidden");
    form.classList.remove("flex");
    status.classList.remove("hidden");
    if (res && res.rank) {
      render(list, res.top, res.rank);
      status.textContent = `you're #${res.rank} — hold the line`;
    } else if (res) {
      render(list, res.top, null);
      status.textContent = "just missed the board — go again";
    } else {
      submitted = false;
      form.classList.remove("hidden");
      form.classList.add("flex");
      status.textContent = "couldn't reach the board — try again";
    }
  };
}
