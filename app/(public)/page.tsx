import Container from '@/components/ui/container';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'; // Suggested icons

export default function HomePage() {
  return (
    <div className="selection:bg-primary/10">
      {/* HERO - Increased impact with a subtle gradient */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />
        <Container>
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              One system to run <br />
              <span className="text-primary">your league</span>
            </h1>

            <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Elenem replaces paper schedules, manual standings, and WhatsApp groups with one simple system to manage your league
               - games, standings, and communication in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-white font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                Request a demo
              </a>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </Container>
      </section>
        {/* PAIN POINTS - Highlighting Common League Management Issues */}
      <section className="py-18 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Every Season. <br/>
                  <span className="text-primary font-medium italic">Same Problems.</span>
                </h2>
                <p className="text-muted">Elenem exists because these problems repeat every season.</p>
              </div>
              
              <ul className="grid gap-4">
                {[
                  "Match calendars managed on paper or PDF",
                  "Schedule errors discovered too late",
                  "Standings calculated manually",
                  "Disputes after every matchday",
                  "Fans uninformed or misinformed",
                  "Facebook and WhatsApp used as official tools"
                ].map((point, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border-l-4 border-red-400">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="font-medium text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* THE "MESS" VISUAL (The Chaos) */}
            <div className="relative p-8 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-300">
              <div className="space-y-4 opacity-50 grayscale">
                {/* Mockup of a messy WhatsApp group chat */}
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                  <p className="text-xs font-bold text-green-600">Coach Mike</p>
                  <p className="text-sm">Wait, is the game at 3pm or 4pm? The PDF says 3 but the Facebook post says 4...</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%] ml-auto bg-blue-50">
                  <p className="text-xs font-bold text-blue-600">Admin</p>
                  <p className="text-sm">Let me check the spreadsheet and get back to you.</p>
                </div>
                {/* Mockup of a handwritten paper score */}
                <div className="bg-[#fff9c4] p-6 shadow-md mx-auto w-48 text-center border-t-4 border-red-200">
                  <p className="font-serif text-lg border-b border-black/10 my-2">Tigers 2 - 1 Eagles ?</p>
                  <p className="text-xs mt-2 italic">(Signature illegible)</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold text-sm">THE OLD WAY</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
        {/* SOLUTION - Emphasizing Automation, Integrity and Brand Ownership */}
      <section className="py-18 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* LEFT: THE TEXT (League Manager Centered) */}
            <div className="max-w-xl">
              <div className='mb-6'>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Your identity. <br/>
                  <span className="text-primary font-medium italic">Our engine.</span>
                </h2>
                <p className='text-muted'>
                  Elenem centralizes fixtures, results, standings, and communication into one official system -
                  powering your league’s digital presence while keeping your identity.
                </p>
              </div>
              
              
              <div className="space-y-8">
                <div className=' hidden md:block'>
                  <h3 className="text-xl font-bold text-slate-900">Total Brand Ownership</h3>
                  <p className="text-muted mt-2 leading-relaxed">
                    Elenem lives on <strong> your website</strong>. It looks like you, feels like you, 
                    and builds your brand every matchday.
                  </p>
                </div>

                <div className=' hidden md:block'>
                  <h3 className="text-xl font-bold text-slate-900">Automated league operations</h3>
                  <p className="text-muted mt-2 leading-relaxed">
                    When a score is entered, your entire league updates instantly. 
                    The standings, the goal-difference, and the schedules all sync 
                    across mobile and desktop without you lifting a finger.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 text-primary text-sm font-bold">
                    ✓ Custom Domains
                  </div>
                  <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 text-primary text-sm font-bold">
                    ✓ Automated Logic
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: THE ABSTRACT PREVIEW (The "Mirror") */}
            <div className="relative group">
              {/* DESKTOP VIEW: The Command Center */}
              <div className="relative z-10 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-500">
                {/* Browser Header with Custom Domain Focus */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 flex items-center gap-2 shadow-sm">
                    <div className="w-3 h-3 text-slate-400 mb-4 mr-1">🔒</div>
                    <span className="text-xs font-medium text-slate-600 tracking-tight">https://my-league.com/standings</span>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Abstract Standings Skeleton */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      <div className="col-span-3 h-2 bg-slate-200 rounded-full w-24" />
                      <div className="h-2 bg-slate-100 rounded-full" />
                      <div className="h-2 bg-slate-100 rounded-full" />
                      <div className="h-2 bg-slate-100 rounded-full" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 py-3 border-b border-slate-50">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-5 h-5 bg-slate-100 rounded" />
                          <div className={`h-2 bg-slate-200 rounded-full ${i === 1 ? 'w-32' : 'w-24'}`} />
                        </div>
                        <div className="h-2 bg-slate-100 rou-nded-full mt-1.5" />
                        <div className="h-2 bg-slate-100 rounded-full mt-1.5" />
                        <div className={`h-2 rounded-full mt-1.5 ${i === 1 ? 'bg-primary/30' : 'bg-slate-100'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MOBILE VIEW: The Fan Experience */}
              <div className="absolute -bottom-10 -right-6 z-20 w-48 bg-slate-900 rounded-[2rem] p-2.5 shadow-2xl border border-slate-800 hidden md:block transform group-hover:translate-x-2 transition-transform duration-500">
                <div className="bg-white rounded-[1.5rem] h-80 overflow-hidden flex flex-col">
                  <div className="h-2 bg-slate-900 w-20 mx-auto mt-2 rounded-full mb-2" /> {/* Notch */}
                  {/* Browser Header with Custom Domain Focus */}
                <div className="bg-slate-50 border-b border-slate-100 px-1 flex items-center gap-4">
                  <div className="flex-1 bg-white border border-slate-200 rounded-md px-1 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 text-slate-400 mb-4">🔒</div>
                    <span className="text-xs pl-2 text-slate-600 font-medium tracking-tight">my-league.com</span>
                  </div>
                </div>
                  
                  <div className="p-2 space-y-3">
                    <div className="h-2 w-12 bg-slate-200 rounded-full mb-4" />
                    {/* Abstract Game Cards */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border border-slate-100 rounded-xl space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
                          <div className={`px-2 py-1 rounded text-[10px] font-bold ${i < 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {i === 1 ? '2 - 1' : i === 2 ? '0 - 3' : 'vs'}
                          </div>
                          <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto p-2 pb-4 border-t border-slate-100 bg-slate-50 flex justify-around">
                    <div className="w-4 h-4 rounded-full bg-primary/20" />
                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>
        {/* HOW IT WORKS - Visualizing the Process */}
      <section id="how-it-works" className="py-18">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">How Elenem works</h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">We handle the system. You focus on the sport.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Simple visual connector for desktop */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-slate-200 -z-10" />
            
            <Step
              number="01"
              title="We configure your league"
              text="Teams, calendar format, rules, and season structure set up by our experts."
            />
            <Step
              number="02"
              title="Officials manage everything"
              text="Results, standings, and updates are handled in a centralized, secure dashboard."
            />
            <Step
              number="03"
              title="Fans follow officially"
              text="Schedules, tables, and news are pushed to your league's public portal instantly."
            />
          </div>
        </Container>
      </section>
       {/* PRICING PREVIEW - The "Middle Ground" Approach */}
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Plans built for every level of play
              </h2>
              <p className="text-lg text-muted mb-8 leading-relaxed">
                Whether you're running a local 8-team tournament or a national 
                football federation, Elenem scales with you. 
              </p>
              
              {/* Simplified Tier List */}
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">B</div>
                  <div>
                    <p className="font-bold text-slate-900">Basic</p>
                    <p className="text-sm text-muted">For small, local community leagues.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">P</div>
                  <div>
                    <p className="font-bold text-slate-900">Pro</p>
                    <p className="text-sm text-muted">Advanced features for regional clubs.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">F</div>
                  <div>
                    <p className="font-bold text-slate-900">Federation</p>
                    <p className="text-sm text-muted">Custom solutions for large organizations.</p>
                  </div>
                </div>
              </div>

              <a
                href="/pricing"
                className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:underline"
              >
                Compare all features and pricing
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="flex-1 bg-primary rounded-[2rem] p-12 text-white relative overflow-hidden">
              <h3 className="text-2xl font-bold mb-4">Starting at $399/year</h3>
              <p className="text-primary-foreground/80 mb-8">
                All plans include core league management, 
                automated standings, and our official mobile-ready fan portal.
              </p>
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-2"><CheckCircle2 size={18} /> Configuration & Training</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} /> Dedicated Support</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={18} /> Regular Security Updates</li>
              </ul>
              <a href="/contact" className="block w-full text-center py-4 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Request a Custom Quote
              </a>
            </div>
          </div>
        </Container>
      </section>
        {/* FINAL CTA - High Contrast */}
      {/* FINAL CTA - The "Season Ready" Impact Zone */}
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
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Run your next season <br />
                <span className="text-primary opacity-90">properly.</span>
              </h2>
              
              <p className="mt-6 text-lg leading-8 text-muted">
                Stop improvising with spreadsheets and group chats. 
                Start managing your league with an official system.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-white font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  Request a demo
                </a>
                
                <a href="/pricing" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  See all plans <span aria-hidden="true" className='pl-1'>→</span>
                </a>
              </div>
            </div>

            {/* Subtle "Trusted By" label to lower the barrier */}
            <p className="mt-12 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Configuration and onboarding included
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center mb-3 group-hover:border-primary/30 transition-colors">
        <span className="text-xl font-bold text-primary">{number}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{text}</p>
    </div>
  );
}