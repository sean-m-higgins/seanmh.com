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
      "Led an API Gateway edge deployment for a high-volume AWS consumer with no production incidents. Designed cross-account security and migrated 15 client teams and 2.25B+ API calls, saving an estimated $600K to $1.2M a year.",
      "Own the enterprise OAuth 2.0 Authorization Server. Migrated all production and test traffic to new infrastructure, raised test coverage from about 60% to 90%+, and improved monitoring, documentation, and release automation.",
      "Serve as the API Gateway Platform's go-to engineer for OAuth 2.0. Delivered Workforce SSO, Step-Up Authentication, and consumer identity integrations, and lead incident response, client support, and internal training.",
      "Replaced a flat-file export pipeline with a Python and AWS Batch service that delivers Parquet through OneStream. Verified that no data was lost across 75M+ production rows and retired the old infrastructure.",
      "Started and ran API Gateway Platform Hack Days 2026, a hybrid event for the organization where teams used AI engineering tools to solve platform problems.",
    ],
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Capital One",
    dates: "Nov 2021 – Dec 2023",
    highlights: [
      "Built an Angular and Java application to create and run Scala ETL workflows for credit card partner conversions. The application cut average conversion time by four months.",
      "Processed 10M+ trailing transactions across 1 to 2M customer accounts during three partner conversions, using custom Scala ETL jobs that ran daily on AWS EMR.",
    ],
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Scientist",
    organization: "R1 RCM",
    dates: "Nov 2020 – Oct 2021",
    highlights: [
      "Built an ML pipeline for ETL, training, testing, and evaluation, then moved it from a single remote Windows server to AzureML GPU clusters. Training ran twice as fast, allowing at least four times as many experiments.",
      "Researched and trained models to predict hospital and physician claim traits before insurance review. Faster processing and fewer avoidable costs saved an estimated $1M to $2M a year.",
    ],
    url: "https://www.r1rcm.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Kemper",
    dates: "Nov 2019 – Nov 2020",
    highlights: [
      "Worked as a full-stack developer on a Micro-Automation Portal built with Angular, Python ETL, and AWS DynamoDB. Employees used it to manage automated CFO reports and accounting journals for analysis and visualization.",
    ],
    url: "https://www.kemper.com",
  },
  {
    type: "education",
    title: "M.S. Software Engineering",
    organization: "Loyola University Chicago",
    dates: "Jan 2020 – Dec 2020",
    highlights: [
      "GPA 3.7/4.0.",
      "Teaching assistant for Database Programming, Intermediate Object-Oriented Programming, Machine Learning, and Operating Systems.",
      "As a research assistant, developed NLP techniques using convolutional neural networks to classify drug misuse from patients' electronic health records.",
    ],
    url: "https://www.luc.edu",
  },
  {
    type: "education",
    title: "B.S. Computer Science",
    organization: "Loyola University Chicago",
    dates: "Aug 2016 – Dec 2019",
    highlights: [
      "Cumulative GPA 3.6/4.0; major GPA 3.8/4.0.",
      "As a research assistant, built two NLP applications: one to extract keyphrases from a small text corpus and another to classify GitHub issues using neural networks.",
    ],
    url: "https://www.luc.edu",
  },
];
