export interface ExperienceEntry {
  type: "work" | "education";
  title: string;
  organization: string;
  dates: string;
  highlights: string[];
  url?: string;
}

export const experience: ExperienceEntry[] = [
  {
    type: "work",
    title: "Senior Software Engineer",
    organization: "Capital One",
    dates: "Dec 2023 – Present",
    highlights: [
      "OAuth 2.0 subject-matter expert for the API Gateway Platform — architected and shipped Workforce SSO, Step-Up Authentication, and a custom Identity Provider integration for consumer sign-in, all compliant with the OAuth 2.0 spec for enterprise-wide API security.",
      "Own the Consent UI, a full-stack Angular app on AWS CloudFront powering customer consent experiences for third-party data sharing — leading feature development and welcoming inner-source contributions from partner teams.",
      "Core maintainer of the largely Lua-based API Gateway, delivering feature work, AWS DevOps improvements, and the technical leadership behind initiatives like the UK gateway migration and CFPB Open Banking compliance.",
      "Mentored entry-level associate engineers through a 10-week program across two projects: modernizing a legacy application into a well-managed AWS Batch (Python) job for data extraction and data-lake publication, and building a circuit breaker for a shared Redis connector library.",
      "Organized and led an AI Hackathon on Capital One's internal AI Sandbox — running tool tutorials for entrants, guiding a project team to completion, and authoring a blog post on the outcomes and learnings.",
    ],
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Capital One",
    dates: "Nov 2021 – Dec 2023",
    highlights: [
      "Built a full-stack Angular and Java application that automated the creation and execution of Scala ETL workflows for credit-card partner conversions, cutting average conversion time by four months.",
      "Transformed 10M+ trailing transactions across 1–2M customer accounts through three successful partner conversions, running custom Scala ETL as daily batch jobs on AWS EMR.",
    ],
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Scientist",
    organization: "R1 RCM",
    dates: "Nov 2020 – Oct 2021",
    highlights: [
      "Designed a scalable ML training pipeline — ETL, training, testing, and evaluation — and migrated it from a single remote Windows server to AzureML GPU clusters, doubling training speed and enabling 4×+ more experiments.",
      "Researched and trained classification models that predicted hospital and physician claim traits ahead of insurance review, saving an estimated $1–2M per year by accelerating claim processing and eliminating avoidable costs.",
    ],
    url: "https://www.r1rcm.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Kemper",
    dates: "Nov 2019 – Nov 2020",
    highlights: [
      "Full-stack developer on a Micro-Automation Portal that let employees manage automations — like the CFO report and accounting journals — for quick analysis and visualization, built with Angular, Python ETL, and AWS DynamoDB.",
    ],
    url: "https://www.kemper.com",
  },
  {
    type: "education",
    title: "M.S. Software Engineering",
    organization: "Loyola University Chicago",
    dates: "Jan 2020 – Dec 2020",
    highlights: [
      "Teaching Assistant for Database Programming, Intermediate Object-Oriented Programming, Machine Learning, and Operating Systems.",
      "Research Assistant — developed novel NLP techniques to classify drug misuse from patients' electronic health records using convolutional neural networks.",
    ],
    url: "https://www.luc.edu",
  },
  {
    type: "education",
    title: "B.S. Computer Science",
    organization: "Loyola University Chicago",
    dates: "Aug 2016 – Dec 2019",
    highlights: [
      "Cumulative GPA 3.6/4.0 · Major GPA 3.8/4.0.",
      "Research Assistant — built two NLP applications: automated keyphrase extraction from a small text corpus, and GitHub issue classification with neural networks.",
    ],
    url: "https://www.luc.edu",
  },
];
