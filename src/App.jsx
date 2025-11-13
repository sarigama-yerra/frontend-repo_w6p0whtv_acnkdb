import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Moon, Users, User, Play, Pause, CheckCircle2, Clock, Loader2, Search, ChevronRight } from 'lucide-react';
import Spline from '@splinetool/react-spline';

// Utility helpers
const formatDuration = (ms) => {
  if (ms <= 0 || Number.isNaN(ms)) return '0s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
};

const nowIso = () => new Date().toISOString();

// LLM color map
const llmColors = {
  'Claude Sonnet 4.5': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', bar: '#8b5cf6' }, // purple
  'GPT-4': { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', bar: '#22c55e' }, // green
  'Kimi K2': { bg: 'rgba(34,211,238,0.12)', text: '#22d3ee', bar: '#22d3ee' }, // cyan
};

const statusColors = {
  running: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
  queued: { bg: 'rgba(251,191,36,0.15)', text: '#f59e0b' },
  complete: { bg: 'rgba(34,197,94,0.15)', text: '#16a34a' },
};

const initialTasks = [
  {
    id: 1,
    name: 'Product Spec Synthesis',
    status: 'running',
    progress: 42,
    user: 'You',
    llm: 'Claude Sonnet 4.5',
    startTime: nowIso(),
    steps: [
      { name: 'Ingest Requirements', status: 'complete', llm: 'GPT-4', progress: 100, duration: '18s' },
      { name: 'Draft Outline', status: 'running', llm: 'Claude Sonnet 4.5', progress: 55 },
      { name: 'Parallel Critique', status: 'running', llm: 'GPT-4', progress: 38 },
      { name: 'Compliance Review', status: 'queued', llm: 'Kimi K2', progress: 0 },
      { name: 'Finalize Document', status: 'queued', llm: 'Claude Sonnet 4.5', progress: 0 },
    ],
  },
  {
    id: 2,
    name: 'RFP Response Assembly',
    status: 'queued',
    progress: 0,
    user: 'Ava',
    llm: 'GPT-4',
    startTime: nowIso(),
    steps: [
      { name: 'Section Mapping', status: 'queued', llm: 'GPT-4', progress: 0 },
      { name: 'Evidence Pull', status: 'queued', llm: 'Kimi K2', progress: 0 },
      { name: 'Narrative Pass', status: 'queued', llm: 'Claude Sonnet 4.5', progress: 0 },
    ],
  },
  {
    id: 3,
    name: 'Incident Report Triage',
    status: 'complete',
    progress: 100,
    user: 'You',
    llm: 'Kimi K2',
    startTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    duration: '8m',
    steps: [
      { name: 'Extract Entities', status: 'complete', llm: 'Kimi K2', progress: 100, duration: '1m' },
      { name: 'Correlate Signals', status: 'complete', llm: 'GPT-4', progress: 100, duration: '3m' },
      { name: 'Draft Summary', status: 'complete', llm: 'Claude Sonnet 4.5', progress: 100, duration: '4m' },
    ],
  },
  {
    id: 4,
    name: 'Sales Call Notes → CRM',
    status: 'running',
    progress: 63,
    user: 'Liam',
    llm: 'GPT-4',
    startTime: nowIso(),
    steps: [
      { name: 'Transcribe', status: 'complete', llm: 'Kimi K2', progress: 100, duration: '35s' },
      { name: 'Summarize', status: 'running', llm: 'GPT-4', progress: 72 },
      { name: 'Action Items', status: 'running', llm: 'Claude Sonnet 4.5', progress: 41 },
      { name: 'Push to CRM', status: 'queued', llm: 'GPT-4', progress: 0 },
    ],
  },
];

function App() {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('team'); // 'individual' | 'team'
  const [query, setQuery] = useState('');
  const [currentUser] = useState('You');
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedId, setSelectedId] = useState(initialTasks[0].id);
  const styleInjected = useRef(false);

  // Inject Inter font and global CSS variables + animations
  useEffect(() => {
    if (!styleInjected.current) {
      const link1 = document.createElement('link');
      link1.rel = 'preconnect';
      link1.href = 'https://fonts.googleapis.com';
      const link2 = document.createElement('link');
      link2.rel = 'preconnect';
      link2.href = 'https://fonts.gstatic.com';
      link2.crossOrigin = 'anonymous';
      const link3 = document.createElement('link');
      link3.rel = 'stylesheet';
      link3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
      document.head.appendChild(link1);
      document.head.appendChild(link2);
      document.head.appendChild(link3);

      const style = document.createElement('style');
      style.innerHTML = `
        :root {
          --bg: #f7f7fb;
          --panel: #ffffff;
          --text: #0f172a;
          --muted: #475569;
          --border: #e5e7eb;
          --indigo: #6366f1;
          --purple: #8b5cf6;
          --green: #16a34a;
          --amber: #f59e0b;
          --red: #ef4444;
        }
        [data-theme="dark"] {
          --bg: #0b1220;
          --panel: #0f172a;
          --text: #e5e7eb;
          --muted: #94a3b8;
          --border: #1f2937;
          --indigo: #818cf8;
          --purple: #a78bfa;
          --green: #22c55e;
          --amber: #fbbf24;
          --red: #f87171;
        }
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; }
        body { margin: 0; font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: var(--bg); color: var(--text); }
        .shadow-soft { box-shadow: 0 10px 30px rgba(2,8,23,0.08), 0 2px 6px rgba(2,8,23,0.04); }
        .shadow-inset { box-shadow: inset 0 0 0 1px var(--border); }
        .focus-ring:focus { outline: 2px solid var(--indigo); outline-offset: 2px; }
        .badge { border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .metric { border-radius: 12px; padding: 16px; }
        .grid { display: grid; gap: 16px; }
        .grid-2 { grid-template-columns: 1fr 400px; }
        @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } .details { position: static !important; height: auto !important; } }
        .progress { height: 8px; width: 100%; border-radius: 999px; background: rgba(148,163,184,0.2); overflow: hidden; }
        .progress > span { display: block; height: 100%; border-radius: 999px; transition: width 200ms ease; }
        .pulse { animation: pulse 1s ease-in-out infinite; }
        @keyframes pulse { 0% { opacity: 1 } 50% { opacity: .5 } 100% { opacity: 1 } }
        .scroll-thin { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,.4) transparent; }
        .scroll-thin::-webkit-scrollbar { height: 8px; width: 8px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: rgba(148,163,184,.4); border-radius: 999px; }
      `;
      document.head.appendChild(style);
      styleInjected.current = true;
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live simulation of task queue updates
  useEffect(() => {
    const id = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === 'complete') return t;
        let newProgress = t.progress;
        const updatedSteps = t.steps.map(s => {
          if (s.status === 'running') {
            const inc = Math.max(1, Math.round(Math.random() * 5));
            const next = Math.min(100, (s.progress || 0) + inc);
            return { ...s, progress: next, status: next >= 100 ? 'complete' : 'running', duration: next >= 100 ? (s.duration || formatDuration(1000 * (30 + Math.floor(Math.random() * 90)))) : s.duration };
          }
          return s;
        });

        // Transition queued → running if no running steps
        const hasRunning = updatedSteps.some(s => s.status === 'running');
        const hasQueued = updatedSteps.some(s => s.status === 'queued');
        let steps = updatedSteps;
        if (!hasRunning && hasQueued) {
          steps = updatedSteps.map(s => (s.status === 'queued' && Math.random() > 0.5 ? { ...s, status: 'running', progress: 1 } : s));
        }

        // Update task aggregate progress
        const avg = Math.round(steps.reduce((a, s) => a + (s.progress || 0), 0) / steps.length);
        newProgress = Math.max(newProgress, avg);

        const allComplete = steps.every(s => s.status === 'complete');
        return {
          ...t,
          steps,
          progress: allComplete ? 100 : newProgress,
          status: allComplete ? 'complete' : (steps.some(s => s.status === 'running') ? 'running' : t.status === 'queued' && hasQueued ? 'queued' : t.status),
          duration: allComplete ? formatDuration(Date.now() - new Date(t.startTime).getTime()) : t.duration,
        };
      }))
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const filteredTasks = useMemo(() => {
    const scope = view === 'individual' ? tasks.filter(t => t.user === currentUser) : tasks;
    if (!query.trim()) return scope;
    const q = query.toLowerCase();
    return scope.filter(t => t.name.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.llm.toLowerCase().includes(q));
  }, [tasks, view, currentUser, query]);

  const counts = useMemo(() => ({
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    queued: tasks.filter(t => t.status === 'queued').length,
    complete: tasks.filter(t => t.status === 'complete').length,
  }), [tasks]);

  const selected = tasks.find(t => t.id === selectedId) || filteredTasks[0];

  const headerStyle = {
    position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--border)'
  };

  const cardStyle = {
    background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 16
  };

  const iconButton = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', transition: 'background 200ms ease'
  };

  const statusBadge = (status) => ({
    ...statusColors[status],
  });

  const llmBadge = (llm) => ({
    background: (llmColors[llm]?.bg) || 'rgba(99,102,241,0.12)',
    color: (llmColors[llm]?.text) || 'var(--indigo)'
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={headerStyle} aria-label="Sticky Header">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div aria-label="Logo" style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--indigo), var(--purple))' }} />
            <div>
              <div style={{ fontWeight: 700 }}>OPS Orchestrator</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Privacy-first ERP Task Queue</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div role="group" aria-label="View Toggle" style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <button className="focus-ring" onClick={() => setView('individual')} aria-pressed={view==='individual'} style={{ ...iconButton, border: 'none', background: view==='individual' ? 'rgba(99,102,241,0.12)' : 'transparent' }}>
                <User size={16} /> Individual
              </button>
              <button className="focus-ring" onClick={() => setView('team')} aria-pressed={view==='team'} style={{ ...iconButton, border: 'none', background: view==='team' ? 'rgba(99,102,241,0.12)' : 'transparent' }}>
                <Users size={16} /> Team
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input aria-label="Search tasks" value={query} onChange={e=>setQuery(e.target.value)} className="focus-ring" style={{ padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }} placeholder="Search" />
            </div>
            <button className="focus-ring" aria-label="Toggle Theme" onClick={() => setTheme(t => t==='light' ? 'dark' : 'light')} style={{ ...iconButton }}>
              {theme==='light' ? <Moon size={16} /> : <Sun size={16} />} Theme
            </button>
          </div>
        </div>
      </header>

      {/* Hero with Spline cover */}
      <div style={{ position: 'relative', height: 220, width: '100%', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <Spline scene="https://prod.spline.design/LU2mWMPbF3Qi1Qxh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,32,0) 0%, rgba(11,18,32,0.25) 60%, var(--bg) 100%)' }} className="pointer-events-none" />
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 16, width: '100%', maxWidth: 1200, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Live Orchestration</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Multi-LLM parallel processing with real-time visibility</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--indigo)' }}>
              <Loader2 size={14} className="pulse" /> Active
            </span>
            <span className="badge" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>
              <CheckCircle2 size={14} /> Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <section aria-label="Stats" style={{ maxWidth: 1200, margin: '16px auto 0', padding: '0 16px' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          <div className="metric shadow-soft" style={{ ...cardStyle }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Total</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{counts.total}</div>
              <div className="badge" style={{ background: 'rgba(148,163,184,0.15)', color: 'var(--muted)' }}>All</div>
            </div>
          </div>
          <div className="metric shadow-soft" style={{ ...cardStyle }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Running</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--indigo)' }}>{counts.running}</div>
              <div className="badge" style={{ background: statusColors.running.bg, color: statusColors.running.text }}>Live</div>
            </div>
          </div>
          <div className="metric shadow-soft" style={{ ...cardStyle }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Queued</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: statusColors.queued.text }}>{counts.queued}</div>
              <div className="badge" style={{ background: statusColors.queued.bg, color: statusColors.queued.text }}>Waiting</div>
            </div>
          </div>
          <div className="metric shadow-soft" style={{ ...cardStyle }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Complete</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: statusColors.complete.text }}>{counts.complete}</div>
              <div className="badge" style={{ background: statusColors.complete.bg, color: statusColors.complete.text }}>Done</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '16px auto', padding: '0 16px' }}>
        <div className="grid grid-2" style={{ gap: 16 }}>
          {/* Task List */}
          <section aria-label="Task queue" className="shadow-soft" style={{ ...cardStyle, minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Task Queue</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{view==='individual' ? 'Your tasks' : 'Team tasks'}</div>
            </div>
            <div role="list" className="scroll-thin" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflow: 'auto', paddingRight: 6 }}>
              {filteredTasks.map(t => (
                <button key={t.id} role="listitem" onClick={()=> setSelectedId(t.id)} aria-current={selected?.id===t.id} className="focus-ring" style={{ ...cardStyle, borderColor: selected?.id===t.id ? 'var(--indigo)' : 'var(--border)', padding: 12, textAlign: 'left', background: 'var(--panel)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>
                      {t.name}
                    </div>
                    <span className="badge" style={{ background: statusBadge(t.status).bg, color: statusBadge(t.status).text }}>
                      {t.status === 'running' ? <Loader2 size={14} className="pulse" /> : t.status === 'complete' ? <CheckCircle2 size={14} /> : <Clock size={14} />} {t.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
                    <span className="badge" style={{ ...llmBadge(t.llm), padding: '2px 8px' }}>{t.llm}</span>
                    <span>•</span>
                    <span title={t.startTime}>Start {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    <span>•</span>
                    <span>Owner: {t.user}</span>
                    {t.status === 'complete' && (<><span>•</span><span>Duration: {t.duration}</span></>)}
                  </div>
                  {t.status === 'running' && (
                    <div className="progress" aria-label="Task progress" style={{ marginTop: 10 }}>
                      <span style={{ width: `${t.progress}%`, background: 'linear-gradient(90deg, var(--indigo), var(--purple))' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Details Panel */}
          <aside className="details shadow-soft" aria-label="Task details" style={{ ...cardStyle, position: 'sticky', top: 86, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
            {selected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selected.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                      <span className="badge" style={{ ...llmBadge(selected.llm), padding: '2px 8px' }}>{selected.llm}</span>
                      <span>•</span>
                      <span>{selected.status === 'complete' ? 'Completed' : 'Started'} {formatDuration(Date.now() - new Date(selected.startTime).getTime())} ago</span>
                    </div>
                  </div>
                  <span className="badge" style={{ background: statusBadge(selected.status).bg, color: statusBadge(selected.status).text }}>
                    {selected.status === 'running' ? <Play size={14} /> : selected.status === 'complete' ? <CheckCircle2 size={14} /> : <Pause size={14} />}
                    {selected.status}
                  </span>
                </div>

                {selected.status !== 'complete' && (
                  <div className="progress" aria-label="Aggregate progress" style={{ marginTop: 12 }}>
                    <span style={{ width: `${selected.progress}%`, background: 'linear-gradient(90deg, var(--indigo), var(--purple))' }} />
                  </div>
                )}

                <div style={{ marginTop: 16, fontWeight: 600 }}>Pipeline</div>
                <div role="list" className="scroll-thin" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selected.steps.map((s, idx) => {
                    const nextComplete = s.status === 'complete';
                    const color = llmColors[s.llm]?.bar || 'var(--indigo)';
                    return (
                      <div key={idx} role="listitem" style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 999, background: nextComplete ? statusColors.complete.text : (s.status === 'running' ? 'var(--indigo)' : 'rgba(148,163,184,0.6)'), boxShadow: s.status === 'running' ? '0 0 0 6px rgba(99,102,241,0.15)' : 'none' }} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                                <span className="badge" style={{ ...llmBadge(s.llm), padding: '2px 8px' }}>{s.llm}</span>
                                <span>•</span>
                                <span>{s.status}</span>
                                {s.duration && (<><span>•</span><span>{s.duration}</span></>)}
                              </div>
                            </div>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.progress ?? 0}%</div>
                        </div>
                        {(s.status === 'running' || s.status === 'queued') && (
                          <div className="progress" style={{ marginTop: 10 }}>
                            <span style={{ width: `${s.progress || 0}%`, background: color }} />
                          </div>
                        )}
                        {/* Connector line */}
                        {idx < selected.steps.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                            <div style={{ height: 2, flex: 1, background: selected.steps[idx].status === 'complete' ? statusColors.complete.text : 'rgba(148,163,184,0.4)', transition: 'background 200ms ease' }} />
                            <ChevronRight size={14} style={{ color: selected.steps[idx].status === 'complete' ? statusColors.complete.text : 'rgba(148,163,184,0.8)' }} />
                            <div style={{ height: 2, flex: 1, background: selected.steps[idx+1].status === 'complete' ? statusColors.complete.text : 'rgba(148,163,184,0.4)' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)' }}>Select a task to see details</div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer spacing */}
      <div style={{ height: 24 }} />
    </div>
  );
}

export default App;
