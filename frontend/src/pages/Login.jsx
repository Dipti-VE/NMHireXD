import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden antialiased">
      <div className="glow-bg top-[-20%] left-[-10%] animate-pulse-slow"></div>
      <div
        className="glow-bg bottom-[-20%] right-[-10%] animate-pulse-slow"
        style={{ animationDelay: '2s', background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(59,130,246,0.05) 40%, rgba(2,6,23,0) 70%)' }}
      ></div>

      <Header showNav={false} />

      <main className="relative z-10">
        <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="max-w-xl py-8 lg:py-12">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-slate-800/80 px-3 py-1.5 ring-1 ring-slate-700 animate-slide-up opacity-0-init animate-delay-100">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">AI-powered recruitment</p>
              </div>
              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl animate-slide-up opacity-0-init animate-delay-200">
                Find the right candidates <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]">faster.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg animate-slide-up opacity-0-init animate-delay-300">
                Upload a job description, search connected talent sources, screen candidates with explainable AI scoring, and move the strongest people into your outreach pipeline.
              </p>

              <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-3">
                <div className="glass-dark glass-dark-card rounded-2xl p-5 cursor-default animate-slide-up opacity-0-init animate-delay-400">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-brand/20 text-xs font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">01</div>
                  <p className="text-sm font-bold text-white">Analyze JD</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">Extract skills, experience and requirements.</p>
                </div>
                <div className="glass-dark glass-dark-card rounded-2xl p-5 cursor-default animate-slide-up opacity-0-init animate-delay-500">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent ring-1 ring-accent/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">02</div>
                  <p className="text-sm font-bold text-white">Score talent</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">Rank candidates on a transparent 100-point model.</p>
                </div>
                <div className="glass-dark glass-dark-card rounded-2xl p-5 cursor-default animate-slide-up opacity-0-init" style={{ animationDelay: '600ms' }}>
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-400 ring-1 ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">03</div>
                  <p className="text-sm font-bold text-white">Contact</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">Move eligible candidates into outreach.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 relative animate-slide-up opacity-0-init animate-delay-300">
            <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-b from-brand/20 to-accent/20 blur-xl z-0"></div>

            <div className="glass-dark relative z-10 rounded-[24px] p-8 sm:p-10 border border-slate-700/50">
              <div className="mb-6 flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Recruiter access</p>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mb-8 mt-2 text-sm text-slate-400">Open your hiring workspace to continue.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-bold text-slate-300">Work email</label>
                  <input id="email" type="email" autoComplete="email" placeholder="recruiter@company.com" required
                    className="input-dark w-full rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-600" />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-bold text-slate-300">Password</label>
                  <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" required
                    className="input-dark w-full rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-600" />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center size-4">
                      <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border border-slate-600 bg-slate-800/50 checked:bg-brand checked:border-brand cursor-pointer transition-colors" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="font-medium text-slate-400 group-hover:text-white transition-colors">Remember me</span>
                  </label>
                  <button type="button" className="font-semibold text-brand hover:text-brand-soft transition-colors drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]">Forgot password?</button>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-neon mt-4 w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 group">
                  {loading ? 'Signing in...' : (
                    <>Sign in to NM-HireX <span className="transition-transform group-hover:translate-x-1">→</span></>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 text-xs font-medium text-slate-300 border border-slate-700">
                <svg className="size-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Demo mode: any valid email and password opens the dashboard.
              </div>

              {loading && (
                <p className="mt-4 transform-gpu rounded-xl bg-accent/20 px-4 py-3 text-center text-xs font-bold text-accent border border-accent/30 shadow-[0_0_15px_rgba(20,184,166,0.2)] animate-slide-up">
                  <span className="inline-flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path></svg>
                    Sign-in successful. Opening dashboard…
                  </span>
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
