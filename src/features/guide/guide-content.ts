/**
 * The content of the in-app guide: every feature, with an example, how VerityAI processes it,
 * and what you get back. Kept as data so the page stays a simple renderer and the text is easy
 * to update when a feature changes.
 */

export type GuideFeature = {
  id: string;
  title: string;
  /** One sentence: what this is for. */
  summary: string;
  /** Where to find it in the app. */
  link: { to: string; label: string };
  /** Who can use it (roles). */
  who: string;
  example: { label: string; text: string };
  /** How VerityAI processes it, step by step. */
  steps: Array<{ title: string; detail: string }>;
  /** What you get back. */
  result: string[];
  tip?: string;
};

/** The research pipeline at a glance (one run). */
export const PIPELINE = [
  { name: "Plan", detail: "Breaks the question into 2–4 sub-questions with search queries" },
  { name: "Search", detail: "Finds new sources on the web and arXiv (optional)" },
  { name: "Read", detail: "Fetches, parses and indexes the most promising ones" },
  { name: "Retrieve", detail: "Hybrid search over your documents for each sub-question" },
  { name: "Extract", detail: "Pulls exact quotes as numbered evidence, checked verbatim" },
  { name: "Analyze", detail: "Runs sandboxed code for counts and comparisons" },
  { name: "Write", detail: "Streams a structured report citing evidence as [n]" },
  { name: "Check", detail: "Fact-checks every claim, scores the report, revises once if needed" },
];

export const FEATURES: GuideFeature[] = [
  {
    id: "research",
    title: "Ask a research question",
    summary:
      "Type a question; the agent plans the investigation, gathers evidence and writes a cited report.",
    link: { to: "/research", label: "Research" },
    who: "Owners, admins and researchers",
    example: {
      label: "Question",
      text: "Research the latest developments in AI agents, compare the major approaches, and identify gaps.",
    },
    steps: [
      {
        title: "Your question becomes a task and a run",
        detail:
          'The run is queued and picked up by a background worker, so the page never waits on the AI. Leave "Find new sources on the web, arXiv" on to search beyond your own documents.',
      },
      {
        title: "Plan",
        detail:
          'The model splits the question into sub-questions, e.g. "Which approaches exist and how do they compare?", each with its own search queries.',
      },
      {
        title: "Search and read (optional)",
        detail:
          "Web and arXiv results are ranked; the best few are fetched safely (public addresses only, size and time limits), parsed and indexed like uploads.",
      },
      {
        title: "Retrieve and extract",
        detail:
          "For each sub-question, hybrid search (meaning + keywords) finds passages; the model quotes the parts that answer it. Quotes that don't appear word for word in the passage are thrown away.",
      },
      {
        title: "Analyze and write",
        detail:
          "Optional sandboxed code counts and compares the evidence; then the report streams in, citing evidence as [1], [2, 5].",
      },
      {
        title: "Check",
        detail:
          "Every cited sentence is fact-checked against its quotes and the run gets a trust scorecard (see below).",
      },
    ],
    result: [
      "A report with Summary, Findings per sub-question, a Comparison table, Research gaps and Limitations",
      "Clickable citations that open the exact quote and its place in the source",
      "The research plan with which sub-questions were answered",
      "A trust scorecard, cost, tokens and duration",
    ],
    tip: 'Add extra instructions ("peer-reviewed only", "focus on 2025–2026") to steer the plan and the report.',
  },
  {
    id: "live",
    title: "Follow a run live",
    summary: "Watch each stage as it happens, and see where time and money went afterwards.",
    link: { to: "/research", label: "Any run" },
    who: "Everyone in the organization",
    example: {
      label: "While a run is working",
      text: "Plan ✓ · Retrieve ✓ · Extract ✓ · Write (working…) · Check",
    },
    steps: [
      {
        title: "Stage timeline",
        detail:
          'The worker publishes every stage change; the page receives it over a live stream and ticks the stage off with a one-line result ("3 sub-questions", "12 quotes").',
      },
      {
        title: "Streaming answer",
        detail:
          "The report appears word by word. If the connection drops, the page reconnects and catches up without duplicating text.",
      },
      {
        title: "Trace & cost tab",
        detail:
          "Every stage, model call and tool call is recorded as a timed span, so you can see a waterfall of the run.",
      },
    ],
    result: [
      "A live view of progress, including pauses for approval",
      "A waterfall trace, cost per stage and the slowest operations",
      "Cancel and Run again buttons",
    ],
  },
  {
    id: "citations",
    title: "Check where a claim comes from",
    summary: "Every number in square brackets is a link to the exact evidence behind the sentence.",
    link: { to: "/reports", label: "Reports" },
    who: "Everyone in the organization",
    example: {
      label: "In a report",
      text: "Hybrid search combines vector similarity with keyword matching [4].",
    },
    steps: [
      {
        title: "Click the citation [4]",
        detail:
          "A popover shows the quote, the source title and pages, whether the quote supports or contradicts the sub-question, and the model's confidence.",
      },
      {
        title: "Open in source",
        detail: "Opens the source document at that passage, so you can read it in context.",
      },
    ],
    result: [
      "The verbatim quote, source and page for every claim",
      'A red "?" marker if the model ever cites a number it wasn\'t given',
    ],
  },
  {
    id: "scorecard",
    title: "Trust scorecard, claim check and revision",
    summary:
      "Every report is fact-checked automatically; weak reports are rewritten once before you see them.",
    link: { to: "/research", label: "Any completed run" },
    who: "Everyone in the organization",
    example: {
      label: "On a completed run",
      text: "Revised once after fact-checking: claim support 56% in the first draft → 100%.",
    },
    steps: [
      {
        title: "Claim judge",
        detail:
          "A judge model sees each cited sentence and only the quotes it cites, and decides: supported, partly supported or unsupported. It also checks each citation separately.",
      },
      {
        title: "Automatic checks",
        detail:
          "Citation validity (do citations point at real evidence?), source reliability (publisher type and age), coverage of the plan, contradictions cited, policy compliance, and a task-completion judge.",
      },
      {
        title: "Revision loop",
        detail:
          "If fewer than 90% of claims are supported, the report is rewritten once with the flagged claims as feedback, checked again, and the better version is kept.",
      },
    ],
    result: [
      "A scorecard: one tile per metric with its target (e.g. claim support ≥ 90%)",
      "A Claim check list: each sentence marked Supported / Partly supported / Unsupported, with the judge's reason on hover",
      '"Why these scores": per-source reliability, missing parts of the task, policy violations',
    ],
    tip: 'Use the "Needs attention" filter to read only the claims that weren\'t fully supported.',
  },
  {
    id: "feedback",
    title: "Rate reports and claims",
    summary: "Thumbs up or down on a report or on a single claim, as the human check on the judge.",
    link: { to: "/research", label: "Any completed run" },
    who: "Everyone, including viewers",
    example: {
      label: "On a claim",
      text: "👎 on a claim the judge marked Supported but you know is wrong",
    },
    steps: [
      {
        title: "Click a thumb",
        detail:
          "Your rating is saved immediately; click it again to remove it. One rating per person per report or claim.",
      },
    ],
    result: ["Your rating is stored with the report and shown when you come back"],
  },
  {
    id: "sources",
    title: "Build your knowledge base",
    summary: "Upload your own documents into collections; the agent searches them in every run.",
    link: { to: "/sources", label: "Sources" },
    who: "Upload: owners, admins, researchers · organization-wide collections: owners and admins",
    example: { label: "Upload", text: "A PDF paper, a Markdown note or a text file (up to 25 MB)" },
    steps: [
      {
        title: "Create a collection",
        detail: "Private (only you) or organization-wide (everyone can search it).",
      },
      {
        title: "Upload",
        detail:
          "The file is stored, then a background job parses it (PDF pages or text), splits it into ~800-token chunks and computes an embedding for each. The same file uploaded twice is stored once.",
      },
      {
        title: "Search",
        detail:
          "Every chunk is findable by meaning (vector search) and by keywords (full text); results are merged with reciprocal rank fusion.",
      },
    ],
    result: [
      "Documents with status (processing → ready), pages and chunk counts",
      "A chunk viewer to see exactly what the agent can quote",
      "Research runs that cite your documents alongside web and arXiv sources",
    ],
  },
  {
    id: "reports",
    title: "Find and export reports",
    summary: "Every finished report in one place, with versions and downloads.",
    link: { to: "/reports", label: "Reports" },
    who: "Everyone in the organization",
    example: {
      label: "Search",
      text: '"hallucinations" → every report whose question or title mentions it',
    },
    steps: [
      {
        title: "Open a report",
        detail:
          "Read it with working citations. If it was revised, switch between version 1 (superseded) and version 2.",
      },
      {
        title: "Download",
        detail:
          "PDF or Markdown. The export adds the evidence behind every citation, a bibliography and how the report was checked.",
      },
    ],
    result: [
      'A PDF with numbered citations, an Evidence section, References (APA-style) and an "About this report" section with the automatic checks',
      "The same as Markdown, for wikis or Git",
    ],
  },
  {
    id: "evaluations",
    title: "Benchmark the agent (offline evaluation)",
    summary:
      "Run the agent on a fixed set of questions to compare models and settings before changing anything.",
    link: { to: "/evaluations", label: "Evaluations" },
    who: "Run and edit: owners, admins, researchers · read: everyone",
    example: {
      label: "Comparison",
      text: '"revise on" vs "revise off" on the starter dataset: claim support 100% vs 60%, citation accuracy 100% vs 47%.',
    },
    steps: [
      {
        title: "Install the starter dataset (or make your own)",
        detail:
          "25 questions about AI agents, RAG, evaluation and safety, including 5 red-team cases with hidden prompt injections. Each case can list required points, expected sources and forbidden content.",
      },
      {
        title: "Start an eval run",
        detail:
          "Choose the model, passages per sub-question, revision on/off, web search on/off and an optional case limit. The settings and every prompt version are frozen with the run.",
      },
      {
        title: "Each case runs through the real agent",
        detail:
          "Unattended: tool calls that would need approval are denied. Then each case is scored: the trust scorecard plus required points, expected-source recall and forbidden content.",
      },
      {
        title: "Compare",
        detail:
          "Select two finished runs of the same dataset; see each metric side by side and which cases got fixed or regressed.",
      },
    ],
    result: [
      "A scorecard per eval run: pass rate, mean scores, pass rate by category, latency and cost",
      'Each case\'s verdict with readable reasons ("Required points 50% < 80%")',
      "A comparison page: what changed, A vs B bars, fixed and regressed cases",
    ],
    tip: "From a terminal: npm run eval -- --dataset ai-agents --category red_team --min-pass-rate 1 (fails CI when the pass rate drops).",
  },
  {
    id: "policy",
    title: "Control what the agent may do",
    summary: "Rules every tool call must pass, and human approval for sensitive actions.",
    link: { to: "/settings/policy", label: "Agent policy" },
    who: "Edit policy: owners and admins · approve: owners and admins",
    example: {
      label: "Policy",
      text: "Block reddit.com, allow at most 10 page fetches per run, ask before running code, cap each run at $1.",
    },
    steps: [
      {
        title: "Every tool call goes through the gateway",
        detail:
          "Checks in order: is the tool enabled → are the arguments valid → does the user have permission → do the org's rules allow it (domains, limits) → is there budget left.",
      },
      {
        title: "Allow, deny or ask",
        detail:
          'Allowed calls run; denied ones are skipped with a reason; "require approval" pauses the run and adds it to the Approvals inbox.',
      },
      {
        title: "Approve or reject",
        detail:
          "The run continues where it stopped. Running out of budget can also ask for more instead of failing.",
      },
    ],
    result: [
      "Policy decisions listed on each run (what was denied and why)",
      "A versioned policy history",
      "An approvals inbox with a badge for pending requests",
    ],
  },
  {
    id: "observability",
    title: "Monitor speed, cost and failures",
    summary: "Organization-wide metrics and a detailed trace for every run.",
    link: { to: "/observability", label: "Observability" },
    who: "Everyone in the organization",
    example: {
      label: "Question it answers",
      text: "Why was yesterday's run slow, and what did this week cost?",
    },
    steps: [
      {
        title: "Everything is traced",
        detail:
          "Each run attempt, stage, model call, tool call and policy check is a timed span with tokens and cost.",
      },
      {
        title: "Aggregated per day",
        detail:
          "Percentile latencies, tool error rates, denials, cost per run and failures by category over 7, 30 or 90 days.",
      },
    ],
    result: [
      "A dashboard with charts and table views",
      "Per-run waterfall, per-stage cost and the slowest operations",
    ],
  },
  {
    id: "organization",
    title: "Invite your team",
    summary: "Add people to your organization with the right role.",
    link: { to: "/organization", label: "Organization" },
    who: "Manage members: owners and admins",
    example: { label: "Add a member", text: "colleague@example.com as Researcher" },
    steps: [
      {
        title: "Add by email",
        detail:
          "The person needs an account first. Roles can be changed or removed later; only owners can change owners, and the last owner can't be removed.",
      },
    ],
    result: [
      "The member sees the organization's research, sources and reports, limited by their role",
    ],
  },
];

/** What each role can do (✓ = yes). */
export const ROLES: Array<{
  action: string;
  owner: boolean;
  admin: boolean;
  researcher: boolean;
  viewer: boolean;
}> = [
  {
    action: "Read research, reports, scorecards, traces",
    owner: true,
    admin: true,
    researcher: true,
    viewer: true,
  },
  { action: "Rate reports and claims", owner: true, admin: true, researcher: true, viewer: true },
  {
    action: "Start research runs, upload documents",
    owner: true,
    admin: true,
    researcher: true,
    viewer: false,
  },
  {
    action: "Create datasets and run evaluations",
    owner: true,
    admin: true,
    researcher: true,
    viewer: false,
  },
  {
    action: "Organization-wide collections, cancel anyone's runs",
    owner: true,
    admin: true,
    researcher: false,
    viewer: false,
  },
  {
    action: "Approve agent actions, edit the agent policy",
    owner: true,
    admin: true,
    researcher: false,
    viewer: false,
  },
  { action: "Manage members", owner: true, admin: true, researcher: false, viewer: false },
];
