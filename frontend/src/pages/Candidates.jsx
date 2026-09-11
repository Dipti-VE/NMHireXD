import { useState } from 'react';
import Header from '../components/Header';

export default function Candidates() {
  const [search, setSearch] = useState('');
  const [job, setJob] = useState('');
  const [stage, setStage] = useState('');
  const [score, setScore] = useState('');

  const candidates = [
    {
      id: 1,
      name: 'Rahul Sharma',
      location: 'Kolkata',
      exp: '6.2 yrs',
      score: 94.2,
      scoreLabel: 'Excellent',
      job: 'React Developer',
      skills: 'React, TS, Node, Next.js',
      stage: 'Eligible',
      searchStr: 'rahul sharma react typescript javascript node senior react developer'
    },
    {
      id: 2,
      name: 'Priya Das',
      location: 'Kolkata',
      exp: '5.1 yrs',
      score: 86.7,
      scoreLabel: 'Strong',
      job: 'React Developer',
      skills: 'React, JS, TS, AWS',
      stage: 'Interested',
      searchStr: 'priya das react javascript typescript aws product senior react developer'
    },
    {
      id: 3,
      name: 'Amit Kumar',
      location: 'Remote',
      exp: '4.4 yrs',
      score: 76.4,
      scoreLabel: 'Good',
      job: 'FastAPI Engineer',
      skills: 'Python, FastAPI, PostgreSQL',
      stage: 'Test Assigned',
      searchStr: 'amit kumar python fastapi postgresql product'
    },
    {
      id: 4,
      name: 'Neha Roy',
      location: 'Bengaluru',
      exp: '7.0 yrs',
      score: 91.3,
      scoreLabel: 'Excellent',
      job: 'Product Designer',
      skills: 'Figma, UX, Research',
      stage: 'Interview',
      searchStr: 'neha roy product designer figma ux research design systems'
    }
  ];

  const filtered = candidates.filter(c => {
    const qMatch = c.searchStr.includes(search.toLowerCase());
    const jMatch = !job || c.job === job;
    const sMatch = !stage || c.stage === stage;
    const minMatch = !score || c.score >= Number(score);
    return qMatch && jMatch && sMatch && minMatch;
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden antialiased pb-20">
      <div className="glow-bg top-[-30%] left-[-20%] animate-pulse-slow"></div>
      <div
        className="glow-bg bottom-[-20%] right-[-10%] animate-pulse-slow"
        style={{ animationDelay: '2s', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(59,130,246,0.05) 40%, rgba(2,6,23,0) 70%)' }}
      ></div>

      <Header />

      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6 animate-slide-up opacity-0-init animate-delay-100">
            <div>
              <div className="mb-2 inline-flex items-center gap-2.5 rounded-full bg-slate-800/80 px-3 py-1.5 ring-1 ring-slate-700">
                <span className="size-2 rounded-full bg-accent shadow-[0_0_10px_rgba(20,184,166,0.8)]"></span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Talent database</p>
              </div>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl text-white">Candidates</h1>
              <p className="mt-3 text-base text-slate-400">Search, review and track candidates across jobs and recruitment stages.</p>
            </div>
            <button onClick={() => alert('Candidate import flow would open here.')} className="rounded-xl bg-slate-800/80 px-5 py-3.5 text-sm font-bold text-white ring-1 ring-slate-700 hover:bg-slate-700 shadow-sm transition-all hover:-translate-y-0.5">
              + Import candidates
            </button>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-slide-up opacity-0-init animate-delay-200">
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Total candidates</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">1,248</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">Across connected sources</p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Excellent / Strong</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">186</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">Score ≥ 80</p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Interested</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">34</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">Ready for next step</p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Tests / Interviews</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">27</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">Currently in process</p>
            </div>
          </section>

          <section className="glass-dark rounded-[24px] p-6 sm:p-8 animate-slide-up opacity-0-init animate-delay-300">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                  className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-slate-500"
                  placeholder="Search name, skill, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select className="input-dark rounded-xl px-4 py-3 text-sm font-medium" value={job} onChange={e => setJob(e.target.value)}>
                  <option value="">All jobs</option>
                  <option>React Developer</option>
                  <option>FastAPI Engineer</option>
                  <option>Product Designer</option>
                </select>

                <select className="input-dark rounded-xl px-4 py-3 text-sm font-medium" value={stage} onChange={e => setStage(e.target.value)}>
                  <option value="">All stages</option>
                  <option>Eligible</option>
                  <option>Contacted</option>
                  <option>Interested</option>
                  <option>Test Assigned</option>
                  <option>Interview</option>
                </select>

                <select className="input-dark rounded-xl px-4 py-3 text-sm font-medium" value={score} onChange={e => setScore(e.target.value)}>
                  <option value="">All scores</option>
                  <option value="90">90+ Excellent</option>
                  <option value="80">80–89 Strong</option>
                  <option value="70">70–79 Good</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[960px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-4 pl-2">Candidate</th>
                    <th className="pb-4">Match Score</th>
                    <th className="pb-4">Target Job</th>
                    <th className="pb-4">Experience</th>
                    <th className="pb-4">Top Skills</th>
                    <th className="pb-4">Stage</th>
                    <th className="pb-4 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map(c => (
                    <tr key={c.id} className="table-row-hover border-b border-slate-800 group">
                      <td className="py-4 pl-2 rounded-l-lg">
                        <p className="font-bold text-white">{c.name}</p>
                        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                          {c.location} <span className="size-1 rounded-full bg-slate-600"></span> {c.exp}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display text-xl font-bold text-white leading-none">{c.score}</span>
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${c.scoreLabel === 'Excellent' ? 'bg-accent/20 text-accent ring-accent/30 shadow-[0_0_8px_rgba(20,184,166,0.2)]' :
                              c.scoreLabel === 'Strong' ? 'bg-brand/20 text-brand ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]' :
                                'bg-warning/20 text-warning ring-warning/30'
                            }`}>
                            {c.scoreLabel}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden ring-1 ring-slate-700">
                          <div className={`h-full animate-fill-width ${c.scoreLabel === 'Excellent' ? 'bg-accent' :
                              c.scoreLabel === 'Strong' ? 'bg-brand' : 'bg-warning'
                            }`} style={{ width: `${c.score}%` }}></div>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-white">{c.job}</td>
                      <td className="py-4 text-slate-400 font-medium">{c.exp}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs font-semibold text-slate-300">{c.skills}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${c.stage === 'Eligible' ? 'bg-brand/20 text-brand ring-brand/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]' :
                            c.stage === 'Interested' ? 'bg-accent/20 text-accent ring-accent/40 shadow-[0_0_10px_rgba(20,184,166,0.1)]' :
                              c.stage === 'Test Assigned' ? 'bg-purple-500/20 text-purple-400 ring-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]' :
                                'bg-[#0d9488]/20 text-[#2dd4bf] ring-[#0d9488]/40 shadow-[0_0_10px_rgba(13,148,136,0.1)]'
                          }`}>
                          {c.stage}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right rounded-r-lg">
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-slate-700 hover:bg-slate-700 transition-all" onClick={() => alert(`${c.name} profile details`)}>Profile</button>
                          <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all" onClick={() => alert(`Open contact for ${c.name}`)}>Contact</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">No candidates found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
