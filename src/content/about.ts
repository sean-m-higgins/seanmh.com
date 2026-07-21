export const currentFocus = {
  lead: "Currently, core contributor and subject-matter expert on the Authorization Server — the enterprise OAuth 2.0 implementation handling workforce and consumer authorization flows.",
  body: "It issues and revokes every OAuth token for enterprise API access. Active ownership keeps this security-critical system covered and spreads the institutional knowledge that keeps it resilient, reinforced by peer recognition on several high-stakes partner releases.",
} as const;

export interface Differentiator {
  title: string;
  body: string;
}

export const differentiators: Differentiator[] = [
  {
    title: "Full-lifecycle ownership",
    body: "Takes projects from incident response through design, mentorship, implementation, testing, production rollout, documentation, and stakeholder communication — not just the code.",
  },
  {
    title: "Force multiplier through AI adoption",
    body: "Requested early access to Claude Code and fundamentally transformed personal workflow. Leads weekly AI Lunch & Learns and organized a hackathon built around an AI coding-agent challenge.",
  },
  {
    title: "Turns incidents into platform improvements",
    body: "Converted a Sev3 action item into a resilient circuit breaker pattern for the shared library, then mentored the team through adopting it.",
  },
  {
    title: "Breadth of concurrent ownership",
    body: "Simultaneously owns multiple critical services for the platform, spanning Python, Lua, and Angular, along with their surrounding infrastructure.",
  },
  {
    title: "Cost-conscious engineering leadership",
    body: "Leading a deployment projected to save $100k+ annually in Transit Gateway charges — initiative beyond feature delivery.",
  },
  {
    title: "Conference-to-action pipeline",
    body: "Attended the MCP Dev Summit in NYC, focusing on sessions at the crossroads of MCP and OAuth — including emerging patterns like AI agents as OAuth clients.",
  },
  {
    title: "Proactive knowledge sharing",
    body: "Reduces bus factor through training presentations, comprehensive documentation, knowledge-transfer sessions, AI Lunch & Learns, and CODA DOJO mentorship.",
  },
];

export interface Testimonial {
  quote: string;
  role: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "I want to take a minute and really appreciate all you have done in building and testing the MCP Gateway. There are a lot of unknowns, shifting priorities, and new last minute features. However, you have been great partners in helping build and test these capabilities.",
    role: "Sr. Tech Lead",
  },
  {
    quote:
      "Sean is a highly trusted engineer on the team. He is one of our most knowledgable experts on Identity in the Gateway. He is curious and dives deep into problems to understand them completely, and is capable of sharing that knowledge out.",
    role: "Tech Lead",
  },
  {
    quote: "Sean - thank you for the investment in the developer community via CODA!",
    role: "Product Owner",
  },
  {
    quote:
      "It is fair to say that it is highly unlikely we would have been able to have achieved such tight milestones without your support. You are a brilliant engineer and the only thing I wish had been different is that we could have worked together at least once in person.",
    role: "Innersource Contributor",
  },
];
