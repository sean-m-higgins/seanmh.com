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

export interface SystemNode {
  id: string;
  region: SystemRegionId;
  code: string;
  title: string;
  label: string;
  summary: string;
  detail: string;
  decisions: string[];
  evidence: string[];
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

export const verifiedDate = "August 17, 2026";

export const regions: readonly SystemRegion[] = [
  {
    id: "experience",
    number: "01",
    title: "Experience layer",
    summary:
      "Seven expressions of one portfolio, each with a deliberate audience, interaction model, and fallback posture.",
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
      "Independent branches and deployments are held together by shared validation, progressive enhancement, and release evidence.",
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
    evidence: ["Cloudflare DNS", "HTTPS apex", "Same-origin navigation"],
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
    evidence: ["worker.js", "X-Portfolio-Version", "Worker regression suite"],
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
      "Blueprint and other durable content paths are invariant. For the portfolio root, an explicit visitor choice wins over a valid session preference; without either, Scroll is always served.",
    decisions: [
      "Do not place Blueprint in the preference cookie.",
      "Keep invalid controls away from upstream origins.",
    ],
    evidence: ["pv session cookie", "?v= manual control", "Path ownership"],
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
    evidence: ["Astro", "View Transitions", "Shared identity data"],
    href: "/?v=a-scroll",
    position: { x: 61, y: 20 },
  },
  {
    id: "experiments",
    region: "experience",
    code: "EXP.02",
    title: "Opt-in experiments",
    label: "Nexus · Halfpipe · Counter",
    summary: "Discovery and play demonstrate range without hijacking the landing page.",
    detail:
      "Nexus maps the portfolio as miniature worlds. Halfpipe and Counter are complete arcade loops with local-first progress and optional global boards. None is served to an unprepared first-time visitor.",
    decisions: [
      "Make playful work discoverable, never mandatory.",
      "Keep every game playable when storage or APIs fail.",
    ],
    evidence: ["Three.js", "Canvas 2D", "Local-first game state"],
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
      "Identity, career history, project metadata, the universe dial, and transition styles originate from a shared content branch. A repository check catches drift across consuming worktrees before release.",
    decisions: [
      "Synchronize durable facts, not whole applications.",
      "Allow intentional schema divergence where a version needs richer storytelling.",
    ],
    evidence: ["content branch", "check:shared", "Typed TypeScript modules"],
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
    evidence: ["/api/ask", "/api/score", "/api/score/boxing"],
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
    evidence: ["Namespaced keys", "No-store API responses", "Graceful degradation"],
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
      "The visual versions live on separate long-running branches and Cloudflare Pages projects. The main branch owns only the public router and operating documentation, keeping presentation deployments isolated from edge behavior.",
    decisions: [
      "Make branch-per-version part of the product idea.",
      "Keep the public router independently testable and deployable.",
    ],
    evidence: ["Seven version branches", "Cloudflare Pages", "Router Worker"],
    position: { x: 78, y: 79 },
  },
  {
    id: "quality",
    region: "delivery",
    code: "SHIP.02",
    title: "Quality gates",
    label: "build · test · fallback",
    summary: "The enhanced experience is never the only experience.",
    detail:
      "Static builds, typed checks, Worker tests, shared-file validation, reduced-motion modes, no-JavaScript content, and graphics fallbacks keep the system honest across browsers and capabilities.",
    decisions: [
      "Treat accessibility as architecture, not polish.",
      "Test routing contracts independently from visual code.",
    ],
    evidence: ["Astro check", "Node test runner", "Progressive enhancement"],
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
