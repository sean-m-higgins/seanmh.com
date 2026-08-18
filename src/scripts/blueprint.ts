interface TourStop {
  node: string;
  eyebrow: string;
  title: string;
  copy: string;
  flow: string;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dialog = document.querySelector<HTMLDialogElement>("#system-dialog");
const dialogContent = document.querySelector<HTMLElement>("#dialog-content");
const tourPanel = document.querySelector<HTMLElement>("#tour-panel");
const tourDataElement = document.querySelector<HTMLScriptElement>("#tour-data");
const tour = tourDataElement ? (JSON.parse(tourDataElement.textContent || "[]") as TourStop[]) : [];

let activeNode = "";
let lastTrigger: HTMLElement | null = null;
let tourIndex = -1;

function nodeElements(id: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-node="${CSS.escape(id)}"]`));
}

function clearNodeState(className: string) {
  document.querySelectorAll(`.${className}`).forEach((element) => element.classList.remove(className));
}

function setActiveNode(id: string) {
  clearNodeState("node-active");
  activeNode = id;
  nodeElements(id).forEach((element) => element.classList.add("node-active"));
}

function openNode(id: string, trigger?: HTMLElement) {
  const source = document.querySelector<HTMLElement>(`#detail-${CSS.escape(id)}`);
  if (!source || !dialog || !dialogContent || typeof dialog.showModal !== "function") return false;

  lastTrigger = trigger || null;
  setActiveNode(id);
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  const title = clone.querySelector("h4");
  if (title) title.id = "dialog-title";
  dialogContent.replaceChildren(clone);

  if (!dialog.open) dialog.showModal();
  history.replaceState(null, "", `#detail-${id}`);
  return true;
}

document.querySelectorAll<HTMLElement>("[data-node]").forEach((element) => {
  element.addEventListener("click", (event) => {
    const id = element.dataset.node;
    if (!id || tourIndex >= 0) return;
    if (openNode(id, element)) event.preventDefault();
  });

  element.addEventListener("pointerenter", () => {
    if (tourIndex < 0 && element.dataset.node) setActiveNode(element.dataset.node);
  });
});

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

dialog?.addEventListener("close", () => {
  lastTrigger?.focus();
  lastTrigger = null;
});

function scrollToMap() {
  document.querySelector("#system-map")?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function renderTourStep() {
  const stop = tour[tourIndex];
  if (!stop || !tourPanel) return;

  clearNodeState("node-tour-active");
  clearNodeState("node-active");
  document.querySelectorAll(".connection-map .flow-active").forEach((path) => path.classList.remove("flow-active"));

  nodeElements(stop.node).forEach((element) => {
    element.classList.add("node-active", "node-tour-active");
  });
  document.querySelectorAll(`[data-flow="${CSS.escape(stop.flow)}"]`).forEach((path) => path.classList.add("flow-active"));
  activeNode = stop.node;

  const eyebrow = document.querySelector<HTMLElement>("#tour-eyebrow");
  const title = document.querySelector<HTMLElement>("#tour-title");
  const description = document.querySelector<HTMLElement>("#tour-description");
  if (eyebrow) eyebrow.textContent = stop.eyebrow;
  if (title) title.textContent = stop.title;
  if (description) description.textContent = stop.copy;

  tourPanel.querySelectorAll<HTMLElement>(".tour-progress span").forEach((bar, index) => {
    bar.classList.toggle("complete", index < tourIndex);
    bar.classList.toggle("current", index === tourIndex);
  });

  const back = tourPanel.querySelector<HTMLButtonElement>("[data-tour-back]");
  const next = tourPanel.querySelector<HTMLButtonElement>("[data-tour-next]");
  if (back) back.disabled = tourIndex === 0;
  if (next) next.innerHTML = tourIndex === tour.length - 1
    ? 'Explore details <span aria-hidden="true">↓</span>'
    : 'Next <span aria-hidden="true">→</span>';
}

function startTour() {
  if (!tourPanel || tour.length === 0) return;
  dialog?.close();
  tourIndex = 0;
  tourPanel.hidden = false;
  document.body.dataset.touring = "true";
  scrollToMap();
  renderTourStep();
  window.setTimeout(() => tourPanel.querySelector<HTMLButtonElement>("[data-tour-next]")?.focus(), reducedMotion ? 0 : 450);
}

function endTour(showDetails = false) {
  if (!tourPanel) return;
  const finalNode = activeNode;
  tourIndex = -1;
  tourPanel.hidden = true;
  delete document.body.dataset.touring;
  clearNodeState("node-tour-active");
  document.querySelectorAll(".connection-map .flow-active").forEach((path) => path.classList.remove("flow-active"));

  if (showDetails && finalNode) {
    const detail = document.querySelector(`#detail-${CSS.escape(finalNode)}`);
    detail?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    history.replaceState(null, "", `#detail-${finalNode}`);
  }
}

document.querySelectorAll<HTMLButtonElement>("[data-start-tour]").forEach((button) => {
  button.addEventListener("click", startTour);
});

tourPanel?.querySelector<HTMLButtonElement>("[data-tour-back]")?.addEventListener("click", () => {
  if (tourIndex > 0) {
    tourIndex -= 1;
    renderTourStep();
  }
});

tourPanel?.querySelector<HTMLButtonElement>("[data-tour-next]")?.addEventListener("click", () => {
  if (tourIndex < tour.length - 1) {
    tourIndex += 1;
    renderTourStep();
  } else {
    endTour(true);
  }
});

tourPanel?.querySelector<HTMLButtonElement>("[data-tour-exit]")?.addEventListener("click", () => endTour());

window.addEventListener("keydown", (event) => {
  if (tourIndex < 0) return;
  if (event.key === "Escape") endTour();
  if (event.key === "ArrowRight" && tourIndex < tour.length - 1) {
    tourIndex += 1;
    renderTourStep();
  }
  if (event.key === "ArrowLeft" && tourIndex > 0) {
    tourIndex -= 1;
    renderTourStep();
  }
});

function syncHash() {
  const match = window.location.hash.match(/^#detail-(.+)$/);
  if (match) setActiveNode(decodeURIComponent(match[1]));
}

syncHash();
window.addEventListener("hashchange", syncHash);
