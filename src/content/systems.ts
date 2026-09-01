export type SystemRegionId =
  | "experience"
  | "edge"
  | "content"
  | "service"
  | "delivery";

export interface SystemRegion {
  id: SystemRegionId;
  number: string;
  title: string;
  summary: string;
}

export interface SystemEvidence {
  label: string;
  href?: string;
}

export interface SystemNode {
  id: string;
  region: SystemRegionId;
  code: string;
  title: string;
  label: string;
  summary: string;
  detail: string;
  decisions: string[];
  evidence: SystemEvidence[];
  href?: string;
  position: { x: number; y: number };
}

export interface TourStop {
  node: string;
  eyebrow: string;
  title: string;
  copy: string;
  flow: string;
}

export const establishedDate = "February 26, 2026";

export const regions: readonly SystemRegion[] = [
  {
    id: "experience",
    number: "01",
    title: "Experience layer",
    summary:
      "Eight expressions of one portfolio, each with a deliberate audience, interaction model, and fallback posture.",
  },
  {
    id: "edge",
    number: "02",
    title: "Edge layer",
    summary:
      "One public domain resolves stable paths, explicit version choices, session preferences, and API requests.",
  },
  {
    id: "content",
    number: "03",
    title: "Content layer",
    summary:
      "Canonical identity and career facts move across divergent presentations through a checked content contract.",
  },
  {
    id: "service",
    number: "04",
    title: "Service layer",
    summary:
      "Optional intelligence and scoreboards enhance the site without becoming dependencies for the core portfolio.",
  },
  {
    id: "delivery",
    number: "05",
    title: "Delivery layer",
    summary:
      "Independent branches and deployments are supported by repository checks, progressive enhancement, and documented fallbacks.",
  },
] as const;

export const nodes: readonly SystemNode[] = [
  {
    id: "request",
    region: "edge",
    code: "EDGE.01",
    title: "Public request",
    label: "seanmh.com",
    summary: "Every journey begins on one stable public origin.",
    detail:
      "The public URL remains consistent even though the experience behind it may come from a different independently deployed branch. Same-origin navigation also makes cross-document transitions possible.",
    decisions: [
      "Keep the apex domain authoritative.",
      "Never choose content by crawler or user-agent.",
    ],
    evidence: [
      { label: "Public HTTPS apex", href: "https://seanmh.com/" },
      { label: "Router configuration", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
      { label: "Routing tests", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
    ],
    href: "https://seanmh.com/",
    position: { x: 7, y: 44 },
  },
  {
    id: "router",
    region: "edge",
    code: "EDGE.02",
    title: "Front router",
    label: "Cloudflare Worker",
    summary: "The edge owns routing, preferences, and API boundaries.",
    detail:
      "A small Worker resolves path-owned content first, then explicit version choices, then a validated session preference, and finally the canonical Scroll experience. It also owns the site APIs so they behave consistently across every visual version.",
    decisions: [
      "Serve Scroll as the deterministic default.",
      "Keep games and Nexus opt-in.",
      "Route stable content paths before version cookies.",
    ],
    evidence: [
      { label: "worker.js", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
      { label: "X-Portfolio-Version tests", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
      { label: "Worker configuration", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/wrangler.jsonc" },
    ],
    position: { x: 24, y: 44 },
  },
  {
    id: "resolver",
    region: "edge",
    code: "EDGE.03",
    title: "Version resolver",
    label: "path → choice → cookie → default",
    summary: "A clear precedence rule prevents accidental experience drift.",
    detail:
      "Blueprint and G Travel use invariant path namespaces. For the portfolio root, an explicit visitor choice wins over a valid session preference; without either, Scroll is always served.",
    decisions: [
      "Do not place path-owned apps in the preference cookie.",
      "Keep invalid controls away from upstream origins.",
    ],
    evidence: [
      { label: "Resolver implementation", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
      { label: "Precedence regression tests", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
      { label: "Routing documentation", href: "https://github.com/sean-m-higgins/seanmh.com#router-worker" },
    ],
    position: { x: 41, y: 44 },
  },
  {
    id: "experiences",
    region: "experience",
    code: "EXP.01",
    title: "Portfolio universes",
    label: "Scroll · Card · Terminal",
    summary: "Three presentations share one professional identity.",
    detail:
      "Scroll is the canonical long-form portfolio. Card compresses the same identity into a tactile single-view artifact. Terminal turns it into an operable command surface. Each presentation stays useful without its enhanced motion or graphics.",
    decisions: [
      "Let presentation diverge while facts stay aligned.",
      "Keep the canonical default readable and recruiter-safe.",
    ],
    evidence: [
      { label: "Scroll source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/a-scroll" },
      { label: "Card source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/b-card" },
      { label: "Terminal source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/c-terminal" },
    ],
    href: "/?v=a-scroll",
    position: { x: 61, y: 20 },
  },
  {
    id: "experiments",
    region: "experience",
    code: "EXP.02",
    title: "Opt-in destinations",
    label: "Nexus · Games · Blueprint · Travel",
    summary: "Discovery, play, systems, and travel demonstrate range without hijacking the landing page.",
    detail:
      "Nexus maps the portfolio as miniature worlds. Halfpipe and Counter are complete arcade loops, Blueprint documents the architecture, and G Travel turns journeys into an interactive atlas. None replaces the canonical first-visit portfolio.",
    decisions: [
      "Make playful work discoverable, never mandatory.",
      "Keep every game playable when storage or APIs fail.",
    ],
    evidence: [
      { label: "Nexus source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/nexus" },
      { label: "Halfpipe source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/d-3d-game" },
      { label: "Counter source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/e-2d-game" },
      { label: "Blueprint source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/f-blueprint" },
      { label: "G Travel source", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/g-travel" },
    ],
    href: "/?v=nexus",
    position: { x: 80, y: 20 },
  },
  {
    id: "shared-content",
    region: "content",
    code: "DATA.01",
    title: "Shared content contract",
    label: "identity · experience · projects",
    summary: "Facts have a canonical source even when layouts diverge.",
    detail:
      "Identity, career history, project metadata, the universe dial, and transition styles originate from a shared content branch. A manually run repository check compares shared files across five configured version worktrees and reports drift.",
    decisions: [
      "Synchronize durable facts, not whole applications.",
      "Allow intentional schema divergence where a version needs richer storytelling.",
    ],
    evidence: [
      { label: "Canonical content branch", href: "https://github.com/sean-m-higgins/seanmh.com/tree/content" },
      { label: "check:shared implementation", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/scripts/check-shared.mjs" },
      { label: "Shared-check command", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/package.json" },
    ],
    position: { x: 61, y: 49 },
  },
  {
    id: "services",
    region: "service",
    code: "SVC.01",
    title: "Optional services",
    label: "ask · scores",
    summary: "Enhancements fail softly and stay behind narrow contracts.",
    detail:
      "The terminal assistant is content-grounded, secret-gated, streamed, and rate-limited. Halfpipe and Counter use isolated leaderboard contracts with plausibility checks. Missing configuration produces a useful local fallback rather than a broken experience.",
    decisions: [
      "Keep paid model access explicitly gated.",
      "Treat global state as optional enhancement.",
      "Separate each game's score contract and storage key.",
    ],
    evidence: [
      { label: "/api/ask implementation", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
      { label: "Service contract tests", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
      { label: "Terminal fallback", href: "https://github.com/sean-m-higgins/seanmh.com/tree/version/c-terminal" },
    ],
    position: { x: 80, y: 49 },
  },
  {
    id: "storage",
    region: "service",
    code: "SVC.02",
    title: "Storage boundary",
    label: "Workers KV",
    summary: "Small shared state lives outside the presentation branches.",
    detail:
      "KV stores rate-limit counters, optional assistant grounding context, and compact top-ten scoreboards. Clients retain local progress, and service failures never block browsing or play.",
    decisions: [
      "Store only what the feature needs.",
      "Avoid accounts and visitor tracking.",
    ],
    evidence: [
      { label: "KV binding", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/wrangler.jsonc" },
      { label: "Namespaced storage keys", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
      { label: "Degradation tests", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
    ],
    position: { x: 94, y: 49 },
  },
  {
    id: "delivery",
    region: "delivery",
    code: "SHIP.01",
    title: "Independent delivery",
    label: "Git branches → Pages",
    summary: "Each universe deploys independently behind the same domain.",
    detail:
      "The visual versions live on separate long-running branches and Cloudflare Pages projects. The main branch owns the public Worker, routing tests, shared-content checker, local development proxy, and operating documentation—not a presentation app.",
    decisions: [
      "Make branch-per-version part of the product idea.",
      "Keep the public router independently testable and deployable.",
    ],
    evidence: [
      { label: "Version and deployment index", href: "https://github.com/sean-m-higgins/seanmh.com#seanmhcom" },
      { label: "Repository branches", href: "https://github.com/sean-m-higgins/seanmh.com/branches/all" },
      { label: "Router Worker", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/worker.js" },
    ],
    position: { x: 78, y: 79 },
  },
  {
    id: "quality",
    region: "delivery",
    code: "SHIP.02",
    title: "Quality checks",
    label: "build · test · fallback",
    summary: "The enhanced experience is never the only experience.",
    detail:
      "Static builds, typed checks, Worker tests, shared-file validation, reduced-motion modes, no-JavaScript content, and graphics fallbacks keep the system honest across browsers and capabilities.",
    decisions: [
      "Treat accessibility as architecture, not polish.",
      "Test routing contracts independently from visual code.",
    ],
    evidence: [
      { label: "Worker test suite", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/test/worker.test.js" },
      { label: "Shared-file validator", href: "https://github.com/sean-m-higgins/seanmh.com/blob/main/scripts/check-shared.mjs" },
      { label: "Blueprint build commands", href: "https://github.com/sean-m-higgins/seanmh.com/blob/version/f-blueprint/package.json" },
    ],
    position: { x: 56, y: 79 },
  },
];
export const tour: readonly TourStop[] = [
  {
    node: "request",
    eyebrow: "01 / Arrival",
    title: "One public address",
    copy: "A visitor asks for seanmh.com. The URL stays stable even though several independently deployed experiences can answer.",
    flow: "request-router",
  },
  {
    node: "router",
    eyebrow: "02 / Edge",
    title: "The Worker owns the boundary",
    copy: "The edge separates durable paths, APIs, and portfolio selection before any visual branch sees the request.",
    flow: "request-router",
  },
  {
    node: "resolver",
    eyebrow: "03 / Resolution",
    title: "Intent has a strict order",
    copy: "Stable paths win first. At the root, an explicit choice wins over a valid session preference; Scroll is the deterministic fallback.",
    flow: "router-resolver",
  },
  {
    node: "experiences",
    eyebrow: "04 / Presentation",
    title: "One identity, several interfaces",
    copy: "The chosen Pages project renders the same professional core as a cinematic story, tactile card, or working terminal.",
    flow: "resolver-experiences",
  },
  {
    node: "shared-content",
    eyebrow: "05 / Consistency",
    title: "Facts move through a contract",
    copy: "Shared identity and experience modules keep durable facts aligned without forcing each version to share its layout or interaction model.",
    flow: "content-experiences",
  },
  {
    node: "services",
    eyebrow: "06 / Enhancement",
    title: "Services remain optional",
    copy: "Assistant and leaderboard requests cross narrow API contracts. Local content and game state remain useful when those services are unavailable.",
    flow: "resolver-services",
  },
  {
    node: "quality",
    eyebrow: "07 / Delivery",
    title: "The fallback is part of the system",
    copy: "Independent builds, shared checks, routing tests, and accessible fallbacks turn a collection of experiments into a dependable portfolio platform.",
    flow: "quality-delivery",
  },
];
