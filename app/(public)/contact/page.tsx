'use client'

import { useSearchParams } from 'next/navigation'
import Container from '@/components/ui/container'
import { ArrowRight, MessageSquare, ShieldCheck, CheckCircle2, Zap } from 'lucide-react'
import { Suspense } from 'react'

type Intent = 'demo' | 'setup' | 'discussion'

function ContactContent() {
  const params = useSearchParams()
  const intent: Intent = (params.get('intent') as Intent) || 'demo'

  const config = {
    demo: {
      title: 'See how Elenem works',
      subtitle: 'A guided walkthrough of your future league operations.',
      cta: 'Request demo',
      icon: Zap
    },
    setup: {
      title: 'Start your league setup',
      subtitle: 'Initialize your competition structure for the upcoming season.',
      cta: 'Start setup',
      icon: ShieldCheck
    },
    discussion: {
      title: 'Tell us about your league',
      subtitle: 'Expert guidance on structuring your specific competition.',
      cta: 'Discuss my league',
      icon: MessageSquare
    },
  }[intent]

  const Icon = config.icon

  return (
    <div className="bg-white min-h-screen selection:bg-primary/10">
      <div className="h-1 bg-slate-50 w-full" />

      <section className="py-12 lg:py-20">
        <Container>
          <div className="grid lg:grid-cols-12 gap-12 items-start">

            {/* LEFT: THE FORM WORKSTATION */}
            <div className="lg:col-span-7">
              <div className="mb-10">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Icon size={14} />
                  <p className="text-[9px] uppercase tracking-[0.2em] font-black">Inquiry: {intent}</p>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                  {config.title}
                </h1>
                <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                  {config.subtitle}
                </p>
              </div>

              <form className="grid sm:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Full Name</label>
                   <input placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300" />
                </div>

                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Organization</label>
                   <input placeholder="League name" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300" />
                </div>

                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">WhatsApp</label>
                   <input placeholder="+243 ..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300" />
                </div>

                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Email</label>
                   <input placeholder="Optional" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300" />
                </div>

                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Sport</label>
                   <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 appearance-none">
                    <option>Select Sport</option>
                    <option>Football</option>
                    <option>Basketball</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Team Count</label>
                   <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 appearance-none">
                    <option>Quantity</option>
                    <option>1–8</option>
                    <option>9–16</option>
                    <option>17–32</option>
                    <option>32+</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Competition Type</label>
                   <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 appearance-none">
                    <option>League structure</option>
                    <option>Single competition</option>
                    <option>Multiple divisions</option>
                    <option>Federation</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Context</label>
                   <textarea
                    placeholder="Tell us more about your league (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-300 h-24 resize-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-black shadow-lg hover:bg-primary transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                    {config.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: THE "WHAT NEXT" GUIDE */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-slate-900 rounded-[1.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <h3 className="text-xl font-black italic tracking-tight mb-6">
                  What happens next
                </h3>

                <div className="space-y-6 relative">
                   <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-800" />

                   {[
                     { step: 'Review', text: 'We evaluate your competition structure and administrative needs.' },
                     { step: 'Consultation', text: 'Real-time discussion via WhatsApp to align on goals.' },
                     { step: 'Activation', text: 'Complete system configuration and onboarding for your team.' }
                   ].map((item, i) => (
                     <div key={i} className="relative flex gap-4 group">
                        <div className="w-[18px] h-[18px] rounded-full bg-slate-800 border-2 border-slate-900 z-10 flex items-center justify-center transition-colors group-hover:bg-primary" />
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">{item.step}</p>
                           <p className="text-slate-400 font-medium text-xs leading-relaxed">{item.text}</p>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="text-green-500" size={14} />
                    <p className="text-xs font-bold text-slate-200 tracking-tight">24h Response Commitment</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    WhatsApp preferred for instant coordination and technical support.
                  </p>
                </div>
              </div>

              {/* Minimal Trust Badge */}
              <div className="mt-6 flex items-center gap-3 px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                 <ShieldCheck className="text-slate-200" size={20} />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                    Enterprise Security <br/> & Data Privacy
                 </p>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </div>
  )
}

export default function ContactPage() {
  return <Suspense fallback={<div>Loading...</div>}>
          <ContactContent />
         </Suspense>
}