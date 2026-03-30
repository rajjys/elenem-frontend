import Container from '@/components/ui/container'
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, CreditCard, Clock, Users, Zap } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="bg-white selection:bg-primary/10">

      {/* HERO: High Impact & Clean */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -skew-x-12 translate-x-1/2 -z-10" />
        <Container>
          <div className="max-w-4xl text-center mx-auto">
            <div className="flex items-center gap-2 text-primary mb-6">
              <CreditCard className="w-4 h-4" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Pricing & Plans</p>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Run your league properly <br />
              <span className="text-primary italic">starting this season</span>
            </h1>
            
            <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Pricing is based on the structure and complexity of your competition — not arbitrary feature limits.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-primary transition-all duration-300 group"
              >
                Request a demo 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* PRICING PHILOSOPHY: Structured Content */}
      <section className="py-12 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">
                Pricing based on how <br/>your league operates
              </h2>
              
              <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
                <h3 className="text-lg text-slate-700 mb-2 italic font-medium">
                    Every league is different.
                </h3>
                <p>
                  Some run a single competition with a few teams. 
                  Others manage multiple divisions, tournaments, and administrators.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Elenem pricing reflects:</p>
                  <ul className="space-y-3">
                    {[
                      'The number of competitions',
                      'The structure of your league',
                      'The level of coordination required'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm font-bold text-primary italic">Not arbitrary feature limits.</p>
                </div>
              </div>
            </div>
            
            {/* Abstract visual weight for desktop */}
            <div className="hidden lg:block relative">
               <div className="aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center">
                  <ShieldCheck size={120} className="text-slate-200" />
               </div>
            </div>
          </div>
        </Container>
      </section>

      {/* BASIC PLAN: The Anchor Card */}
      <section className="py-24 bg-slate-900">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="grid lg:grid-cols-5">
                
                {/* Content Side */}
                <div className="lg:col-span-3 p-8 lg:p-14">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
                    <Zap size={14} className="fill-current" />
                    <span className="text-[10px] uppercase tracking-widest font-black">Anchor Plan</span>
                  </div>

                  <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                    Everything you need to run <br/> a proper sport league
                  </h2>

                  <p className="text-lg text-slate-500 mb-10 leading-relaxed">
                    Designed for local and regional leagues moving away from manual management.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
                    {[
                      'Full league setup',
                      'Fixtures management',
                      'Automatic standings',
                      'Public league website',
                      'Mobile-ready access',
                      'Onboarding support',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Side */}
                <div className="lg:col-span-2 bg-slate-50 border-l border-slate-100 p-8 lg:p-14 flex flex-col justify-center items-center text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Starts at</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-7xl font-black text-slate-900 tracking-tighter">$399</span>
                    <span className="text-slate-400 font-bold">/season</span>
                  </div>
                  
                  <a
                    href="/contact"
                    className="w-full bg-primary text-white px-8 py-4 rounded-xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                  >
                    Request setup <ArrowRight size={18} />
                  </a>
                  <p className="mt-4 text-[10px] text-slate-400 font-medium">No hidden fees. Pay per competition season.</p>
                </div>

              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* GROWTH TIERS: Professional Cards */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
                As your league grows, <br/>complexity increases
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                More teams, more competitions, more coordination. Elenem adapts to that scale seamlessly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* PRO */}
              <div className="group p-10 rounded-[2rem] border border-slate-100 bg-white hover:border-primary/20 hover:shadow-2xl transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-primary/5 transition-colors">
                  <TrendingUp className="text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 italic">Pro</h3>
                <p className="text-slate-500 mb-8 font-medium">
                  For leagues running multiple competitions or divisions.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    'Advanced competition structures',
                    'More administrative flexibility',
                    'Increased operational capacity'
                  ].map((li, i) => (
                    <li key={i} className="text-sm font-bold text-slate-700 flex items-center gap-3">
                      <span className="text-primary">—</span> {li}
                    </li>
                  ))}
                </ul>
                <a href="/contact" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[11px] group-hover:gap-4 transition-all">
                  Discuss your league <ArrowRight size={14} />
                </a>
              </div>

              {/* FEDERATION */}
              <div className="group p-10 rounded-[2rem] border border-slate-900 bg-slate-900 text-white shadow-2xl transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-8">
                  <Users className="text-primary-light" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic">Federation</h3>
                <p className="text-slate-400 mb-8 font-medium">
                  For organizations managing multiple leagues.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    'Multi-league management',
                    'Centralized control',
                    'Standardized structures'
                  ].map((li, i) => (
                    <li key={i} className="text-sm font-bold text-slate-200 flex items-center gap-3">
                      <span className="text-primary-light">—</span> {li}
                    </li>
                  ))}
                </ul>
                <a href="/contact" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[11px] group-hover:gap-4 transition-all">
                  Contact us <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* VALUE PROPS: Tight & Professional */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <Container>
          <div className="grid lg:grid-cols-2 gap-20">
            {/* NOT SOFTWARE */}
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight uppercase italic text-[24px]">
                Not software. Structure.
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-slate-600 leading-relaxed">
                  Elenem is not another tool to add to your workflow. It changes the way your league operates.
                </p>
                <div className="space-y-3">
                  {[
                    'One system instead of multiple tools',
                    'One source of truth instead of conflicting versions',
                    'One process instead of constant corrections'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-bold text-slate-800 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COST OF DOING NOTHING */}
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight uppercase italic text-[24px]">
                Hidden operational costs
              </h2>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100">
                 <p className="text-slate-500 mb-6 font-medium">Most leagues already pay — just not in money:</p>
                 <ul className="space-y-4 text-slate-800 font-bold text-sm">
                   <li className="flex items-center gap-3 text-red-500/80"><Clock size={16} /> Time spent fixing schedule errors</li>
                   <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-slate-300"/> Disputes after matchdays</li>
                   <li className="flex items-center gap-3"><Users size={16} className="text-slate-300"/> Poor communication with teams</li>
                   <li className="flex items-center gap-3"><TrendingUp size={16} className="text-slate-300"/> Limited visibility for sponsors</li>
                 </ul>
                 <div className="mt-4 pt-4 border-t border-slate-50">
                   <p className="text-slate-900 font-black italic">Elenem helps you avoid this.</p>
                 </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SUPPORT: Human Touch */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-3xl border-l-4 border-primary pl-8 lg:pl-12">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
              You don’t set this up alone
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed italic">
              We help configure your league, structure your competition,
              and guide you through onboarding. You focus on running the league. 
              <span className="text-slate-900 font-bold not-italic ml-2">We handle the system.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* FINAL CTA: Clean & Authoritative */}
      <section className="py-24 bg-slate-900">
        <Container>
          <div className="max-w-4xl text-center mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              If your next season matters, <br/>set it up properly
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
              Leagues that prepare early run smoother seasons. Secure your infrastructure today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <a
                href="/contact"
                className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-full font-black shadow-2xl hover:scale-105 transition-all text-lg"
              >
                Request a demo
              </a>
              <a
                href="/features"
                className="w-full sm:w-auto text-white/60 px-10 py-5 rounded-full font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                Explore features <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </Container>
      </section>

    </div>
  )
}