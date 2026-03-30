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
                  Step 02: Execute
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
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Live</span>
                        </div>
                      </div>

                      {/* Live Match Card with softer contrast */}
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="h-1 w-10 bg-slate-200 rounded-full" />
                          <div className="px-1.5 py-0.5 rounded bg-green-200 text-green-700 text-[8px] font-bold tracking-widest italic">82'</div>
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
                          <span className="text-[10px] font-black text-slate-500">{row.rank}</span>
                          <div className={`w-1 h-1 rounded-full ${
                            row.trend === 'up' ? 'bg-green-500' : 
                            row.trend === 'down' ? 'bg-red-500' : 'bg-slate-200'
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
                        <div className="col-span-2 text-center text-[10px] font-black text-slate-900 tabular-nums">{row.pts}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subtle Footer: Logic Enforcement Badge */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <div className="px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Updated 3 mins ago</span>
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