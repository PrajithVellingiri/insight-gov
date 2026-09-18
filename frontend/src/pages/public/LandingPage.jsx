import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Brain, AlertTriangle, BarChart3, MapPin,
  ArrowRight, CheckCircle, Sparkles, Cpu, Layers, Activity, Lock
} from 'lucide-react';
import ChatWidget from "../../components/chatbot/ChatWidget";
import Card3D from "@/components/ui/Card3D";
import BackgroundGrid from "@/components/ui/BackgroundGrid";
import usePageTitle from '@/hooks/usePageTitle';

const features = [
  {
    icon: Brain,
    title: 'AI Decision Intelligence',
    desc: 'Citizen grievances are instantly analysed, categorised, and routed to the correct government ministry with zero manual triage delay.',
    accent: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
  {
    icon: AlertTriangle,
    title: '200m Duplicate Detection',
    desc: 'High-precision geospatial & semantic vector clustering links duplicate complaints in the same vicinity to prevent administrative redundancy.',
    accent: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  {
    icon: CheckCircle,
    title: 'Explainable AI Routing',
    desc: 'Transparent reasoning logs empower officers with confidence metrics and explainability breakdowns for complete public trust.',
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    icon: BarChart3,
    title: 'Executive Command Analytics',
    desc: 'Real-time telemetry tracking grievance volumes, resolution velocity, departmental SLA bottlenecks, and citizen satisfaction.',
    accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
    glow: 'rgba(99, 102, 241, 0.25)',
  },
  {
    icon: MapPin,
    title: 'Geospatial Radar',
    desc: 'Interactive civic density mapping identifies regional infrastructure hotspots for proactive public resource allocation.',
    accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise GovTech Security',
    desc: 'Strict role-based access control, cryptographic authentication, and tamper-resistant audit logs protecting citizen privacy.',
    accent: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    glow: 'rgba(244, 63, 94, 0.25)',
  },
];

export default function LandingPage() {
  usePageTitle('InsightGov — Next-Gen Digital Governance');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (e.clientX / innerWidth - 0.5) * 20,
        y: (e.clientY / innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-blue-500/30 selection:text-white overflow-hidden">
      {/* Dynamic 3D Spatial Background */}
      <BackgroundGrid showNodes={true} />

      {/* Modern Glass Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_18px_rgba(37,99,235,0.4)] border border-blue-400/40">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-base tracking-tight flex items-center gap-1.5">
                InsightGov <span className="text-xs px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30 font-semibold tracking-wider uppercase">AI</span>
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">Digital Governance Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]">Get Started</Link>
          </div>
        </div>
      </header>

      {/* 3D Hero Experience */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Futuristic Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-950/60 border border-blue-500/30 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-[0_0_20px_rgba(37,99,235,0.2)] mb-8 backdrop-blur-md">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            Next-Gen Digital Public Infrastructure & Decision AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-8 text-balance leading-[1.15]">
            Autonomous Civic Intelligence for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
              Modern Governance
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-12 text-balance leading-relaxed font-normal">
            InsightGov powers transparent public administration with sub-second petition triage,
            200m geospatial duplicate verification, and explainable neural routing across 32 state departments.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              to="/register"
              className="btn-primary btn-lg w-full sm:w-auto shadow-[0_0_25px_rgba(37,99,235,0.4)]"
            >
              Submit Citizen Petition <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn-secondary btn-lg w-full sm:w-auto hover:border-slate-500"
            >
              Officer / Command Login
            </Link>
          </div>

          {/* Floating 3D Telemetry Panels (Parallax with mouse) */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y * 0.2}deg) rotateY(${mousePos.x * 0.2}deg)`,
            }}
          >
            <div className="glass-panel-elevated rounded-2xl p-5 text-left relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Cpu size={14} className="text-blue-400" /> Triage Speed
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">&lt; 1.8s</p>
              <p className="text-xs text-muted-foreground mt-1">AI classification & routing</p>
            </div>

            <div className="glass-panel-elevated rounded-2xl p-5 text-left relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-400" /> Duplicate Radar
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">200m</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">99.2%</p>
              <p className="text-xs text-muted-foreground mt-1">Geospatial match accuracy</p>
            </div>

            <div className="glass-panel-elevated rounded-2xl p-5 text-left relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity size={14} className="text-indigo-400" /> State Ministries
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Connected</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">32</p>
              <p className="text-xs text-muted-foreground mt-1">Automated department queues</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Features Showcase */}
      <section className="py-24 px-6 relative border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 block">Architected for Scalability</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              A Complete Platform for Transparent Governance
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Every workflow is engineered for high reliability, auditability, and speed to guarantee that civic complaints never get lost in bureaucratic silos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, accent, glow }) => (
              <Card3D key={title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm flex-shrink-0 ${accent}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Banner */}
      <section className="py-20 px-6 relative border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto glass-panel-elevated rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />

          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-400 mb-6 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Lock size={26} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-4 tracking-tight">
            Ready to experience intelligent public governance?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            Join citizens and government officials in modernizing civic resolution with transparency, precision, and speed.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-primary btn-lg shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              Register as Citizen <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/80 bg-slate-950/80 text-center relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" />
            <span className="font-semibold text-foreground">InsightGov AI</span>
            <span>— Digital Public Infrastructure</span>
          </div>
          <p>© 2026 InsightGov Platform. All rights reserved.</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
