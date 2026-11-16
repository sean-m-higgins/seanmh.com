export const currentFocus = {
  lead: "I work on the API Gateway Platform and own its Authorization Server, the enterprise OAuth 2.0 service that handles workforce and consumer authorization.",
  // Figures carry inline <b class="stat"> emphasis, so this one renders through
  // set:html in About.astro. Authored here, never user input.
  scale:
    "Every internal and external API call at the bank goes through this platform. It handles <b class='stat'>40B+ requests</b> and <b class='stat'>200TB+</b> of data a day for <b class='stat'>100k+ clients</b>, with peaks of <b class='stat'>200k req/sec</b> and <b class='stat'>99.99%</b> uptime. The Authorization Server issues and revokes <b class='stat'>2B+</b> OAuth tokens a day, peaking at <b class='stat'>25k/sec</b> in production.",
  body: "Alongside the engineering work, I train teammates and document how the system works so others can support it. My peers have recognized that work on several critical partner releases.",
} as const;

export interface Differentiator {
  title: string;
  body: string;
}

export const differentiators: Differentiator[] = [
  {
    title: "Seeing projects through",
    body: "I handle design, implementation, testing, and production rollout, including projects that start with an incident. I also mentor teammates, write documentation, and keep stakeholders informed.",
  },
  {
    title: "Helping teammates use AI tools",
    body: "I requested early access to Claude Code and changed how I work with it. I lead weekly AI Lunch & Learns and organized a hackathon around an AI coding-agent challenge.",
  },
  {
    title: "Learning from incidents",
    body: "After a Sev3 incident, I added a circuit breaker pattern to the shared library and helped the team adopt it.",
  },
  {
    title: "Working across the stack",
    body: "I own several critical platform services written in Python, Lua, and Angular, along with the infrastructure they run on.",
  },
  {
    title: "Reducing infrastructure costs",
    body: "I'm leading a deployment projected to save over $100k a year in Transit Gateway charges.",
  },
  {
    title: "Keeping up with MCP and OAuth",
    body: "I attended the MCP Dev Summit in NYC to learn how MCP and OAuth work together, including how AI agents act as OAuth clients.",
  },
  {
    title: "Sharing what I know",
    body: "I write documentation, run training and knowledge-transfer sessions, and mentor through CODA DOJO so more teammates can support the systems I work on.",
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
  {
    quote:
      "Sean led the successful effort in transitioning our Machine Learning pipelines onto Microsoft AzureML in a larger intent to modernize Data Science at the company. He also developed and implemented many DNN Tensorflow models to solve huge cardinality problems in healthcare space. Sean showed the qualities of a young and curious engineer... He is a true asset both as a technical resource and thought leader.",
    role: "Manager, R1 RCM",
  },
];
