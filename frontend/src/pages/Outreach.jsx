import { useState } from 'react';
import Header from '../components/Header';

export default function Outreach() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const campaigns = [
    {
      id: 1,
      name: 'Senior React Developer',
      job: 'React Developer',
      created: 'Created today',
      rule: 'Top 200 rule',
      eligible: 200,
      contacted: 142,
      interested: 34,
      status: 'Active',
      searchStr: 'senior react developer active'
    },
    {
      id: 2,
      name: 'Python FastAPI Engineer',
      job: 'FastAPI Engineer',
      created: 'Completed yesterday',
      rule: '',
      eligible: 86,
      contacted: 86,
      interested: 17,
      status: 'Completed',
      searchStr: 'python fastapi engineer completed'
    },
    {
      id: 3,
      name: 'Product Designer',
      job: 'Product Designer',
      created: 'Not started',
      rule: '61 eligible',
      eligible: 61,
      contacted: 0,
      interested: 0,
      status: 'Draft',
      searchStr: 'product designer draft'
    }
  ];

  const filtered = campaigns.filter(c => {
    const qMatch = c.searchStr.includes(search.toLowerCase());
    const sMatch = !status || c.status === status;
    return qMatch && sMatch;
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
                <span className="size-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Candidate communication</p>
              </div>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl text-white">Outreach</h1>
              <p className="mt-3 text-base text-slate-400">Manage WhatsApp campaigns for eligible candidates, with every contact tracked.</p>
            </div>
            <button className="btn-neon rounded-xl px-5 py-3.5 text-sm font-bold text-white flex items-center gap-2 group" onClick={() => alert('New campaign flow would open here.')}>
              + New campaign
            </button>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-slide-up opacity-0-init animate-delay-200">
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Candidates contacted</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">142</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">This month</p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Pending outreach</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">58</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">From current eligible pool</p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Interested</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">34</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-2 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.15)] relative z-10">
                24% response-to-interest
              </p>
            </div>
            <div className="glass-dark glass-dark-card rounded-2xl p-6 relative overflow-hidden group">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10">Tests assigned</p>
              <p className="mt-2 font-display text-4xl font-bold text-white relative z-10">19</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400 relative z-10">After candidate interest</p>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-12 animate-slide-up opacity-0-init animate-delay-300">
            <section className="glass-dark rounded-[24px] p-6 sm:p-8 lg:col-span-8 h-fit">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-slate-500"
                    placeholder="Search campaigns or job titles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select className="input-dark rounded-xl px-4 py-3 text-sm font-medium" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All status</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="w-full min-w-[760px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-4 pl-2">Campaign</th>
                      <th className="pb-4">Job</th>
                      <th className="pb-4">Eligible</th>
                      <th className="pb-4">Contacted</th>
                      <th className="pb-4">Interested</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 pr-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.map(c => (
                      <tr key={c.id} className="table-row-hover border-b border-slate-800 group">
                        <td className="py-4 pl-2 rounded-l-lg">
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                            {c.created} {c.rule && <><span className="size-1 rounded-full bg-slate-600"></span> {c.rule}</>}
                          </p>
                        </td>
                        <td className="py-4 font-semibold text-white">{c.job}</td>
                        <td className="py-4 font-bold text-white">{c.eligible}</td>
                        <td className={`py-4 font-bold ${c.contacted > 0 ? 'text-accent drop-shadow-[0_0_5px_rgba(20,184,166,0.3)]' : 'text-slate-500'}`}>{c.contacted}</td>
                        <td className={`py-4 font-bold ${c.interested > 0 ? 'text-brand drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]' : 'text-slate-500'}`}>{c.interested}</td>
                        <td className="py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${c.status === 'Active' ? 'bg-accent/20 text-accent ring-accent/40 shadow-[0_0_10px_rgba(20,184,166,0.1)]' :
                              c.status === 'Completed' ? 'bg-purple-500/20 text-purple-400 ring-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]' :
                                'bg-warning/20 text-warning ring-warning/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right rounded-r-lg">
                          <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-slate-700 hover:bg-slate-700 transition-all" onClick={() => alert('Campaign details')}>
                            {c.status === 'Draft' ? 'Open' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">No campaigns found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="glass-dark rounded-[24px] p-6 sm:p-8 lg:col-span-4 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Campaign rule</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">Top 200 eligible candidates</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Only candidates meeting the configured eligibility threshold are placed into outreach. Candidates already contacted are excluded from the next run.
                </p>
              </div>

              <div className="glass-dark-card rounded-xl bg-slate-800/40 border border-slate-700/50 p-5 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-white">Current pool</span>
                  <span className="text-sm font-bold text-white">312</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 ring-1 ring-slate-700 overflow-hidden mb-3">
                  <div className="h-full bg-brand animate-fill-width" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-slate-400">200 selected for the active WhatsApp campaign.</p>
              </div>

              <div className="glass-dark-card rounded-xl bg-slate-800/40 border border-slate-700/50 p-5 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-white">Approval</span>
                  <span className="inline-flex rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent ring-1 ring-accent/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]">Connected</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">WhatsApp integration is ready. Sending stays behind an explicit campaign start action.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
