import { Link } from 'react-router-dom';
import { ShieldCheck, Brain, AlertTriangle, BarChart3, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import ChatWidget from "../../components/chatbot/ChatWidget";
import usePageTitle from '@/hooks/usePageTitle';

const features = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Every petition is automatically categorised, prioritised, and routed to the right department using local AI.', color: 'text-primary-600 bg-primary-50' },
  { icon: AlertTriangle, title: 'Duplicate Detection', desc: 'Our vector-similarity engine detects duplicate petitions instantly, reducing redundant workload for officers.', color: 'text-orange-600 bg-orange-50' },
  { icon: CheckCircle, title: 'Explainable Decisions', desc: 'Officers see exactly why the AI made each recommendation — full transparency, human-first decision making.', color: 'text-accent-600 bg-accent-50' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Real-time dashboards track petition trends, department workloads, and resolution rates across the platform.', color: 'text-purple-600 bg-purple-50' },
  { icon: MapPin, title: 'Location Intelligence', desc: 'Visualise petition density on an interactive map to identify hotspots and allocate resources effectively.', color: 'text-rose-600 bg-rose-50' },
  { icon: ShieldCheck, title: 'Secure & Transparent', desc: 'Role-based access ensures citizens, officers, and admins each see exactly what they need — nothing more.', color: 'text-muted-foreground bg-secondary' },
];

export default function LandingPage() {
  usePageTitle('InsightGov');
  return (
    <div className="min-h-screen bg-card">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="font-bold text-foreground">InsightGov <span className="text-primary-600">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/10 border border-white/20 px-4 py-1.5 text-sm font-medium mb-6">
            <Brain size={14} /> AI-Powered Governance Platform
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 text-balance">
            Smarter Petition Management for Modern Governments
          </h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10 text-balance">
            InsightGov AI analyses citizen petitions in seconds — categorising, prioritising, detecting duplicates,
            and routing to the right department with full explainability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn btn-lg bg-card text-primary-800 hover:bg-primary-50 font-bold shadow-lg">
              Submit a Petition <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-lg bg-card/10 border border-white/30 text-white hover:bg-card/20">
              Officer / Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything your department needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A complete toolkit for efficient, transparent, and accountable petition management.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card hover:shadow-card-hover transition-shadow">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-primary-200 mb-8">Join thousands of citizens making their voices heard through an intelligent, transparent platform.</p>
          <Link to="/register" className="btn btn-lg bg-card text-primary-800 font-bold hover:bg-primary-50">
            Register as Citizen <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 text-center">
        <p className="text-sm text-muted-foreground">© 2026 InsightGov AI — AI-Powered Decision Intelligence Platform</p>
      </footer>
      <ChatWidget />
    </div>
  );
}
