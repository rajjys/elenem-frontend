import Container from '@/components/ui/container';

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Page intro */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900 text-white">
        <Container>
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              League management, <br />
              <span className="text-primary italic font-medium">done properly.</span>
            </h1>
            <p className="mt-8 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Elenem replaces fragmented tools with one authoritative system 
              designed specifically for the high stakes of sports competition.
            </p>
          </div>
          
          {/* Visual Anchor: The "Command Center" Bar */}
          <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-4 hidden md:flex flex-wrap gap-8 items-center backdrop-blur-sm max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">System Live</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="text-sm font-medium"><span className="text-primary">1,240</span> Matches Scheduled</div>
            <div className="text-sm font-medium"><span className="text-primary">84</span> Active Divisions</div>
            <div className="text-sm font-medium"><span className="text-primary">0</span> Calculation Errors</div>
          </div>
        </Container>
      </section>

      {/* Sections */}
      <FeatureSection {...leagueConfiguration} />
      <FeatureSection {...fixturesManagement} />
      <FeatureSection {...resultsAndStandings} />
      <FeatureSection {...publicPortal} />
      <FeatureSection {...administration} />
      <FeatureSection {...reliability} />
    </div>
  )
}

type PlanTier = 'Basic' | 'Pro' | 'Federation'

interface FeatureSectionProps {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  plans: {
    tier: PlanTier
    features: string[]
  }[]
}

function FeatureSection({
  eyebrow,
  title,
  description,
  bullets,
  plans,
}: FeatureSectionProps) {
  return (
    <section className="py-24 border-b last:border-none">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT – Value */}
          <div>
            <p className="text-sm uppercase tracking-wider font-semibold text-primary mb-3">
              {eyebrow}
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
              {title}
            </h2>
            <p className="text-lg text-muted mb-8">
              {description}
            </p>

            <ul className="space-y-4">
              {bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT – Plan mapping */}
          <div className="space-y-6">
            {plans.map((plan) => (
              <div
                key={plan.tier}
                className="rounded-2xl border bg-slate-50 p-6"
              >
                <h3 className="font-bold text-slate-900 mb-3">
                  Included in {plan.tier}
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {plan.features.map((f, i) => (
                    <li key={i}>– {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </Container>
    </section>
  )
}

const leagueConfiguration = {
  eyebrow: 'League configuration',
  title: 'Define the rules once',
  description:
    'Elenem starts by structuring your league correctly so everything else works automatically.',
  bullets: [
    'Teams, divisions, seasons, and competition rules',
    'Points system and tie-break logic',
    'Single authoritative structure for the entire season',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Single league configuration',
        'Standard competition rules',
        'Manual adjustments',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Multiple competitions per league',
        'Advanced rules and formats',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Standardized configuration across leagues',
        'Central governance controls',
      ],
    },
  ],
}

const fixturesManagement = {
  eyebrow: 'Fixtures management',
  title: 'One official match calendar',
  description:
    'Fixtures are created, updated, and published from one place, without conflicting versions.',
  bullets: [
    'Centralized match scheduling',
    'Live updates to fixtures',
    'Single authoritative calendar',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Manual fixture creation',
        'Centralized calendar',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Automatic fixture generation',
        'Rescheduling tools',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Cross-league calendar coordination',
      ],
    },
  ],
}

const resultsAndStandings = {
  eyebrow: 'Results and standings',
  title: 'Standings update automatically',
  description:
    'Results are entered once. The system applies league rules instantly.',
  bullets: [
    'Automatic points calculation',
    'Tie-breaks enforced by the system',
    'Standings update everywhere',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Manual result entry',
        'Automatic standings',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Advanced tie-break rules',
        'Multiple standings tables',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Standardized standings across leagues',
      ],
    },
  ],
}

const publicPortal = {
  eyebrow: 'Public league portal',
  title: 'Your league’s official home',
  description:
    'Fans and clubs follow your league from one reliable source.',
  bullets: [
    'Fixtures, results, and standings',
    'Mobile-ready by default',
    'Always synced with official data',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Public league website',
        'Core league data',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Custom domain',
        'Visual branding',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Multi-league public portals',
      ],
    },
  ],
}

const administration = {
  eyebrow: 'Administration',
  title: 'Structured control without complexity',
  description:
    'League management happens in one interface with clear authority.',
  bullets: [
    'Centralized administration',
    'Controlled updates',
    'Reduced human error',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Single admin role',
        'Central management',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Multiple admin roles',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Multi-league administration',
      ],
    },
  ],
}

const reliability = {
  eyebrow: 'Reliability',
  title: 'Built for consistency',
  description:
    'Elenem enforces rules and consistency by design.',
  bullets: [
    'Single source of truth',
    'Automated rule enforcement',
    'Consistent public and internal data',
  ],
  plans: [
    {
      tier: 'Basic' as PlanTier,
      features: [
        'Centralized data model',
        'Secure access',
      ],
    },
    {
      tier: 'Pro' as PlanTier,
      features: [
        'Enhanced validation',
      ],
    },
    {
      tier: 'Federation' as PlanTier,
      features: [
        'Governance-level controls',
      ],
    },
  ],
}

