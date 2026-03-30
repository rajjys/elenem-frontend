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
  CheckCircle2,
  UserCircle,
  Users,
  Menu,
  ShieldUser,
  Plus,
  Lock,
  Trophy,
  User,
  Shield,
  LayoutDashboard,
  Calendar,
  Users2,
  ShieldAlert,
  Settings,
  Terminal,
  MonitorCheck,
  UserPlus,
  Palette,
  CloudDownload,
  RefreshCcw,
  DatabaseZap,
  Layers,
  PlusCircle,
  Zap,
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
            <div className="flex items-center gap-2 text-primary mb-6">
              <Settings2 className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Solution & Features</p>
            </div>
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
      {/* THE BRIDGE: THE ARCHITECTURE */}
      <section className="pb-12">
        <Container>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden">
            {/* Subtle background text for "Official" feel */}
            <div className="absolute top-4 right-8 text-[120px] font-black opacity-[0.03] select-none pointer-events-none">
              FLOW
            </div>

            <div className="relative z-10 grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="text-primary-light font-bold mb-2">01. Setup</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Translate your league’s unique rules and structure into a 
                  digital foundation that enforces consistency.
                </p>
              </div>
              <div>
                <h3 className="text-primary-light font-bold mb-2">02. Execute</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Manage matches and results with a system that detects 
                  conflicts and updates standings in real-time.
                </p>
              </div>
              <div>
                <h3 className="text-primary-light font-bold mb-2">03. Scale</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Own your brand, grow your fan base, and maintain 
                  an undisputed official record of every season.
                </p>
              </div>
            </div>
            
            {/* Visual Connector Line (Desktop Only) */}
            <div className="hidden md:block mt-12 h-px w-full bg-gradient-to-r from-primary/50 via-slate-700 to-transparent" />
          </div>
        </Container>
      </section>
      {/* SECTION 1: LEAGUE CONFIGURATION */}
      <section className="py-16 bg-white"> {/* Tighter vertical padding */}
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-start"> {/* Reduced gap, aligned to start */}
            
            {/* TEXT: The "Proof of Seriousness" */}
            <div className="max-w-xl">
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

              <ul className="grid gap-y-3">
                {[
                  { label: 'Structure', desc: 'Define divisions, teams, and seasons.' },
                  { label: 'Rules', desc: 'Set points for wins, draws, and specific bonuses.' },
                  { label: 'Tie-Breakers', desc: 'Most Wins, GD, Goals For, or H2H.' },
                  { label: 'Authority', desc: 'One central ruleset enforced across the system.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{item.label}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The "Operational Window" Skeleton */}
            <div className="">
              <div className="bg-slate-50 rounded-3xl p-3 border border-slate-100 shadow-inner"> {/* Tightened outer container */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  
                  {/* macOS Style Window Header: Establishing "Real Software" Feel */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200/70" /> {/* Close */}
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200/70" /> {/* Minimize */}
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200/70" /> {/* Expand */}
                    </div>
                    <div className="flex-1 text-center pr-10"> {/* Offset for balance */}
                      <div className="h-2 w-28 bg-slate-200 rounded-full mx-auto" /> {/* Window Title Placeholder */}
                    </div>
                  </div>

                  {/* Content: Tightened vertical flow (divide-y ensures clean logic breaks) */}
                  <div className="divide-y divide-slate-100">

                    {/* Step 1: Points Logic */}
                    <div className="p-3 space-y-4">
                      <div className="h-2 w-24 bg-slate-300 rounded-full mb-3" />
                      <div className="grid grid-cols-3 gap-3"> {/* Use grid for strict 3-col layout */}
                        {[
                          { val: '3', sub: 'Win' },
                          { val: '1', sub: 'Draw' },
                          { val: '0', sub: 'Loss' }
                        ].map((item, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.sub}</div>
                            <div className="text-sm font-black text-slate-900 italic">{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Tie-Breaker Hierarchy */}
                    <div className="p-5 space-y-4 pt-4"> {/* Slight pt-4 to give breathing room after divide-y */}
                      <div className="h-2 w-32 bg-slate-300 rounded-full mb-4" />
                      <div className="space-y-3">
                        {[
                          { label: 'Goal Difference', active: true },
                          { label: 'Goals Scored', active: false },
                          { label: 'Head-to-Head', active: false }
                        ].map((rule, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                            <div className="flex items-center gap-3">
                              <div className="text-slate-300 font-mono flex gap-1"><Menu className='w-4 h-4'/> 0{i+1}</div>
                              <span className={rule.active ? 'text-slate-900' : 'text-slate-400'}>{rule.label}</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full border-2 ${rule.active ? 'bg-primary border-primary shadow-inner' : 'border-slate-200 bg-white'}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Team Registry (Using Lucide Users icon) */}
                    <div className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 w-16 bg-slate-300 rounded-full" />
                          <div className='flex justify-between'>
                            <div className="h-1.5 w-6 bg-slate-200 rounded-full" />
                            <div className="h-1.5 w-5 bg-slate-200 rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div className="flex -space-x-2.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200/70" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">+12</div>
                      </div>
                    </div>

                    {/* Step 4: Athlete Registry (Using Lucide User icon) */}
                    <div className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                          <ShieldUser className="w-5.5 h-5.5 text-primary-light" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 w-20 bg-slate-900 rounded-full" />
                          <div className="h-1.5 w-12 bg-slate-700 rounded-full" />
                        </div>
                      </div>
                      <div className="flex -space-x-3.5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200/70" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-slate-50 bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">+80</div>
                      </div>
                    </div>

                  </div> {/* End Divide-y */}
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 2: FIXTURES & MATCH MANAGEMENT */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            
            {/* TEXT FIRST ON MOBILE */}
            <div className="max-w-xl pt-2 order-1 lg:order-2">
              <div className="flex items-center gap-2 text-primary mb-3">
                <CalendarDays className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 02: Manage matches
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-5 leading-[1.15]">
                Scheduling with flexibility <br /> and precision
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elenem centralizes your entire season into one <strong>"source of truth."</strong> 
                Reschedule games, enter results, or track live stats in seconds — 
                every club, official, and fan stays synced automatically.
              </p>

              <ul className="grid gap-y-3">
                {[
                  { label: 'Conflicts', desc: 'Auto-detect venue and timing overlaps.' },
                  { label: 'Real-time', desc: 'Updates reflect across your site instantly.' },
                  { label: 'Stats', desc: 'Capture goals, fouls, and MVPs from match reports.' },
                  { label: 'Master Calendar', desc: 'Rule out duplicate schedules and human error.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{item.label}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL SECOND ON MOBILE */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-slate-200/50 rounded-3xl p-4 border border-slate-200 shadow-inner">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  
                  {/* macOS Style Window Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="flex-1 text-center pr-10">
                      <div className="h-1.5 w-20 bg-slate-200 rounded-full mx-auto" />
                    </div>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* Header: Compact Planning */}
                    <div className="flex justify-between items-center">
                      <div className="h-2.5 w-24 bg-slate-900 rounded-full" />
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </div>

                    {/* Part A: Calendar with Skeleton Weekdays */}
                    <div>
                      {/* Skeleton weekday row */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="h-1 w-8 bg-slate-200 rounded mx-auto" />
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 pb-2 border-b border-slate-50">
                        {Array.from({ length: 28 }).map((_, i) => {
                          const gameDays = [2,4,7,10,12,15,18,21,24,26]; // 10 gamedays
                          return (
                            <div 
                              key={i} 
                              className="max-w-18 rounded-sm border border-slate-200 bg-slate-50 flex flex-col items-center justify-start py-1.5"
                            >
                              {/* Date number */}
                              <span className="text-[10px] text-slate-400 leading-none">{i+1}</span>
                              
                              {/* Game badge below date */}
                              {gameDays.includes(i) && (
                                <span className="mt-1 text-[9px] font-bold text-primary bg-primary/10 rounded px-1">
                                  {Math.floor(Math.random() * 3) + 1}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part B: Compact Match Feed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="h-1.5 w-16 bg-slate-200 rounded-full" />
                      </div>

                      {/* Live Match Card with softer contrast */}
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="h-1 w-10 bg-slate-200 rounded-full" />
                          <div className="px-1.5 py-0.5 rounded bg-green-400/20 text-green-900/60 text-[8px] font-bold tracking-widest italic">82'</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 shrink-0" />
                            <div className="h-1.5 w-full bg-slate-300 rounded-full max-w-[40px]" />
                          </div>
                          <div className="text-sm font-bold italic tabular-nums tracking-tighter text-slate-500">3 - 2</div>
                          <div className="flex-1 flex items-center justify-end gap-2">
                            <div className="h-1.5 w-full bg-slate-300 rounded-full max-w-[40px]" />
                            <div className="w-5 h-5 rounded-full bg-slate-100 shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* SECTION 3: AUTOMATIC STANDINGS & ANALYTICS */}
      <section className="py-12 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            
            {/* TEXT: The Logic Engine */}
            <div className="max-w-xl pt-2">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Activity className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 03: Ensure correctness
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-5 leading-[1.15]">
                Standings calculated <br /> automatically — every time
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elenem’s logic engine instantly recalculates your entire league’s 
                hierarchy the moment a score is saved. From tie-breakers to player 
                leaderboards, your data remains authoritative, transparent, and undisputed.
              </p>

              <ul className="grid gap-y-3">
                {[
                  { label: 'Automation', desc: 'Points, GD, and tie-breakers applied instantly.' },
                  { label: 'Transparency', desc: 'The table reflects the new reality for teams and fans.' },
                  { label: 'Player Stats', desc: 'Aggregate Top Scorers, MVPs, and Clean Sheets.' },
                  { label: 'History', desc: 'Maintain one undisputed source of truth for the season.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{item.label}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Professional Standings Table */}
            <div className="">
              <div className="bg-slate-100/50 rounded-3xl p-4 border border-slate-200 shadow-inner">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  
                  {/* macOS Style Window Header: Consistent with Step 1 & 2 */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="flex-1 text-center pr-10">
                      <div className="h-1.5 w-24 bg-slate-200 rounded-full mx-auto" />
                    </div>
                  </div>

                  {/* Table Header: Mimicking La Liga / Google Search density */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="col-span-1 text-[9px] font-black text-slate-400 uppercase">#</div>
                    <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase">Team</div>
                    <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase text-center">PL</div>
                    <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase text-center">GD</div>
                    <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase text-center">PTS</div>
                  </div>

                  {/* Table Rows: Max 7 rows, abstract but meaningful */}
                  <div className="divide-y divide-slate-50">
                    {[
                      { rank: 1, trend: 'stay', pts: 42, gd: '+18' },
                      { rank: 2, trend: 'up', pts: 40, gd: '+12' },
                      { rank: 3, trend: 'down', pts: 39, gd: '+14' },
                      { rank: 4, trend: 'stay', pts: 35, gd: '+8' },
                      { rank: 5, trend: 'stay', pts: 31, gd: '+2' },
                      { rank: 6, trend: 'up', pts: 28, gd: '-1' },
                      { rank: 7, trend: 'stay', pts: 25, gd: '-4' }
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-slate-50/50 transition-colors">
                        {/* Rank & Trend */}
                        <div className="col-span-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400">{row.rank}</span>
                          <div className={`w-1 h-1 rounded-full ${
                            row.trend === 'up' ? 'bg-green-200' : 
                            row.trend === 'down' ? 'bg-red-200' : 'bg-slate-200'
                          }`} />
                        </div>
                        
                        {/* Team: Round Logo + Name Skeleton */}
                        <div className="col-span-5 flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
                          <div className="h-1.5 w-full bg-slate-100 rounded-full max-w-[60px]" />
                        </div>

                        {/* Stats: Played, Goal Diff, Points */}
                        <div className="col-span-2 text-center text-[10px] font-medium text-slate-400 tabular-nums">18</div>
                        <div className="col-span-2 text-center text-[10px] font-medium text-slate-400 tabular-nums">{row.gd}</div>
                        <div className="col-span-2 text-center text-[10px] font-black text-slate-400 tabular-nums">{row.pts}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subtle Footer: Logic Enforcement Badge */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <div className="px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-200" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Updated 3 mins ago</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 4: OFFICIAL PUBLIC PORTAL */}
      <section className="py-12 lg:py-2 bg-slate-950 text-white overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">           
            {/* VISUAL: The Mobile Browser Portal */}
            <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
              {/* Subtle Glow to make the phone pop against dark bg */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
              
              {/* Smartphone Mockup with Browser UI */}
              <div className="relative w-full max-w-[260px] aspect-[9/19] bg-slate-800 rounded-[2.5rem] p-2.5 shadow-2xl border border-slate-700">
                <div className="bg-white h-full w-full rounded-[2rem] overflow-hidden flex flex-col">
                  
                  {/* Mobile Browser URL Bar */}
                  <div className="px-4 pt-4 pb-2 bg-slate-50 border-b border-slate-100">
                    <div className="bg-white border border-slate-200 rounded-full py-1 px-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full" /> {/* URL: yourleague.com */}
                    </div>
                  </div>

                  {/* Public Website Content */}
                  <div className="flex-1 overflow-hidden p-4 space-y-5">
                    {/* Custom Branding Header */}
                    <div className="flex justify-between items-center px-1">
                      <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white italic">L</div>
                      <div className="flex gap-2">
                          <div className="w-4 h-4 rounded-full bg-slate-100" />
                          <div className="w-4 h-4 rounded-full bg-slate-100" />
                      </div>
                    </div>

                    {/* Featured "Next Match" Card */}
                    <div className="space-y-2">
                      <div className="h-1.5 w-16 bg-slate-200 rounded-full ml-1" />
                      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-1 w-8 bg-white/20 rounded-full" />
                          </div>
                          <div className="text-sm font-black italic tracking-tighter text-primary">VS</div>
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-1 w-8 bg-white/20 rounded-full" />
                          </div>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 w-1/3 bg-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Match Day Schedule List (Multiple Games) */}
                    <div className="space-y-3">
                      <div className="h-1.5 w-24 bg-slate-200 rounded-full ml-1" />
                      {[1, 2].map((i) => (
                        <div key={i} className="p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-slate-50 border border-slate-100" />
                            <div className="h-1 w-10 bg-slate-200 rounded-full" />
                          </div>
                          <div className="h-1.5 w-6 bg-slate-900 rounded-full" />
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-10 bg-slate-200 rounded-full" />
                            <div className="w-4 h-4 rounded bg-slate-50 border border-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mini Table Snippet */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="h-1 w-full bg-slate-200 rounded-full mb-2" />
                      <div className="h-1 w-2/3 bg-slate-200 rounded-full" />
                    </div>
                  </div>

                  {/* Simple Mobile Nav */}
                  <div className="h-12 border-t border-slate-100 flex justify-around items-center px-6">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* Floating Tag: "Fan View" */}
              <div className="absolute top-16 -right-6 bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-2xl">
                Live Fan Portal
              </div>
            </div>

            {/* TEXT: The "Fan Experience" */}
            <div className="max-w-xl order-1 lg:order-2 pt-4">
              <div className="flex items-center gap-2 text-primary-light mb-3">
                <Globe className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 04: Publish officially
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-white tracking-tight mb-6 leading-[1.15]">
                One official place <br /> for fans and clubs
              </h2>
              
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Elenem provides a dedicated public portal where fixtures, standings, 
                and results are always live. Information is published once 
                and remains accessible to everyone on any device.
              </p>

              <ul className="grid gap-y-4">
                {[
                  { label: 'Custom URL', desc: 'Host your league on your own domain (yourleague.com).' },
                  { label: 'Mobile-First', desc: 'Optimized for players and fans checking scores on the pitch.' },
                  { label: 'Automatic Sync', desc: 'Changes in the admin reflect on the public site instantly.' },
                  { label: 'Brand Authority', desc: 'Replace informal WhatsApp chats with an official home.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-slate-300">
                      <span className="font-bold text-white">{item.label}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 5: IDENTITY & OWNERSHIP */}
      <section className="py-16 bg-white overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* TEXT: The "White-Label" Pitch */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-primary mb-3">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 05: Own your identity
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15]">
                Your League. Your Brand. <br /> Your Design.
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed text-balance">
                We provide the engine, but you keep the keys. Launch a clean 
                digital home that lives on your own domain and reflects your 
                unique identity — a premium experience that feels custom-built.
              </p>

              <ul className="grid gap-y-3">
                {[
                  { label: 'Custom Domain', desc: 'Run everything on your own URL (e.g., league.com).' },
                  { label: 'White-Label', desc: 'Elenem works in the background; fans only see you.' },
                  { label: 'Theming', desc: 'Custom logos, colors, and fonts to match your brand.' },
                  { label: 'Ownership', desc: 'Full control over your data and public presence.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p><span className="font-bold text-slate-900">{item.label}:</span> {item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: Staggered "Branded" Windows */}
            <div className="relative">
              <div className="flex flex-col gap-6 scale-90 sm:scale-100 origin-center">
                
                {/* WINDOW 1: The "Elite League" (Dark/Neon) */}
                <div className="w-full max-w-[360px] bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden self-start">
                  {/* Header */}
                  <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 flex gap-2 items-center">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-full py-0.5 px-3 flex items-center gap-2">
                        <Lock size={8} className="text-green-500/70" />
                        <span className="text-[9px] text-slate-400">https://<strong>elite-league.app</strong></span>
                      </div>
                  </div>
                  
                  {/* Navbar: Tightened and Realistic */}
                  <div className="px-4 py-1 flex justify-between items-center border-b border-slate-800/50 bg-slate-900">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary-light opacity-40" />
                        <div className="h-1.5 w-12 bg-white/60 rounded-full" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-5 h-1 bg-white/60 rounded-full" />
                            <div className="w-5 h-1 bg-white/20 rounded-full" />
                            <div className="w-5 h-1 bg-white/20 rounded-full" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/40 flex items-center justify-center">
                            <User size={10} className="text-white/40" />
                        </div>
                      </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-4 space-y-3">
                      <div className="h-12 w-full bg-slate-950 rounded-lg border border-slate-800/50" />
                  </div>
                </div>

                {/* WINDOW 2: The "Community Cup" (Light/Classic) */}
                <div className="w-full max-w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden self-end -mt-12 relative z-10">
                  {/* Header */}
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex gap-2 items-center">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex-1 bg-white border border-slate-200 rounded-full py-0.5 px-3 flex items-center gap-2">
                        <Lock size={8} className="text-green-500" />
                        <span className="text-[9px] font-medium text-slate-500">https://<strong className='text-slate-800'>community-cup.com</strong></span>
                      </div>
                  </div>

                  {/* Navbar: Tightened and Realistic */}
                  <div className="px-4 py-1 flex justify-between items-center border-b border-slate-50 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-primary/5 flex items-center justify-center border border-primary/10">
                            <Shield className="w-3.5 h-3.5 text-primary opacity-40" />
                        </div>
                        <div className="h-1.5 w-16 bg-slate-900/60 rounded-full" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-3">
                            <div className="w-6 h-1 bg-slate-900/60 rounded-full" />
                            <div className="w-6 h-1 bg-slate-300 rounded-full" />
                            <div className="w-6 h-1 bg-slate-300 rounded-full" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-400 flex items-center justify-center">
                            <User size={10} className="text-slate-400" />
                        </div>
                      </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 space-y-3">
                      <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 6: ADMINISTRATION & CONTROL */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* VISUAL: The Production Dashboard Cockpit */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-slate-200/50 rounded-[2.5rem] p-4 border border-slate-200 shadow-inner">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[380px]">
                  
                  {/* macOS Window Header (Consistent Style) */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="flex-1 text-center pr-10">
                      <div className="h-1.5 w-24 bg-slate-200 rounded-full mx-auto" />
                    </div>
                  </div>
                  <div className="flex flex-1">
                    {/* Sidebar: The Navigation Rail */}
                    <div className="w-16 border-r border-slate-100 bg-slate-50/30 flex flex-col items-center py-6 gap-6">
                      <div className="w-8 h-8 rounded-lg bg-slate-400 flex items-center justify-center text-white text-[10px] font-black">E</div>
                      <div className="flex flex-col gap-4">
                        {[LayoutDashboard, Calendar, Users2, ShieldAlert, Settings].map((Icon, i) => (
                          <Icon key={i} size={18} className={i === 0 ? "text-slate-600" : "text-slate-300"} />
                        ))}
                      </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 p-6 space-y-6">
                      {/* Top Metrics: High-Level Pulse */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Active Teams', val: '24' },
                          { label: 'Live Games', val: '03' },
                          { label: 'Players', val: '34' },
                          { label: 'Open Issues', val: '01' }
                        ].map((stat, i) => (
                          <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white">
                            <div className="h-1 w-5 md:w-10 bg-slate-300 rounded-full mb-2" />
                            <div className="text-sm font-black text-slate-400 italic tracking-tighter">{stat.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Task Feed: Actionable Items */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="h-2 w-24 bg-slate-400 rounded-full" />
                          <div className="h-1.5 w-12 bg-slate-300 rounded-full" />
                        </div>

                        {[
                          { task: 'Match Approval', type: 'Result', color: 'bg-blue-200' },
                          { task: 'Venue Conflict', type: 'Alert', color: 'bg-red-200' },
                          { task: 'Referee Assign', type: 'Schedule', color: 'bg-slate-200' },
                          { task: 'Stadium Validation', type: 'Schedule', color: 'bg-slate-200' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors bg-white">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                <div className="space-y-1">
                                  <div className="h-2 w-28 bg-slate-300 rounded-full" />
                                  <div className="h-1 w-16 bg-slate-300 rounded-full" />
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Action</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT: The "Cockpit" Pitch */}
            <div className="max-w-xl pt-4 order-1 lg:order-2">
              <div className="flex items-center gap-2 text-primary mb-3">
                <MonitorCheck className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 06: Manage effortlessly
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15]">
                A command center for <br /> every operational detail.
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Running a league is complex; managing it shouldn’t be. Our administrative 
                dashboard brings every team, venue, and score into a unified workstation 
                designed for speed and total oversight.
              </p>

              <ul className="grid gap-y-3">
                {[
                  { label: 'Role Management', desc: 'Assign admins, referees, and scorekeepers.' },
                  { label: 'Task Automation', desc: 'Get alerts for schedule overlaps or missing scores.' },
                  { label: 'Bulk Operations', desc: 'Update entire seasons or divisions in few clicks.' },
                  { label: 'Reporting', desc: 'Export full season data and performance audits.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p><span className="font-bold text-slate-900">{item.label}:</span> {item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Container>
      </section>
      {/* SECTION 7: DATA RELIABILITY & SAFETY */}
      <section className="py-16 bg-white border-b border-slate-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* TEXT: The "Peace of Mind" Pitch */}
            <div className="max-w-xl pb-6">
              <div className="flex items-center gap-2 text-primary mb-3">
                <DatabaseZap className="w-4 h-4" />
                <p className="text-sm uppercase tracking-widest font-bold">
                  Step 07: Operate securely
                </p>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15] text-balance">
                Data you can trust, <br /> season after season.
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                League history is too valuable to risk on personal spreadsheets. 
                Our foundational architecture treats your standings as an immutable 
                system of record—ensuring every score is validated, encrypted, and backed up.
              </p>

              <ul className="grid gap-y-3">
                {[
                  { label: 'Immutable Logs', desc: 'Every score entry and rule change is tracked and audited.' },
                  { label: 'Versioned State', desc: 'Instantly recalculate or verify any past result or standing.' },
                  { label: 'Automatic Backups', desc: 'Real-time database snapshots prevent data loss.' },
                  { label: 'Encrypted Access', desc: 'Industrial-grade security for internal league administration.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <p><span className="font-bold text-slate-900">{item.label}:</span> {item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* VISUAL: The Immutable Audit Vault (Git-like Log) */}
            <div className="relative">
              <div className="bg-slate-100/50 rounded-[2.5rem] p-4 border border-slate-100 shadow-inner">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[360px]">
                  
                  {/* macOS Window Header (Consistent Style) */}
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="flex-1 text-center pr-10">
                      <div className="h-1.5 w-32 bg-slate-200 rounded-full mx-auto" />
                    </div>
                  </div>

                  {/* Audit Feed: High Density, Low Contrast */}
                  <div className="flex-1 p-5 space-y-4 font-mono text-[9px] text-slate-400">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="h-2 w-28 bg-slate-400 rounded-full" />
                        <div className="px-2 py-0.5 rounded bg-green-400/20 text-green-900/60 font-bold uppercase tracking-widest text-[8px]">Synced ✓</div>
                    </div>

                    {/* Log Entries: Abstracted Git/Audit feel */}
                    {[
                      { hash: 'e5a1b3', event: 'STANDINGS_RECALCULATED', icon: RefreshCcw, color: 'text-primary' },
                      { hash: '8c9d2f', event: 'MATCH_RESULT_VERIFIED (TIGvLIO)', icon: CheckCircle2, color: 'text-green-500' },
                      { hash: 'SYSTEM', event: 'AUTOMATIC_BACKUP_COMPLETED', icon: CloudDownload, color: 'text-slate-400' },
                      { hash: '4f1a0b', event: 'IDENTITY_THEME_UPDATED', icon: Palette, color: 'text-primary' },
                      { hash: '7d6e5a', event: 'ADMIN_ROLE_ASSIGNED (REF_04)', icon: UserPlus, color: 'text-slate-400' },
                      { hash: 'b9c2d1', event: 'LEAGUE_RULES_LOCKED (24/25)', icon: Lock, color: 'text-slate-900' }
                    ].map((log, i) => (
                        <div key={i} className={`flex items-start gap-3 py-1 ${i > 0 ? 'opacity-70' : ''}`}>
                          <span className="text-slate-300 w-10 shrink-0 tabular-nums">[{log.hash}]</span>
                          <div className="w-4 h-4 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                              <log.icon size={12} className={log.color} />
                          </div>
                          <span className={`${i === 0 ? 'text-slate-600 font-medium' : 'text-slate-600'}`}>
                              {log.event}
                          </span>
                        </div>
                    ))}
                  </div>

                  {/* System Status Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Uptime: 99.98% | Next Backup: 04:00 GMT
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
{/* SECTION 8: GROWTH & SCALABILITY */}
<section className="py-20 bg-slate-900 text-white overflow-hidden">
  <Container>
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      
      {/* VISUAL: The Evolutionary Growth Path */}
      <div className="relative h-[400px] flex items-center justify-center order-2 lg:order-1">
        
        {/* Ambient background "path" */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* 1. START SMALL: The "Basic" View */}
        <div className="absolute left-0 bottom-12 w-40 h-52 bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
           <div className="flex flex-col h-full">
              <div className="w-8 h-8 rounded bg-slate-700 mb-3 flex items-center justify-center">
                 <Users size={14} className="text-slate-400" />
              </div>
              <div className="h-2 w-16 bg-white/20 rounded-full mb-1" />
              <div className="h-1.5 w-10 bg-white/5 rounded-full mb-6" />
              
              <div className="mt-auto p-2 rounded bg-primary/10 border border-primary/20">
                 <div className="h-1 w-full bg-primary/40 rounded-full" />
              </div>
              <p className="mt-2 text-[8px] font-bold text-center text-slate-500 uppercase tracking-widest">Single League</p>
           </div>
        </div>

        {/* 2. GROW: The "Pro" View */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 bg-slate-800 rounded-2xl border-2 border-slate-600 p-5 shadow-2xl z-20">
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Trophy size={18} className="text-primary" />
                 </div>
                 <div className="px-2 py-0.5 rounded bg-primary text-[7px] font-bold">PRO</div>
              </div>
              <div className="space-y-2 mb-6">
                 <div className="h-2 w-24 bg-white/20 rounded-full" />
                 <div className="h-2 w-20 bg-white/10 rounded-full" />
                 <div className="h-2 w-28 bg-white/10 rounded-full" />
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-2">
                 <div className="h-8 rounded bg-white/5 border border-white/5" />
                 <div className="h-8 rounded bg-white/5 border border-white/5" />
              </div>
              <p className="mt-3 text-[9px] font-black text-center text-white italic tracking-tight">Multi-Division</p>
           </div>
        </div>

        {/* 3. EXPAND: The "Federation" View */}
        <div className="absolute right-0 top-12 w-56 h-72 bg-white rounded-2xl border border-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-6 hover:rotate-0 transition-all duration-500 z-30 group">
           <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-5">
                 <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                    <Globe size={20} className="text-primary" />
                 </div>
                 <div className="space-y-1">
                    <div className="h-2 w-20 bg-slate-900 rounded-full" />
                    <div className="h-1.5 w-12 bg-slate-200 rounded-full" />
                 </div>
              </div>
              
              <div className="space-y-3">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary" />
                       <div className="h-1.5 flex-1 bg-slate-100 rounded-full" />
                    </div>
                 ))}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-center">
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">National Scale</span>
              </div>
           </div>
        </div>

      </div>

      {/* TEXT: The "Evolution" Pitch */}
      <div className="max-w-xl order-1 lg:order-2">
        <div className="flex items-center gap-2 text-primary mb-3">
          <TrendingUp className="w-4 h-4" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary-foreground/60">
            Phase 08: Grow over time
          </p>
        </div>
        
        <h2 className="text-4xl font-black text-white tracking-tight mb-6 leading-[1.15]">
          Built for today, <br /> ready for tomorrow.
        </h2>
        
        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
          Whether you’re launching your first tournament or managing a 
          national federation, Elenem adapts to your scope. Start with 
          the essentials and unlock advanced professional tools as your 
          community expands.
        </p>

        <ul className="grid gap-y-4">
          {[
            { label: 'Basic Plan', desc: 'Everything you need to run your local league efficiently.' },
            { label: 'Pro Plan', desc: 'Manage multiple divisions, venues, and advanced player stats.' },
            { label: 'Federation', desc: 'Regional control for massive multi-league networks.' },
            { label: 'Seamless Migration', desc: 'Upgrade your plan anytime without losing a single goal or stat.' }
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <div className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
              <p><span className="font-bold text-white">{item.label}:</span> {item.desc}</p>
            </li>
          ))}
        </ul>
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
                <Link href="/contact?intent=demo" className="w-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-white font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
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