import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();

      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid email or password');
      }

      // Store authentication data
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userRole', data.user.role);

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden antialiased">
      <div className="glow-bg top-[-20%] left-[-10%] animate-pulse-slow"></div>

      <div
        className="glow-bg bottom-[-20%] right-[-10%] animate-pulse-slow"
        style={{
          animationDelay: '2s',
          background:
            'radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(59,130,246,0.05) 40%, rgba(2,6,23,0) 70%)',
        }}
      ></div>

      <Header showNav={false} />

      <main className="relative z-10">
        <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-6xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-12">

          {/* LEFT SIDE */}
          <section className="lg:col-span-7">
            <div className="max-w-xl py-8 lg:py-12">

              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-slate-800/80 px-3 py-1.5 ring-1 ring-slate-700 animate-slide-up opacity-0-init animate-delay-100">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                  AI-powered recruitment
                </p>
              </div>

              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl animate-slide-up opacity-0-init animate-delay-200">
                Find the right candidates{' '}
                <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                  faster.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg animate-slide-up opacity-0-init animate-delay-300">
                Upload a job description, search connected talent sources,
                screen candidates with explainable AI scoring, and move the
                strongest people into your outreach pipeline.
              </p>

              <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-3">

                <div className="glass-dark glass-dark-card rounded-2xl p-5 animate-slide-up opacity-0-init animate-delay-400">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-brand/20 text-xs font-bold text-brand ring-1 ring-brand/30">
                    01
                  </div>

                  <p className="text-sm font-bold text-white">
                    Analyze JD
                  </p>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Extract skills, experience and requirements.
                  </p>
                </div>

                <div className="glass-dark glass-dark-card rounded-2xl p-5 animate-slide-up opacity-0-init animate-delay-500">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent ring-1 ring-accent/30">
                    02
                  </div>

                  <p className="text-sm font-bold text-white">
                    Score talent
                  </p>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Rank candidates on a transparent 100-point model.
                  </p>
                </div>

                <div
                  className="glass-dark glass-dark-card rounded-2xl p-5 animate-slide-up opacity-0-init"
                  style={{ animationDelay: '600ms' }}
                >
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-400 ring-1 ring-purple-500/30">
                    03
                  </div>

                  <p className="text-sm font-bold text-white">
                    Contact
                  </p>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Move eligible candidates into outreach.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* LOGIN CARD */}
          <section className="lg:col-span-5 relative animate-slide-up opacity-0-init animate-delay-300">

            <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-b from-brand/20 to-accent/20 blur-xl z-0"></div>

            <div className="glass-dark relative z-10 rounded-[24px] p-8 sm:p-10 border border-slate-700/50">

              <div className="mb-6 flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Recruiter access
                </p>
              </div>

              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Welcome back
              </h2>

              <p className="mb-8 mt-2 text-sm text-slate-400">
                Open your hiring workspace to continue.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold text-slate-300"
                  >
                    Work email
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-dark w-full rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-600"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-bold text-slate-300"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-dark w-full rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-600"
                  />
                </div>

                {/* REMEMBER / FORGOT */}
                <div className="flex items-center justify-between text-xs pt-1">

                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center size-4">

                      <input
                        type="checkbox"
                        className="peer appearance-none w-4 h-4 rounded border border-slate-600 bg-slate-800/50 checked:bg-brand checked:border-brand cursor-pointer"
                      />

                      <svg
                        className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                    </div>

                    <span className="font-medium text-slate-400 group-hover:text-white">
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    className="font-semibold text-brand hover:text-brand-soft"
                  >
                    Forgot password?
                  </button>

                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                    {error}
                  </div>
                )}

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon mt-4 w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign in to NM-HireX
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>

              </form>

              {/* REGISTER */}
              <div className="mt-6 text-center text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand hover:text-brand-soft"
                >
                  Create an account
                </Link>
              </div>

              {loading && (
                <p className="mt-4 rounded-xl bg-accent/20 px-4 py-3 text-center text-xs font-bold text-accent border border-accent/30">
                  Signing in to your recruiter workspace…
                </p>
              )}

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}