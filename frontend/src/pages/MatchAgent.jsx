import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function MatchAgent() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCriteriaReady, setIsCriteriaReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setStatus('Analyzing');
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsCriteriaReady(true);
      setStatus('Criteria ready');
    }, 1200);
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSearchComplete(true);
      setStatus('Screening');
    }, 1500);
  };

  const [expandedDetails, setExpandedDetails] = useState({});
  const toggleDetails = (name) => {
    setExpandedDetails(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const [contacted, setContacted] = useState({});
  const handleContact = (name) => {
    setContacted(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const [queueReady, setQueueReady] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden antialiased pb-20">
      <div className="glow-bg-large top-[-30%] left-[-20%] animate-pulse-slow"></div>
      <div
        className="glow-bg-large bottom-[-20%] right-[-10%] animate-pulse-slow"
        style={{ animationDelay: '2s', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(59,130,246,0.05) 40%, rgba(2,6,23,0) 70%)' }}
      ></div>

      <Header />

      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6 animate-slide-up opacity-0-init animate-delay-100">
            <div>
              <div className="mb-2 inline-flex items-center gap-2.5 rounded-full bg-slate-800/80 px-3 py-1.5 ring-1 ring-slate-700">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">03 · Match agent</p>
              </div>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl text-white">Turn a JD into a shortlist.</h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-400">
                Upload a job description, let AI create search criteria, search connected portals, then rank candidates using the client's 100-point model.
              </p>
            </div>
            <Link to="/dashboard" className="rounded-xl bg-slate-800/80 px-5 py-3 text-sm font-bold text-white ring-1 ring-slate-700 hover:bg-slate-700 transition-all shadow-sm">
              ← Back to Dashboard
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-12 animate-slide-up opacity-0-init animate-delay-200">
            <section className="glass-dark rounded-[24px] p-6 sm:p-8 xl:col-span-5 h-fit">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Step 1 · Job intake</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">Create a search</h2>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-all ${status === 'Draft' ? 'bg-slate-800 text-slate-400 ring-slate-700' :
                    status === 'Analyzing' ? 'bg-brand/20 text-brand ring-brand/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                      'bg-accent/20 text-accent ring-accent/40 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                  }`}>
                  {status}
                </span>
              </div>

              <div className="mb-5">
                <label htmlFor="jd-title" className="mb-2 block text-xs font-bold text-slate-300">Job title</label>
                <input id="jd-title" defaultValue="Senior React Developer" className="input-dark w-full rounded-xl px-4 py-3 text-sm font-medium" />
              </div>

              <div className="dropzone-dark rounded-2xl p-8 text-center cursor-pointer group relative">
                <input id="jd-file" type="file" accept=".pdf,.doc,.docx,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-800 text-brand shadow-sm ring-1 ring-slate-700 group-hover:bg-brand group-hover:text-white transition-colors group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <p className="mt-4 text-base font-bold text-white group-hover:text-brand-soft transition-colors">Upload Job Description</p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">PDF, DOC, DOCX or TXT · up to 10 MB</p>
                {fileName && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-pulse">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> {fileName} selected
                  </p>
                )}
              </div>

              <div className="my-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span className="h-px flex-1 bg-slate-800"></span>OR PASTE JD<span className="h-px flex-1 bg-slate-800"></span>
              </div>

              <textarea rows="5" placeholder="Paste the job description here…" className="input-dark w-full resize-none rounded-xl px-4 py-3 text-sm mb-6 placeholder:text-slate-600"></textarea>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-colors border ${isCriteriaReady ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600'
                  }`}
              >
                {isAnalyzing ? (
                  <><svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path></svg> AI is analyzing the JD…</>
                ) : isCriteriaReady ? 'Re-analyze JD' : 'Analyze JD & Create Search Criteria'}
              </button>

              {isCriteriaReady && (
                <div className="mt-6 transform-gpu transition-all duration-500 rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/80 backdrop-blur-md animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-white">AI-generated search criteria</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">Review before sending to portals.</p>
                    </div>
                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-bold text-accent shadow-[0_0_10px_rgba(20,184,166,0.2)]">Ready</span>
                  </div>

                  <div className="grid gap-3 text-xs">
                    <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <span className="font-bold text-slate-300 w-20 shrink-0">Experience:</span>
                      <span className="font-medium text-white">4–7 years</span>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <span className="font-bold text-slate-300 w-20 shrink-0">Location:</span>
                      <span className="font-medium text-white">Kolkata / Remote</span>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <span className="font-bold text-slate-300 w-20 shrink-0">Mandatory:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded bg-brand/20 px-1.5 py-0.5 font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]">React</span>
                        <span className="rounded bg-brand/20 px-1.5 py-0.5 font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]">TypeScript</span>
                        <span className="rounded bg-brand/20 px-1.5 py-0.5 font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]">JavaScript</span>
                        <span className="rounded bg-brand/20 px-1.5 py-0.5 font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]">Node.js</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <span className="font-bold text-slate-300 w-20 shrink-0">Preferred:</span>
                      <span className="font-medium text-white">AWS · Docker · Next.js</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className={searchComplete
                      ? "mt-5 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white border border-slate-700 transition-all flex items-center justify-center gap-2 group hover:bg-slate-700"
                      : "btn-neon mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 group"}
                  >
                    {isSearching ? (
                      <><svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path></svg> Searching connected portals…</>
                    ) : searchComplete ? (
                      <>Refresh portal search <span className="ml-1 transition-transform group-hover:translate-x-1">→</span></>
                    ) : (
                      <>Search connected portals <span className="transition-transform group-hover:translate-x-1">→</span></>
                    )}
                  </button>

                  {searchComplete && (
                    <p className="mt-4 text-center text-[11px] font-bold text-accent bg-accent/10 py-2 px-3 rounded-lg border border-accent/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Demo search complete: 1,248 candidate profiles returned for AI screening.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="glass-dark rounded-[24px] p-6 sm:p-8 xl:col-span-7 animate-slide-up opacity-0-init animate-delay-300">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Steps 2–3 · Screening</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">Ranked candidates</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-slate-700">
                    <span className="text-slate-400">Screened:</span> 1,248
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent ring-1 ring-accent/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    186 strong
                  </span>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-0.5">All</button>
                <button className="rounded-full bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-slate-700 transition-all hover:text-white hover:bg-slate-700 hover:-translate-y-0.5">90+ Excellent</button>
                <button className="rounded-full bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-slate-700 transition-all hover:text-white hover:bg-slate-700 hover:-translate-y-0.5">80+ Strong</button>
                <button className="rounded-full bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-slate-700 transition-all hover:text-white hover:bg-slate-700 hover:-translate-y-0.5">Eligible</button>
              </div>

              <div className="space-y-4">
                {/* Candidate 1 */}
                <div className="candidate-card glass-dark-card bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="text-base font-bold text-white">Rahul Sharma</p>
                        <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-bold text-accent ring-1 ring-accent/30 shadow-[0_0_10px_rgba(20,184,166,0.15)]">Excellent Match</span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        Senior Software Engineer <span className="size-1 rounded-full bg-slate-600"></span> Kolkata <span className="size-1 rounded-full bg-slate-600"></span> 5.4 yrs <span className="size-1 rounded-full bg-slate-600"></span> Naukri
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-display text-4xl font-bold text-accent leading-none drop-shadow-[0_0_8px_rgba(20,184,166,0.4)]">94.2</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Match / 100</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Mandatory</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">96</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full shadow-[0_0_5px_rgba(20,184,166,0.5)] animate-fill-width" style={{ width: '96%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Experience</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">100</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full shadow-[0_0_5px_rgba(20,184,166,0.5)] animate-fill-width" style={{ width: '100%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Domain</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">90</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-brand-soft rounded-full shadow-[0_0_5px_rgba(96,165,250,0.5)] animate-fill-width" style={{ width: '90%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Preferred</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">80</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-brand-soft rounded-full shadow-[0_0_5px_rgba(96,165,250,0.5)] animate-fill-width" style={{ width: '80%' }}></div></div></div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> React</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> TypeScript</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Node.js</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> PostgreSQL</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-700"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Missing Docker</span>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-700/50 pt-4">
                    <button onClick={() => toggleDetails('rahul')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1">
                      {expandedDetails['rahul'] ? 'Hide details ↑' : 'View details ↓'}
                    </button>
                    <button
                      onClick={() => handleContact('rahul')}
                      disabled={contacted['rahul']}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${contacted['rahul']
                          ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                          : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:-translate-y-0.5'
                        }`}
                    >
                      {contacted['rahul'] ? (
                        <><svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Added to outreach</>
                      ) : 'Add to outreach'}
                    </button>
                  </div>

                  <div className={`details-panel rounded-xl bg-slate-900/80 px-4 text-xs leading-relaxed border border-slate-800 ${expandedDetails['rahul'] ? 'open' : ''}`}>
                    <p><strong className="text-white">Why this match:</strong> Strong mandatory-skill coverage, relevant experience within the target range and strong role/domain relevance. <span className="text-slate-400">Docker is preferred and missing, so it does not make the candidate ineligible.</span></p>
                    <div className="mt-2 inline-block rounded bg-accent/20 px-2 py-0.5 font-bold text-accent shadow-[0_0_10px_rgba(20,184,166,0.1)]">AI Confidence: 94%</div>
                  </div>
                </div>

                {/* Candidate 2 */}
                <div className="candidate-card glass-dark-card bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="text-base font-bold text-white">Priya Das</p>
                        <span className="rounded-full bg-brand/20 px-2.5 py-1 text-[10px] font-bold text-brand ring-1 ring-brand/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]">Strong Match</span>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        Software Engineer <span className="size-1 rounded-full bg-slate-600"></span> Bengaluru <span className="size-1 rounded-full bg-slate-600"></span> 4.8 yrs <span className="size-1 rounded-full bg-slate-600"></span> Naukri
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-display text-4xl font-bold text-brand leading-none drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">86.7</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Match / 100</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Mandatory</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">88</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-brand-soft rounded-full shadow-[0_0_5px_rgba(96,165,250,0.5)] animate-fill-width" style={{ width: '88%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Experience</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">100</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full shadow-[0_0_5px_rgba(20,184,166,0.5)] animate-fill-width" style={{ width: '100%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Domain</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">78</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-brand-soft rounded-full shadow-[0_0_5px_rgba(96,165,250,0.5)] animate-fill-width" style={{ width: '78%' }}></div></div></div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Preferred</span>
                      <div className="flex items-center gap-2"><p className="font-bold text-white">70</p><div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-slate-500 rounded-full animate-fill-width" style={{ width: '70%' }}></div></div></div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> React</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> TypeScript</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/30"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Node.js</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-700"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Missing AWS</span>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-700/50 pt-4">
                    <button onClick={() => toggleDetails('priya')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1">
                      {expandedDetails['priya'] ? 'Hide details ↑' : 'View details ↓'}
                    </button>
                    <button
                      onClick={() => handleContact('priya')}
                      disabled={contacted['priya']}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${contacted['priya']
                          ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                          : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:-translate-y-0.5'
                        }`}
                    >
                      {contacted['priya'] ? (
                        <><svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Added to outreach</>
                      ) : 'Add to outreach'}
                    </button>
                  </div>

                  <div className={`details-panel rounded-xl bg-slate-900/80 px-4 text-xs leading-relaxed border border-slate-800 ${expandedDetails['priya'] ? 'open' : ''}`}>
                    <p><strong className="text-white">Why this match:</strong> Strong mandatory skills and experience. Domain similarity is lower than the top-ranked candidate.</p>
                    <div className="mt-2 inline-block rounded bg-brand/20 px-2 py-0.5 font-bold text-brand shadow-[0_0_10px_rgba(59,130,246,0.1)]">AI Confidence: 88%</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand/20 to-purple-500/20 p-6 border border-slate-700 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-soft">Step 4 · Outreach</p>
                  <p className="mt-2 text-sm font-medium text-white">Review the eligible queue before sending to the approved WhatsApp integration. Limit: <b className="text-white">200 candidates</b>.</p>
                </div>
                <button onClick={() => setQueueReady(true)} className="relative z-10 btn-neon rounded-xl px-5 py-3 text-sm font-bold text-white">
                  Review outreach queue
                </button>
              </div>

              {queueReady && (
                <p className="mt-4 rounded-xl bg-accent/20 px-4 py-3 text-sm font-bold text-accent border border-accent/30 shadow-[0_0_15px_rgba(20,184,166,0.2)] animate-slide-up">
                  <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Demo queue ready: 200 eligible candidates can be reviewed before WhatsApp outreach is started.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
