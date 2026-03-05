import Container from '@/components/ui/container';
import { 
  Settings2, 
  CalendarDays, 
  Activity, 
  Globe, 
  ShieldCheck, 
  Database, 
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="selection:bg-primary/10">
      {/* HERO: The Proof of Seriousness */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />
        <Container>
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              The engine behind <br />
              <span className="text-primary">successful seasons.</span>
            </h1>
            <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Elenem isn't just a website—it’s an operating system for sports 
              organizations. From the first registration to the final trophy, 
              we ensure your data stays authoritative and undisputed.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-sm font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Official Authority
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-sm font-bold text-slate-700">
                  <Activity className="w-4 h-4 text-primary" />
                  Real-time Automation
               </div>
            </div>
          </div>
        </Container>
      </section>
      {/* SECTION 1: LEAGUE CONFIGURATION */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* TEXT: The "Proof of Seriousness" */}
            <div className="max-w-xl order-2 lg:order-1">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Settings2 className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 1: Setup the league
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Built around how leagues <br /> actually operate
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Every league has its own format, rules, and structure. Elenem is 
                configured to match your competition before the season starts, 
                so the system enforces the rules consistently from kickoff to 
                final matchday.
              </p>

              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  'Team & season configuration',
                  'Competition formats & schedules',
                  'League rules defined once',
                  'Season-ready structure'
                ].map((point, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Rule-Builder Skeleton */}
            <div className="order-1 lg:order-2">
              <div className="relative p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-inner">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  
                  {/* Mock Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="h-2 w-32 bg-slate-200 rounded-full" />
                    <div className="h-6 w-16 bg-primary/10 rounded-full border border-primary/20" />
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Abstract Rule 1: Points Logic */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-2">
                          <div className="h-3 w-40 bg-slate-900 rounded-full" />
                          <div className="h-2 w-24 bg-slate-300 rounded-full" />
                        </div>
                        <div className="h-8 w-12 bg-slate-50 border rounded-md" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-10 rounded-lg border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
                          <div className="h-2 w-4 bg-primary/40 rounded-full" />
                        </div>
                        <div className="h-10 rounded-lg border border-slate-100 bg-slate-50" />
                        <div className="h-10 rounded-lg border border-slate-100 bg-slate-50" />
                      </div>
                    </div>

                    {/* Abstract Rule 2: Tie-Breaker Hierarchy */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <div className="h-3 w-48 bg-slate-900 rounded-full" />
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400">0{i}</span>
                            <div className="h-2 flex-1 bg-slate-200 rounded-full" />
                            <div className="w-4 h-4 rounded-full bg-white border border-slate-200" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating "Status" Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                  <span className="text-xs font-bold uppercase">System Updated</span>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 2: FIXTURES & MATCH MANAGEMENT */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* VISUAL: The Conflict Detection Calendar */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="h-4 w-40 bg-slate-900 rounded-full" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100" />
                    <div className="w-8 h-8 rounded-lg bg-slate-100" />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Standard Match Entry */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="h-2 w-12 bg-slate-300 rounded-full" />
                    <div className="flex-1 h-2 bg-slate-200 rounded-full" />
                    <div className="w-16 h-6 rounded bg-primary/10 border border-primary/20" />
                  </div>

                  {/* THE "CONFLICT" HIGHLIGHT */}
                  <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-12 bg-red-300 rounded-full" />
                      <div className="flex-1 h-2 bg-red-200 rounded-full" />
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                    </div>
                    <div className="pl-16">
                      <div className="h-1.5 w-32 bg-red-200/60 rounded-full" />
                    </div>
                    {/* Alert Tooltip */}
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm border border-red-100 text-[9px] font-black text-red-600 uppercase tracking-tighter">
                      Venue Overlap Detected
                    </div>
                  </div>

                  {/* Standard Match Entry */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-4 opacity-50">
                    <div className="h-2 w-12 bg-slate-300 rounded-full" />
                    <div className="flex-1 h-2 bg-slate-200 rounded-full" />
                    <div className="w-16 h-6 rounded bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* Status Tag */}
              <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg">
                Master Calendar Syncing...
              </div>
            </div>

            {/* TEXT: The "Source of Truth" */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-primary mb-4">
                <CalendarDays className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 2: Manage matches
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Scheduling with flexibility <br /> and precision
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elenem centralizes your entire season into one <strong>"source of truth."</strong> 
                Change a kickoff time, reschedule, or enter results in seconds — 
                every club, official, and fan stays synced automatically.
              </p>

              <ul className="grid gap-y-3">
                {[
                  'Automatic venue & timing conflict detection',
                  'Update once; sync everywhere instantly',
                  'Capture team, player, and sport-specific stats',
                  'Frictionless game rescheduling tools'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 3: AUTOMATIC STANDINGS & ANALYTICS */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* TEXT: The "Logic Engine" */}
            <div className="max-w-xl order-2 lg:order-1">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Activity className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 3: Ensure correctness
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Standings calculated <br /> automatically — every time
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elenem’s logic engine instantly recalculates your entire league’s 
                hierarchy the moment a score is saved. From tie-breakers to player 
                leaderboards, your data remains authoritative, transparent, and undisputed.
              </p>

              <ul className="grid gap-y-3">
                {[
                  'Automatic points, GD, and tie-breaker enforcement',
                  'Real-time table updates for teams and fans',
                  'Aggregate team and player stats (Scorers, MVPs)',
                  'Error-free source of truth for league history'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Low-Contrast Standing Table */}
            <div className="order-1 lg:order-2">
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-slate-50 border-b border-slate-100">
                    <div className="col-span-1 h-2 bg-slate-200 rounded-full" />
                    <div className="col-span-5 h-2 bg-slate-200 rounded-full" />
                    <div className="col-span-2 h-2 bg-slate-200 rounded-full" />
                    <div className="col-span-2 h-2 bg-slate-200 rounded-full" />
                    <div className="col-span-2 h-2 bg-slate-200 rounded-full" />
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-slate-50">
                    {[
                      { trend: 'up', color: 'text-green-500' },
                      { trend: 'stay', color: 'text-slate-300' },
                      { trend: 'down', color: 'text-red-500' },
                      { trend: 'stay', color: 'text-slate-300' }
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-6 py-4 items-center">
                        <div className="col-span-1 flex items-center gap-1">
                          <span className={`text-[10px] font-bold ${row.color}`}>
                            {row.trend === 'up' && '▲'}
                            {row.trend === 'down' && '▼'}
                            {row.trend === 'stay' && '•'}
                          </span>
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-5 h-5 rounded bg-slate-100" />
                          <div className="h-2 w-24 bg-slate-100 rounded-full" />
                        </div>
                        <div className="col-span-2 h-2 bg-slate-50 rounded-full" />
                        <div className="col-span-2 h-2 bg-slate-50 rounded-full" />
                        <div className="col-span-2 h-2 bg-slate-900/5 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Rules Applied: Points {'>'} GD {'>'} Head-to-Head
                </p>
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 4: OFFICIAL PUBLIC PORTAL */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* VISUAL: The Mobile-First Fan Portal */}
            <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              
              {/* Smartphone Mockup */}
              <div className="relative w-full max-w-[280px] aspect-[9/19] bg-slate-800 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-700">
                <div className="bg-white h-full w-full rounded-[2.2rem] overflow-hidden flex flex-col">
                  
                  {/* Status Bar */}
                  <div className="h-6 w-full bg-white flex justify-center items-end pb-1">
                    <div className="w-12 h-1 bg-slate-100 rounded-full" />
                  </div>

                  {/* Public App Interface */}
                  <div className="p-4 space-y-5">
                    {/* Header/Logo Skeleton */}
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-20 bg-slate-100 rounded-full" />
                      <div className="w-6 h-6 rounded-full bg-primary/10" />
                    </div>

                    {/* Match Card (The "Live" Experience) */}
                    <div className="space-y-3">
                      <div className="h-2 w-16 bg-slate-200 rounded-full" />
                      <div className="p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100" />
                            <div className="h-1.5 w-10 bg-slate-200 rounded-full" />
                          </div>
                          <div className="text-xl font-black text-slate-900 italic">2 - 1</div>
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100" />
                            <div className="h-1.5 w-10 bg-slate-200 rounded-full" />
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-green-50 rounded-full border border-green-100" />
                      </div>
                    </div>

                    {/* Mini Standings Sneak-Peak */}
                    <div className="space-y-3 pt-2">
                      <div className="h-2 w-24 bg-slate-200 rounded-full" />
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50">
                          <div className="h-1.5 w-3 bg-slate-200 rounded-full" />
                          <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                          <div className="h-1.5 w-4 bg-slate-900/10 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nav Bar */}
                  <div className="mt-auto h-12 bg-slate-50 border-t border-slate-100 flex justify-around items-center px-6">
                    <div className="w-4 h-4 rounded bg-primary/20" />
                    <div className="w-4 h-4 rounded bg-slate-200" />
                    <div className="w-4 h-4 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
              
              {/* Floating "Official" Label */}
              <div className="absolute top-12 -right-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-xl">
                Public Portal
              </div>
            </div>

            {/* TEXT: The "Fan Experience" */}
            <div className="max-w-xl order-1 lg:order-2">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Globe className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold text-primary-foreground/60">
                  Step 4: Publish officially
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-white tracking-tight mb-6">
                One official place <br /> for fans and clubs
              </h2>
              
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Elenem provides a public league portal where fixtures, standings, 
                and results are always up to date. Information is published once 
                and remains accessible to everyone.
              </p>

              <ul className="grid gap-y-4">
                {[
                  'Custom public league website',
                  'Schedules and tables always in sync',
                  'Designed for mobile devices by default',
                  'Replace informal WhatsApp channels with authority'
                ].map((point, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-primary" />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 5: IDENTITY & OWNERSHIP */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* TEXT: The "White-Label" Pitch */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-primary mb-4">
                <ShieldCheck className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 5: Own your identity
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Your League. Your Brand. <br /> Your Design.
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We provide the engine, but you keep the keys. You launch a clean 
                digital home that lives on your own domain, maintains your identity 
                and reflects your brand — a premium experience that feels custom-built.
              </p>

              <ul className="grid gap-y-3">
                {[
                  'Run your league on your own URL (e.g., my-league.com)',
                  'Elenem works in the background; users only see you',
                  'Custom logos, colors, and themes to match your identity',
                  'Launch-ready website designs with a custom feel'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Domain & Brand Skeleton */}
            <div className="relative">
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                
                {/* Browser Address Bar Mockup */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded px-3 py-1 flex items-center gap-2">
                      <span className="text-[10px] text-green-500">🔒</span>
                      <span className="text-[11px] font-medium text-slate-600 tracking-tight">https://your-official-league.com</span>
                    </div>
                  </div>
                  <div className="h-24 bg-white p-4 flex items-center justify-center">
                    <div className="w-12 h-12 rounded bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-300">LOGO</div>
                  </div>
                </div>

                {/* Brand Customization Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="h-2 w-16 bg-slate-200 rounded-full" />
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary shadow-sm" />
                      <div className="w-6 h-6 rounded-full bg-slate-900 shadow-sm" />
                      <div className="w-6 h-6 rounded-full bg-slate-100 shadow-sm border border-slate-200" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center gap-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                    <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Tag */}
              <div className="absolute -bottom-4 right-8 bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl">
                100% White-Label
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 6: ADMINISTRATION & CONTROL */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* VISUAL: The Admin Sidebar vs. Public Toggle */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex gap-4">
                  
                  {/* Mock Sidebar (The Control) */}
                  <div className="w-20 sm:w-32 bg-slate-900 rounded-2xl p-4 space-y-4">
                    <div className="w-8 h-8 bg-primary rounded-lg mb-6" />
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className={`h-1.5 rounded-full ${i === 1 ? 'bg-white w-full' : 'bg-white/20 w-3/4'}`} />
                      </div>
                    ))}
                    <div className="pt-12">
                      <div className="h-1.5 w-1/2 bg-red-400/40 rounded-full" />
                    </div>
                  </div>

                  {/* Main Admin Panel Skeleton */}
                  <div className="flex-1 py-2 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div className="h-3 w-32 bg-slate-200 rounded-full" />
                      <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-100" />
                        <div className="w-4 h-4 rounded-full bg-slate-100" />
                      </div>
                    </div>

                    {/* Secure Settings List */}
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="h-2 w-24 bg-slate-200 rounded-full" />
                          <div className="w-8 h-4 bg-slate-200 rounded-full relative">
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${i === 1 ? 'right-0.5' : 'left-0.5'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating "Role" Indicator */}
              <div className="absolute top-10 -right-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Admin Access Only
              </div>
            </div>

            {/* TEXT: The "Back-Office" Pitch */}
            <div className="max-w-xl order-1 lg:order-2">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Database className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold text-primary">
                  Step 6: Operate securely
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Simple administration, <br /> focused on essentials
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                League officials manage everything from a secure dashboard 
                hosted on <strong>elenem.site</strong>. The system keeps management 
                separate from the public view while remaining easy to operate.
              </p>

              <ul className="grid gap-y-3">
                {[
                  'Secure, encrypted access for officials',
                  'Centralized multi-level management',
                  'Clear separation of internal and public data',
                  'Action logging for error detection and accountability'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 7: RELIABILITY & SECURITY */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* TEXT: The "Safety" Pitch */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-primary mb-4">
                <ShieldCheck className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 7: Reliability by design
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Reliable by design
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                League data is stored centrally and handled consistently. 
                Elenem reduces dependency on personal files, spreadsheets, 
                and individual devices. No more "who has the latest version?"
              </p>

              <ul className="grid gap-y-3">
                {[
                  'Centralized, secure data storage',
                  'Multi-layer encrypted access',
                  'Regular system and security updates',
                  'Consistent availability throughout the season'
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Centralized Data Vault */}
            <div className="relative">
              <div className="bg-slate-50 rounded-[2.5rem] p-12 border border-slate-100 flex items-center justify-center">
                
                {/* The "Vault" Skeleton */}
                <div className="relative w-48 h-48 bg-white rounded-3xl shadow-xl border border-slate-200 flex items-center justify-center">
                  <div className="space-y-3 w-2/3">
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                    <div className="h-2 w-full bg-primary/20 rounded-full" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                  </div>
                  
                  {/* Pulsing Sync Rings */}
                  <div className="absolute -inset-4 border-2 border-primary/10 rounded-[2.5rem] animate-pulse" />
                  <div className="absolute -inset-8 border border-slate-200/50 rounded-[3rem]" />
                </div>

                {/* Connected "Device" Skeletons (Representing Tablets/Mobiles syncing) */}
                <div className="absolute top-8 right-8 w-12 h-16 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                  <div className="w-6 h-1 bg-slate-100 rounded-full" />
                </div>
                <div className="absolute bottom-12 left-8 w-16 h-12 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-100 rounded-full" />
                </div>
              </div>

              {/* Floating Security Badge */}
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 bg-green-500 text-white p-3 rounded-full shadow-2xl">
                <ShieldCheck size={24} />
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 8: GROWING WITH YOUR LEAGUE */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* VISUAL: The Scalability Staircase */}
            <div className="relative order-2 lg:order-1">
              <div className="flex flex-col gap-4">
                
                {/* Level 3: Federation / Large Org */}
                <div className="ml-auto w-4/5 p-4 bg-white rounded-2xl border-l-4 border-primary shadow-sm flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-2 w-32 bg-slate-900 rounded-full" />
                    <div className="h-1.5 w-24 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
                    ))}
                  </div>
                </div>

                {/* Level 2: Growing League */}
                <div className="mx-auto w-4/5 p-4 bg-white rounded-2xl border-l-4 border-primary/40 shadow-sm flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center text-primary italic font-black text-[10px]">2</div>
                  <div className="space-y-2">
                    <div className="h-2 w-40 bg-slate-900 rounded-full" />
                    <div className="h-1.5 w-16 bg-slate-200 rounded-full" />
                  </div>
                </div>

                {/* Level 1: Small/Starting League */}
                <div className="mr-auto w-4/5 p-4 bg-slate-900 rounded-2xl shadow-xl flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-28 bg-white rounded-full" />
                    <div className="h-1.5 w-20 bg-white/20 rounded-full" />
                  </div>
                </div>

              </div>
              
              {/* Abstract "Future" Arrow */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-300">
                <ArrowRight className="w-8 h-8 rotate-[-90deg] animate-bounce" />
              </div>
            </div>

            {/* TEXT: The "Scalability" Pitch */}
            <div className="max-w-xl order-1 lg:order-2">
              <div className="flex items-center gap-2 text-primary mb-4">
                <TrendingUp className="w-5 h-5" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 8: Grow over time
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Designed to grow with <br /> your league
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elenem starts with the core needs of league management and evolves 
                as your organization grows. Additional workflows, configurations, 
                and support are introduced based on real operational requirements.
              </p>

              <div className="space-y-6">
                <div className="p-4 border-l-2 border-slate-200">
                  <p className="text-sm font-bold text-slate-900">Small leagues start simple.</p>
                  <p className="text-xs text-slate-500 mt-1">Focus on core standings and match schedules.</p>
                </div>
                <div className="p-4 border-l-2 border-slate-200">
                  <p className="text-sm font-bold text-slate-900">Growing leagues gain structure.</p>
                  <p className="text-xs text-slate-500 mt-1">Automated scheduling and venue management.</p>
                </div>
                <div className="p-4 border-l-2 border-primary">
                  <p className="text-sm font-bold text-slate-900">Larger organizations collaborate.</p>
                  <p className="text-xs text-slate-500 mt-1">Multi-league governance and custom federation tools.</p>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* FINAL CTA */}
      <section className="py-12">
        <Container>
          <div className="relative isolate overflow-hidden  px-6 py-12 sm:px-24 sm:py-24 text-center">
            {/* Background Decorative Elements - Subtle "System Grid" */}
            <div className="absolute inset-0 -z-10 opacity-20 [mask-image:radial-gradient(closest-side,white,transparent)]">
              <svg className="h-full w-full" fill="none">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 40V.5H40" stroke="black" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Ready for your next season?
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted">
                Stop improvising with spreadsheets and group chats. 
                Run your league with a professional system built for sport.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/contact" className="w-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-white font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                  Request a demo
                </Link>
                <Link href="/pricing" className="w-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  View pricing
                </Link>
              </div>
            </div>
            {/* Subtle "Trusted By" label to lower the barrier */}
            <p className="mt-12 text-xs font-medium uppercase tracking-[0.2em] text-slate-900">
              Configuration and onboarding included
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}