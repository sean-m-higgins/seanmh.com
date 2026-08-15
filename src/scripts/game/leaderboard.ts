import { getInitials, setInitials } from "./storage";

export interface LeaderboardEntry { i: string; s: number }
export interface RunSummary { dur: number; counters: number; maxChain: number; hits: number }

const TIMEOUT_MS = 4000;

async function api(init?: RequestInit): Promise<{ top: LeaderboardEntry[]; rank?: number | null } | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch("/api/score/boxing", { ...init, signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json() as { top?: unknown; rank?: number | null };
    if (!Array.isArray(data.top)) return null;
    return { top: data.top as LeaderboardEntry[], rank: data.rank ?? null };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function render(list: HTMLElement, top: LeaderboardEntry[], highlightRank: number | null): void {
  list.textContent = "";
  top.forEach((entry, index) => {
    const row = document.createElement("li");
    row.className = "flex items-baseline justify-between gap-4 px-2 py-0.5" + (highlightRank === index + 1 ? " bg-accent/25 text-[#ffd166]" : "");
    const left = document.createElement("span");
    left.className = "whitespace-pre";
    left.textContent = `${String(index + 1).padStart(2, " ")}  ${entry.i.padEnd(3, " ")}`;
    const right = document.createElement("span");
    right.className = "tabular-nums";
    right.textContent = entry.s.toLocaleString("en-US");
    row.append(left, right);
    list.appendChild(row);
  });
}

export async function showLeaderboard(score: number, run: RunSummary): Promise<void> {
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
  const response = await api();
  if (!response) return;
  render(list, response.top, null);
  panel.classList.remove("hidden");

  const makesCut = response.top.length < 10 || score > (response.top.at(-1)?.s ?? 0);
  if (!makesCut || score < 1 || run.counters < 1 || run.dur < 5) return;
  input.value = getInitials();
  form.classList.remove("hidden");
  form.classList.add("flex");

  let submitted = false;
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (submitted) return;
    const initials = input.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,3}$/.test(initials)) { input.focus(); return; }
    submitted = true;
    setInitials(initials);
    const result = await api({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initials, score, run }),
    });
    form.classList.add("hidden");
    form.classList.remove("flex");
    status.classList.remove("hidden");
    if (result?.rank) {
      render(list, result.top, result.rank);
      status.textContent = `you are #${result.rank} · hold your ground`;
    } else if (result) {
      render(list, result.top, null);
      status.textContent = "just missed the card · answer the bell again";
    } else {
      submitted = false;
      form.classList.remove("hidden");
      form.classList.add("flex");
      status.textContent = "the judges are offline · try again";
    }
  };
}
