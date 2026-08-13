export interface ModuleDef {
  id: string;
  title: string;
  path: string;
  eyebrow: string;
  phase: number;
  description: string;
  iconName: string;
  defaultReadout: string;
}

export const modules: ModuleDef[] = [
  {
    id: 'me',
    title: 'Me Profile',
    path: '/me',
    eyebrow: 'Personal Kernel',
    phase: 1,
    description: 'Core persona, long-term goals, and AI behavior preferences.',
    iconName: 'User',
    defaultReadout: 'phase 1 · not configured',
  },
  {
    id: 'activity-log',
    title: 'Activity Log',
    path: '/activity-log',
    eyebrow: 'Daily Ledger',
    phase: 1,
    description: 'Engineering tasks, PR reviews, standups, and progress logs.',
    iconName: 'Activity',
    defaultReadout: '0 entries logged today',
  },
  {
    id: 'job-pipeline',
    title: 'Job Pipeline',
    path: '/job-pipeline',
    eyebrow: 'Career Funnel',
    phase: 2,
    description: 'Application tracking, stages, and recruiter coordination.',
    iconName: 'Briefcase',
    defaultReadout: '0 active applications',
  },
  {
    id: 'hr-details',
    title: 'HR Details',
    path: '/hr-details',
    eyebrow: 'Recruiter Contacts',
    phase: 2,
    description: 'Auto-upserted recruiter roster with contact info and companies.',
    iconName: 'Users',
    defaultReadout: '0 HR contacts indexed',
  },
  {
    id: 'leetcode',
    title: 'LeetCode Tracker',
    path: '/leetcode',
    eyebrow: 'DSA Telemetry',
    phase: 3,
    description: 'Problem solving telemetry, difficulty ratios, and streaks.',
    iconName: 'Code',
    defaultReadout: 'sync pending · 0 solved',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Scheduler',
    path: '/linkedin',
    eyebrow: 'Content Engine',
    phase: 4,
    description: 'Multi-platform post scheduling and timed comment cascades.',
    iconName: 'Share2',
    defaultReadout: '0 posts queued',
  },
  {
    id: 'performance',
    title: 'Performance',
    path: '/performance',
    eyebrow: 'Aggregations',
    phase: 5,
    description: 'Unified career KPIs, velocity charts, and consistency metrics.',
    iconName: 'TrendingUp',
    defaultReadout: '7d rollup · 0 ops',
  },
  {
    id: 'brain',
    title: 'Autonomous Brain',
    path: '/brain',
    eyebrow: 'Nightly Intelligence',
    phase: 7,
    description: 'Pinecone Vector RAG + NIM/OpenRouter LLM daily synthesis at 5 AM.',
    iconName: 'Cpu',
    defaultReadout: '5:00 AM synthesis · ready',
  },
  {
    id: 'ai-query',
    title: 'AI Query (RAG)',
    path: '/ai-query',
    eyebrow: 'Semantic Assistant',
    phase: 8,
    description: 'Real-time vector search and semantic answers over your history.',
    iconName: 'Sparkles',
    defaultReadout: 'Redis cache warm · ready',
  },
  {
    id: 'app-usage',
    title: 'App Usage Digest',
    path: '/app-usage',
    eyebrow: 'Screen Time',
    phase: 9,
    description: 'Developer focus analytics and daily digest dispatch.',
    iconName: 'Clock',
    defaultReadout: '21:00 digest active',
  },
  {
    id: 'system-monitor',
    title: 'System Resources',
    path: '/system-monitor',
    eyebrow: 'Host Telemetry',
    phase: 10,
    description: 'Live server CPU, RAM, Disk, Uptime, and Node runtime streaming via SSE.',
    iconName: 'Cpu',
    defaultReadout: 'live SSE host metrics',
  },
];
