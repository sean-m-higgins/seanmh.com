export interface ExperienceEntry {
  type: "work" | "education";
  title: string;
  organization: string;
  dates: string;
  description: string;
  url?: string;
}

export const experience: ExperienceEntry[] = [
  {
    type: "work",
    title: "Senior Software Engineer",
    organization: "Capital One",
    dates: "Dec 2023 – Present",
    description:
      "OAuth2.0 subject matter expert for API Gateway Platform. Architect authentication features including Workforce SSO and Step-Up Auth. Own the Consent UI full-stack Angular app on AWS CloudFront. Core maintainer of the Lua-based API Gateway, delivering feature development and leading inner-source contributions.",
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Capital One",
    dates: "Nov 2021 – Dec 2023",
    description:
      "Built a full-stack Angular/Java application automating Scala ETL workflows for credit card partner conversions, reducing conversion length by 4 months. Transformed 10M+ trailing transactions across 1-2M customer accounts for 3 successful conversion events on AWS EMR.",
    url: "https://www.capitalone.com",
  },
  {
    type: "work",
    title: "Data Scientist",
    organization: "R1 RCM",
    dates: "Nov 2020 – Oct 2021",
    description:
      "Designed a scalable ML training pipeline on AzureML GPU clusters, speeding up training 2x and increasing experiments 4x+. Trained classification models to predict hospital/physician claim traits, resulting in $1-2M/year savings.",
    url: "https://www.r1rcm.com",
  },
  {
    type: "work",
    title: "Data Engineer",
    organization: "Kemper",
    dates: "Nov 2019 – Nov 2020",
    description:
      "Full-stack developer on Micro-Automation Portal for employees to manage automations like the CFO report and accounting journals, built on Angular, Python ETL, and AWS DynamoDB.",
    url: "https://www.kemper.com",
  },
  {
    type: "education",
    title: "M.S. Software Engineering",
    organization: "Loyola University Chicago",
    dates: "Jan 2020 – Dec 2020",
    description:
      "GPA: 3.7/4.0. Teaching Assistant for Database Programming, ML, and Operating Systems. Research Assistant developing NLP techniques for medical data classification.",
    url: "https://www.luc.edu",
  },
  {
    type: "education",
    title: "B.S. Computer Science",
    organization: "Loyola University Chicago",
    dates: "Aug 2016 – Dec 2019",
    description:
      "GPA: 3.6/4.0, Major GPA: 3.8/4.0. Research Assistant developing NLP applications for keyphrase extraction and GitHub issue classification.",
    url: "https://www.luc.edu",
  },
];
