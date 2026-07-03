export interface ProjectEntry {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
}

export const projects: ProjectEntry[] = [
  {
    id: "api-gateway-platform",
    title: "API Gateway Platform",
    summary:
      "OAuth2.0-heavy API gateway work: authentication architecture, Lua gateway maintenance, Workforce SSO, and Step-Up Auth.",
    url: "https://www.capitalone.com",
    source: "Capital One experience",
  },
  {
    id: "consent-ui",
    title: "Consent UI",
    summary:
      "Full-stack Angular application on AWS CloudFront owned as part of API Gateway Platform work.",
    url: "https://www.capitalone.com",
    source: "Capital One experience",
  },
  {
    id: "partner-conversion-etl",
    title: "Partner Conversion ETL Automation",
    summary:
      "Angular/Java application automating Scala ETL workflows; reduced credit-card partner conversion length by 4 months.",
    url: "https://www.capitalone.com",
    source: "Capital One Data Engineer experience",
  },
  {
    id: "claims-ml-pipeline",
    title: "Claims ML Training Pipeline",
    summary:
      "Scalable AzureML GPU training pipeline for hospital/physician claim trait classification; sped training 2x and increased experiments 4x+.",
    url: "https://www.r1rcm.com",
    source: "R1 RCM experience",
  },
  {
    id: "micro-automation-portal",
    title: "Micro-Automation Portal",
    summary:
      "Angular, Python ETL, and AWS DynamoDB portal for employee-managed automations including CFO reporting and accounting journals.",
    url: "https://www.kemper.com",
    source: "Kemper experience",
  },
  {
    id: "seanmh-com",
    title: "seanmh.com Multiverse Portfolio",
    summary:
      "This Astro + Cloudflare Worker portfolio with multiple version branches, a universe dial, and cross-document View Transitions.",
    url: "https://seanmh.com/?v=c-terminal",
    source: "Current site",
  },
];
