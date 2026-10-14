// Single source of truth for site copy and evidence.
// Rule: every evidence item links to its original source. Anything marked
// `interpretation` is Sameer's reading of that work, not a claim made by the source.
// Writing rule: no em dashes anywhere in this file.

export const SITE = {
  // Canonical host. Switch to https://www.sameer-goel.com only after www is fixed (it returns SSL 525 today)
  // and every legacy page plus sitemap.xml moves with it.
  url: "https://sameer-goel.com",
  name: "Sameer Goel",
  title: "Sameer Goel | AI engineering leadership, Forward Deployed Engineering, DeCoDE",
  description:
    "Sameer Goel is an AI Solutions Architect and engineering leader in the Netherlands. He mentors Forward Deployed Engineers through DeCoDE: Delegation, Communication, Discovery and Ethics, learned by building real projects from day one.",
  role: "AI Solutions Architect and engineering leader",
  location: "Netherlands",
  tagline: ["Build what matters.", "Grow who builds it."],
  links: {
    linkedin: "https://www.linkedin.com/in/sameer-goel/",
    github: "https://github.com/sameer-goel",
    conversation: "https://cal.com/sameer-goel/collab",
  },
};

export const NAV = [
  { href: "/why/", label: "Why" },
  { href: "/decode/", label: "DeCoDE" },
  { href: "/evidence/", label: "Evidence" },
  { href: "/thinking/", label: "Thinking" },
  { href: "/lab/", label: "Lab" },
  { href: "/mentoring/", label: "Mentoring" },
  { href: "/connect/", label: "Connect" },
];

/* ---------------- WHY / WHAT / HOW ---------------- */

export const TRIAD = [
  {
    key: "why",
    label: "Why",
    region: "Prefrontal cortex",
    regionNote: "Judgment, values, long-range choices.",
    title: "Solve what matters.",
    lines: ["Solve problems that make human lives better."],
    href: "/why/",
    cta: "Sit with the why",
  },
  {
    key: "what",
    label: "What",
    region: "Association cortex",
    regionNote: "Where separate signals become one picture.",
    title: "Growing Forward Deployed Engineers through DeCoDE.",
    lines: ["Delegation, Communication, Discovery, Ethics."],
    href: "/decode/",
    cta: "Explore the four dimensions",
  },
  {
    key: "how",
    label: "How",
    region: "Motor cortex",
    regionNote: "Intention becomes action.",
    title: "Project-based learning from day one.",
    lines: ["Small, real projects. Build, test, reflect, together."],
    href: "/lab/",
    cta: "Try one decision",
  },
] as const;

/* ---------------- DeCoDE ---------------- */
// Dimension names are confirmed by Sameer (13 Oct 2026).
// Definitions, challenges and takeaways are DRAFTS for his review.

export type Choice = { text: string; feedback: string; strong: boolean };

export const DECODE = [
  {
    key: "delegation",
    letter: "De",
    name: "Delegation",
    question: "What should a machine do, and what must stay with a human?",
    definition:
      "Hand execution to people and agents you can verify. Keep the decision about what success means.",
    example: {
      title: "Letting an agent run LLM training experiments",
      source: "https://builder.aws.com/content/3Ag08gFDyGn8M5PxoPK0qMKDWdY/i-used-an-ai-agent-to-run-my-llm-training-experiments",
      sourceLabel: "AWS Builder Center, Mar 2026",
      interpretation:
        "The agent could run experiments faster than any person. The engineering work was deciding what to try, what to measure, and when a result was good enough to trust.",
    },
    challenge: {
      prompt:
        "An agent can run forty training experiments overnight. What do you hand it?",
      choices: [
        { text: "Everything, including choosing the winning model", strong: false, feedback: "Fast, but you have handed over the definition of success. Nobody can explain tomorrow why this model won." },
        { text: "The runs and the logging. You keep the metric and the final call", strong: true, feedback: "The machine does the volume. You keep judgment and accountability. That is delegation." },
        { text: "Nothing. You run each one yourself to stay in control", strong: false, feedback: "Control without leverage. You will run four experiments, not forty, and learn less." },
      ] as Choice[],
    },
    takeaway: "Delegate the doing. Keep the deciding.",
  },
  {
    key: "communication",
    letter: "Co",
    name: "Communication",
    question: "Does the person on the other side understand what you built, and why?",
    definition:
      "Translate between the customer's language and the system's. Shorten the chain between the person with the problem and the person writing the code.",
    example: {
      title: "An appointment scheduler people could actually talk to",
      source: "https://aws.amazon.com/blogs/machine-learning/build-an-appointment-scheduler-interface-integrated-with-meta-using-amazon-lex-and-amazon-connect/",
      sourceLabel: "AWS Machine Learning Blog, Jun 2022",
      interpretation:
        "A conversational interface is communication design first. The hard part is how a person asks for an appointment, not which service answers.",
    },
    challenge: {
      prompt: "A customer says: \"We need a chatbot.\" What is your first move?",
      choices: [
        { text: "Pick the model and show a demo by Friday", strong: false, feedback: "Impressive and probably wrong. You have answered a request, not a problem." },
        { text: "Ask who is struggling today, with what, and what they do instead", strong: true, feedback: "Now you are talking about people, not technology. The chatbot may or may not survive that conversation." },
        { text: "Send a requirements template to fill in", strong: false, feedback: "A form puts distance where you need closeness. The real problem rarely fits in a template." },
      ] as Choice[],
    },
    takeaway: "Talk to the person with the problem before you touch the stack.",
  },
  {
    key: "discovery",
    letter: "D",
    name: "Discovery",
    question: "Are you solving the problem in front of you, or the one that matters?",
    definition:
      "Go to where the problem lives. Test assumptions early and cheaply, and let evidence change the plan.",
    example: {
      title: "Plant leaf disease detection with custom vision models",
      source: "https://aws.amazon.com/blogs/machine-learning/plant-leaf-disease-detection-with-amazon-rekognition-custom-labels/",
      sourceLabel: "AWS Machine Learning Blog, Apr 2021",
      interpretation:
        "A model that scores well on clean images can still fail in a field, in bad light, on a phone. Discovery means testing where the work actually happens.",
    },
    challenge: {
      prompt: "Your model is 95% accurate in testing. Farmers still do not trust it. Why?",
      choices: [
        { text: "They need more training on how to use AI", strong: false, feedback: "Blaming the user is the end of discovery. Their distrust is data." },
        { text: "Go to the field, watch how photos are taken, and test there", strong: true, feedback: "Lighting, angles, dirt on lenses. The real dataset was outside all along." },
        { text: "Push accuracy to 99% and relaunch", strong: false, feedback: "A better score on the wrong test is still the wrong test." },
      ] as Choice[],
    },
    takeaway: "The real requirements live where the work happens.",
  },
  {
    key: "ethics",
    letter: "E",
    name: "Ethics",
    question: "Who carries the cost if this works exactly as designed?",
    definition:
      "Weigh who benefits and who carries the risk. Protect human judgment and agency, especially when the easy metric points the other way.",
    example: {
      title: "How careless AI use can wear down human cognition",
      source: "https://builder.aws.com/content/36hYtvzHM8DoYEOtrUyK8tccn32/3-reasons-that-degrades-human-cognition-using-ai",
      sourceLabel: "AWS Builder Center, Jan 2026",
      interpretation:
        "Products that think for people can grow engagement while shrinking capability. That trade is an ethical decision, even when it looks like a product decision.",
    },
    challenge: {
      prompt: "A learning app for children could give answers directly. Engagement would rise 30%. Do you ship it?",
      choices: [
        { text: "Ship it. Engagement is the metric we report", strong: false, feedback: "The metric goes up. The children's own thinking goes down. Someone else pays for your number." },
        { text: "Coach the child toward the answer, and measure learning instead", strong: true, feedback: "Harder to build, slower to show, and it serves the person, not the dashboard." },
        { text: "Ship it, add a disclaimer for parents", strong: false, feedback: "A disclaimer moves responsibility. It does not remove the harm." },
      ] as Choice[],
    },
    takeaway: "Measure what the product does to people, not only what people do in the product.",
  },
] as const;

/* ---------------- Evidence ---------------- */

export type EvidenceKind = "AWS publication" | "Article" | "Talk" | "Project" | "Repository";
export type Evidence = {
  title: string;
  kind: EvidenceKind;
  year: number;
  venue: string;
  topics: string[];
  url?: string;
  image?: string;
  lesson?: string; // interpretation, clearly labelled in the UI
};

export const EVIDENCE: Evidence[] = [
  // AWS publications (from the live site's portfolio data; each links to the AWS post)
  { title: "Use computer vision to measure agriculture yield with Amazon Rekognition Custom Labels", kind: "AWS publication", year: 2022, venue: "AWS Machine Learning Blog", topics: ["Computer vision", "Sustainability"], url: "https://aws.amazon.com/blogs/machine-learning/use-computer-vision-to-measure-agriculture-yield-with-amazon-rekognition-custom-labels/", lesson: "Counting what matters to a grower is a discovery problem before it is a vision problem." },
  { title: "Build an appointment scheduler interface integrated with Meta using Amazon Lex and Amazon Connect", kind: "AWS publication", year: 2022, venue: "AWS Machine Learning Blog", topics: ["Conversational AI"], url: "https://aws.amazon.com/blogs/machine-learning/build-an-appointment-scheduler-interface-integrated-with-meta-using-amazon-lex-and-amazon-connect/" },
  { title: "Automate code reviews with Amazon CodeGuru Reviewer", kind: "AWS publication", year: 2022, venue: "AWS DevOps Blog", topics: ["Engineering practice"], url: "https://aws.amazon.com/blogs/devops/automate-code-reviews-with-amazon-codeguru-reviewer/", lesson: "Automated review frees human reviewers for the questions only humans can ask." },
  { title: "Build your own brand detection and visibility using SageMaker Ground Truth and Rekognition Custom Labels, Part 2", kind: "AWS publication", year: 2021, venue: "AWS Machine Learning Blog", topics: ["Computer vision", "Machine learning"], url: "https://aws.amazon.com/blogs/machine-learning/part-2-build-your-own-brand-detection-and-visibility-using-amazon-sagemaker-ground-truth-and-amazon-rekognition-custom-labels-training-and-analysis-workflows/" },
  { title: "Accenture promotes machine learning growth with the world's largest private AWS DeepComposer Battle of the Bands", kind: "AWS publication", year: 2021, venue: "AWS Machine Learning Blog", topics: ["Learning by building", "Community"], url: "https://aws.amazon.com/blogs/machine-learning/accenture-promotes-machine-learning-growth-with-worlds-largest-private-aws-deepcomposer-battle-of-the-bands-league/", lesson: "People learn machine learning faster when they compete, create and share." },
  { title: "Plant leaf disease detection with Amazon Rekognition Custom Labels", kind: "AWS publication", year: 2021, venue: "AWS Machine Learning Blog", topics: ["Computer vision", "Sustainability"], url: "https://aws.amazon.com/blogs/machine-learning/plant-leaf-disease-detection-with-amazon-rekognition-custom-labels/" },
  { title: "Build your own brand detection and visibility using SageMaker Ground Truth and Rekognition Custom Labels, Part 1", kind: "AWS publication", year: 2021, venue: "AWS Machine Learning Blog", topics: ["Computer vision", "Machine learning"], url: "https://aws.amazon.com/blogs/machine-learning/building-your-own-brand-detection-and-visibility-using-amazon-sagemaker-ground-truth-and-amazon-rekognition-custom-labels-part-1-end-to-end-solution/" },
  { title: "Query an Apache Hudi dataset in an Amazon S3 data lake with Amazon Athena, Part 1", kind: "AWS publication", year: 2021, venue: "AWS Big Data Blog", topics: ["Data engineering"], url: "https://aws.amazon.com/blogs/big-data/part-1-query-an-apache-hudi-dataset-in-an-amazon-s3-data-lake-with-amazon-athena-part-1-read-optimized-queries/" },
  { title: "Field Notes: Applying machine learning to vegetation management using Amazon SageMaker", kind: "AWS publication", year: 2021, venue: "AWS Architecture Blog", topics: ["Machine learning", "Architecture"], url: "https://aws.amazon.com/blogs/architecture/field-notes-applying-machine-learning-to-vegetation-management-using-amazon-sagemaker/" },
  { title: "Performing canary deployments for service integrations with Amazon API Gateway", kind: "AWS publication", year: 2020, venue: "AWS Compute Blog", topics: ["Architecture", "Engineering practice"], url: "https://aws.amazon.com/blogs/compute/performing-canary-deployments-for-service-integrations-with-amazon-api-gateway/", lesson: "Release to a few before you release to all. Responsibility, written as infrastructure." },
  { title: "Building a real-time notification system with Kinesis Data Streams for DynamoDB and Kinesis Data Analytics for Apache Flink", kind: "AWS publication", year: 2020, venue: "AWS Big Data Blog", topics: ["Data engineering", "Architecture"], url: "https://aws.amazon.com/blogs/big-data/building-a-real-time-notification-system-with-amazon-kinesis-data-streams-for-amazon-dynamodb-and-amazon-kinesis-data-analytics-for-apache-flink/" },
  { title: "How to create an expense tracking app without coding using Amazon Honeycode", kind: "AWS publication", year: 2020, venue: "AWS Business Productivity Blog", topics: ["Learning by building"], url: "https://aws.amazon.com/blogs/business-productivity/how-to-create-an-expense-tracking-app-without-coding-using-amazon-honeycode/" },
  { title: "Transforming the traveling experience with Accenture 5G Smart Airport Assistant and Amazon AR/VR", kind: "AWS publication", year: 2020, venue: "AWS Partner Network Blog", topics: ["Architecture", "Conversational AI"], url: "https://aws.amazon.com/blogs/apn/transforming-the-traveling-experience-with-accenture-5g-smart-airport-assistant-and-amazon-ar-vr/" },
  { title: "Using machine learning to support healthcare during a pandemic", kind: "AWS publication", year: 2020, venue: "AWS Marketplace Blog", topics: ["Machine learning", "Human impact"], url: "https://aws.amazon.com/blogs/awsmarketplace/using-machine-learning-to-support-healthcare-during-a-pandemic/" },
  { title: "Analyze and visualize your VPC network traffic using Amazon Kinesis and Amazon Athena", kind: "AWS publication", year: 2018, venue: "AWS Big Data Blog", topics: ["Data engineering"], url: "https://aws.amazon.com/blogs/big-data/analyze-and-visualize-your-vpc-network-traffic-using-amazon-kinesis-and-amazon-athena/" },

  // Articles
  { title: "Hire OpenClaw agent as co-worker: one click spin up on AWS", kind: "Article", year: 2026, venue: "AWS Builder Center", topics: ["Agentic AI"], url: "https://builder.aws.com/content/3B06xZzSwjcD3GiyYYwrCgZZHC9/hire-openclaw-agent-as-co-worker-or-one-click-spin-up-on-aws" },
  { title: "I used an AI agent to run my LLM training experiments", kind: "Article", year: 2026, venue: "AWS Builder Center", topics: ["Agentic AI", "Machine learning"], url: "https://builder.aws.com/content/3Ag08gFDyGn8M5PxoPK0qMKDWdY/i-used-an-ai-agent-to-run-my-llm-training-experiments", lesson: "Delegation in practice: the agent ran the volume, the human owned the judgment." },
  { title: "I built a GUI to migrate skills into Kiro Powers", kind: "Article", year: 2026, venue: "AWS Builder Center", topics: ["Agentic AI", "Engineering practice"], url: "https://builder.aws.com/content/3AbaOv0xZT0yNGSWYRbJduQP6Cg/i-build-a-gui-to-migrate-skills-into-kiro-powers" },
  { title: "3 reasons that degrade human cognition using AI", kind: "Article", year: 2026, venue: "AWS Builder Center", topics: ["Cognition", "Responsible AI"], url: "https://builder.aws.com/content/36hYtvzHM8DoYEOtrUyK8tccn32/3-reasons-that-degrades-human-cognition-using-ai" },
  { title: "5 step framework to improve your cognitive powers with AI", kind: "Article", year: 2025, venue: "AWS Builder Center", topics: ["Cognition", "Human-AI collaboration"], url: "https://builder.aws.com/content/36elnDMp3u2wpvetyPrGuZMbVLd/5-step-framework-to-improve-your-cognitive-powers-with-ai" },

  // Talks (photos from Sameer's own event archive)
  { title: "Emotional intelligence in the AI era", kind: "Talk", year: 2025, venue: "PSA Madrid offsite", topics: ["Human-AI collaboration"], image: "/img/talks/01.webp" },
  { title: "SDLC architecture keynote, AI Coding Days VibeCoding hackathon", kind: "Talk", year: 2025, venue: "Accenture", topics: ["Agentic AI", "Learning by building"], image: "/img/talks/11.webp" },
  { title: "Active model training, classification and face detection demos", kind: "Talk", year: 2022, venue: "Data Science Rotterdam meetup", topics: ["Machine learning", "Learning by building"], image: "/img/talks/05.webp" },
  { title: "AI/ML booth and DeepRacer", kind: "Talk", year: 2022, venue: "AWS Summit Stockholm", topics: ["Learning by building", "Community"], image: "/img/talks/20.webp" },
  { title: "Caching architecture session", kind: "Talk", year: 2019, venue: "AWS re:Invent, Las Vegas", topics: ["Architecture"], image: "/img/talks/22.webp" },
  { title: "DeepRacer event", kind: "Talk", year: 2019, venue: "Deloitte, Toronto", topics: ["Learning by building", "Community"], image: "/img/talks/16.webp" },
  { title: "Co-op panel: becoming a Solutions Architect", kind: "Talk", year: 2018, venue: "Northeastern University, Seattle", topics: ["Mentoring"], image: "/img/talks/08.webp" },
  { title: "BrainWaves neuroscience community event", kind: "Talk", year: 2015, venue: "Brainnovation, Boston", topics: ["Cognition"], image: "/img/talks/26.webp" },

  // Projects and repositories (public, linked)
  { title: "Forward Deployed Engineer: resume keywords and hiring data", kind: "Project", year: 2026, venue: "sameer-goel.com", topics: ["Forward Deployed Engineering", "Data engineering"], url: "https://sameer-goel.com/forward-deployed-engineer/", lesson: "Where two measurements disagreed by more than 15 points, the term is published as contested instead of averaged away." },
  { title: "Forward Deployed Engineering: questions answered by FDE leads", kind: "Project", year: 2026, venue: "sameer-goel.com", topics: ["Forward Deployed Engineering", "Mentoring"], url: "https://sameer-goel.com/forward-deployed-engineer/questions/" },
  { title: "Anthropic Claude certifications: visual study guide and practice exams", kind: "Project", year: 2026, venue: "sameer-goel.com", topics: ["Mentoring", "Learning by building"], url: "https://sameer-goel.com/anthropic-certifications/visual-study-guide/" },
  { title: "Build a completely sovereign AI system", kind: "Repository", year: 2026, venue: "GitHub", topics: ["Agentic AI", "Learning by building"], url: "https://github.com/sameer-goel/Build-Completely-Sovereign-AI-System", lesson: "A seven-level course: you understand an agent best by rebuilding one locally." },
  { title: "sameerai agent toolkit", kind: "Repository", year: 2026, venue: "GitHub", topics: ["Agentic AI", "Architecture"], url: "https://github.com/sameer-goel/sameerai-agent-toolkit" },
  { title: "Agent memory management, interactive course", kind: "Repository", year: 2026, venue: "GitHub", topics: ["Agentic AI", "Learning by building"], url: "https://github.com/sameer-goel/Agent-Memory-Management" },
  { title: "AI for Kids: AI that coaches critical thinking", kind: "Project", year: 2026, venue: "GitHub", topics: ["Responsible AI", "Mentoring"], url: "https://github.com/sameer-goel/ai-for-kids", lesson: "Ethics as a product choice: coach the thinking instead of handing over answers." },
  { title: "Recycle360: AI recycling guidance", kind: "Repository", year: 2026, venue: "GitHub", topics: ["Sustainability"], url: "https://github.com/sameer-goel/Recycle360" },
  { title: "Smart HR bot with sentiment analysis", kind: "Repository", year: 2019, venue: "GitHub", topics: ["Conversational AI"], url: "https://github.com/sameer-goel/Smart-HR-Bot-with-SentimentAnalysis-Integrated-with-SMS-and-other-services" },
  { title: "AWS machine learning concepts, hands-on notebooks", kind: "Repository", year: 2020, venue: "GitHub", topics: ["Machine learning", "Mentoring"], url: "https://github.com/sameer-goel/aws-machine-learning" },
];

/* ---------------- Thinking ---------------- */

export const THEMES = [
  {
    key: "cognition",
    title: "AI and the human mind",
    note: "What happens to attention, memory and judgment when a machine is always ready to think for us.",
    items: [
      { title: "3 reasons that degrade human cognition using AI", venue: "AWS Builder Center", year: 2026, url: "https://builder.aws.com/content/36hYtvzHM8DoYEOtrUyK8tccn32/3-reasons-that-degrades-human-cognition-using-ai" },
      { title: "5 step framework to improve your cognitive powers with AI", venue: "AWS Builder Center", year: 2025, url: "https://builder.aws.com/content/36elnDMp3u2wpvetyPrGuZMbVLd/5-step-framework-to-improve-your-cognitive-powers-with-ai" },
      { title: "The question is not how intelligent AI can become but how deeply humans continue to think alongside it", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7305517283798405120/" },
    ],
  },
  {
    key: "neuro",
    title: "Neuroscience and machine intelligence",
    note: "Useful comparisons, and the trap of projecting ourselves onto the systems we build.",
    items: [
      { title: "\"Is AI thinking like a human?\" is a trap", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7407790058516332544/" },
      { title: "Is GenAI just glorified auto-complete? Why AI labs hire neuroscientists", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7407338781382479872/" },
      { title: "Inner intelligence is like a fine-tuned transformer model", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7309843775638458369/" },
    ],
  },
  {
    key: "collab",
    title: "Human-AI collaboration and responsible use",
    note: "Practical habits for using AI without handing over your judgment.",
    items: [
      { title: "Practice mindful prompting to cultivate long-term inner intelligence", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7305235836311138304/" },
      { title: "7 self-reflection prompts for using AI mindfully", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7299197835600691201/" },
      { title: "A race between the power of technology and the wisdom with which we use it", venue: "LinkedIn", year: 2025, url: "https://www.linkedin.com/feed/update/urn:li:activity:7310639180668162048/" },
    ],
  },
  {
    key: "fde",
    title: "Forward Deployed Engineering and agentic work",
    note: "What changes when engineers sit with the customer and agents sit with the engineers.",
    items: [
      { title: "Forward Deployed Engineering: questions answered by FDE leads", venue: "sameer-goel.com", year: 2026, url: "https://sameer-goel.com/forward-deployed-engineer/questions/" },
      { title: "I used an AI agent to run my LLM training experiments", venue: "AWS Builder Center", year: 2026, url: "https://builder.aws.com/content/3Ag08gFDyGn8M5PxoPK0qMKDWdY/i-used-an-ai-agent-to-run-my-llm-training-experiments" },
      { title: "Hire OpenClaw agent as co-worker", venue: "AWS Builder Center", year: 2026, url: "https://builder.aws.com/content/3B06xZzSwjcD3GiyYYwrCgZZHC9/hire-openclaw-agent-as-co-worker-or-one-click-spin-up-on-aws" },
    ],
  },
];

/* ---------------- Learning Lab ---------------- */

export const LAB = {
  title: "The clinic that wanted a chatbot",
  brief:
    "A small physiotherapy clinic misses about one in five phone calls. The owner asks you for an AI chatbot. You have two weeks.",
  steps: [
    {
      dimension: "Discovery",
      prompt: "Day 1. Where do you start?",
      options: [
        { text: "Build a chatbot prototype tonight", score: 0, result: "You have a demo by morning. It answers questions nobody asked. The missed calls are still missed." },
        { text: "Sit at the front desk for a morning and listen", score: 2, result: "Most missed calls are people rescheduling, during the 08:00 to 09:00 rush. That is a much smaller, clearer problem." },
        { text: "Send the owner a survey", score: 1, result: "Useful numbers, but the owner guesses. The receptionist, who knows best, never fills it in." },
      ],
    },
    {
      dimension: "Delegation",
      prompt: "Rescheduling is the real problem. What does the AI handle?",
      options: [
        { text: "All bookings, cancellations and medical questions", score: 0, result: "A patient asks if their pain is normal. The bot answers. Nobody approved that." },
        { text: "Rescheduling only. Anything clinical goes to a human", score: 2, result: "A narrow job the system can do well, with a clear edge where people take over." },
        { text: "Nothing yet. Add more receptionists", score: 1, result: "Safe, but the clinic cannot afford it, so the problem returns next month." },
      ],
    },
    {
      dimension: "Communication",
      prompt: "Launch week. How do you introduce it to staff?",
      options: [
        { text: "Email a link and a two-page manual", score: 0, result: "Staff route around it. One receptionist tells patients the bot is broken." },
        { text: "Build the handover rules with the receptionist, then test together", score: 2, result: "She suggests a rule you missed: never move first appointments. She now defends the system." },
        { text: "Launch quietly and see what happens", score: 1, result: "It mostly works, but nobody knows who to call when it does not." },
      ],
    },
    {
      dimension: "Ethics",
      prompt: "The owner asks to record every call to train future models. Your answer?",
      options: [
        { text: "Yes, more data is always better", score: 0, result: "Health conversations, stored without clear consent. A real risk for patients and the clinic." },
        { text: "Only with explicit consent, minimal retention, and no clinical content", score: 2, result: "Slower learning, but patients stay in control of their own health information." },
        { text: "Record everything, decide later", score: 0, result: "Deciding later usually means deciding never, until something leaks." },
      ],
    },
  ],
};

/* ---------------- Connect ---------------- */

export const CONNECT = [
  { title: "Strategic engineering conversations", body: "For leaders deciding where AI should and should not go in their product or organization." },
  { title: "Speaking and research", body: "Talks, panels and research on human cognition, responsible AI and Forward Deployed Engineering." },
  { title: "Engineering leadership exchange", body: "Peer conversations on growing FDE teams, hiring for judgment and building delivery capability." },
  { title: "Mentorship and community", body: "Project-based learning circles for engineers and students who want to build responsibly." },
];

/* ---------------- Mentoring packages ---------------- */
// Replaces the old consulting packages. DRAFT formats for Sameer's review. No prices shown.

export const MENTORING = [
  {
    key: "one",
    name: "DeCoDE 1:1",
    who: "For an engineer moving into forward deployed work",
    line: "One real project, coached through all four dimensions.",
    format: ["Monthly 1:1 sessions", "Your own project", "Reflection after each milestone"],
  },
  {
    key: "circle",
    name: "FDE Circle",
    who: "For a small group of engineers",
    line: "Build, test and reflect together on small real problems.",
    format: ["4 to 8 engineers", "Project-based, from day one", "Peer review on DeCoDE"],
    featured: true,
  },
  {
    key: "leaders",
    name: "Leader Exchange",
    who: "For leaders growing an FDE team",
    line: "Hiring for judgment, structuring teams, growing mentors.",
    format: ["Peer conversations", "Team design sessions", "Mentor the mentors"],
  },
];
