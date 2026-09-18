import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Brain, AlertTriangle, BarChart3, MapPin,
  ArrowRight, CheckCircle, Lock, ArrowUpRight
} from 'lucide-react';
import ChatWidget from "../../components/chatbot/ChatWidget";
import usePageTitle from '@/hooks/usePageTitle';

const principles = [
  {
    num: '01',
    icon: Brain,
    title: 'Intelligent Autonomous Triage',
    desc: 'Citizen grievances are instantly analysed, categorised, and routed to the corresponding state ministry, eliminating procedural delays.',
    tag: 'Triage Engine',
  },
  {
    num: '02',
    icon: AlertTriangle,
    title: 'Geospatial Duplicate Radar',
    desc: 'High-precision coordinate clustering links complaints within a 200m radius to eliminate duplicate workloads and coordinate action.',
    tag: '200m Cluster Radius',
  },
  {
    num: '03',
    icon: CheckCircle,
    title: 'Verifiable Explainability',
    desc: 'Transparent reasoning logs empower officers with confidence metrics and explainability breakdowns for complete public trust.',
    tag: 'Explainable AI',
  },
  {
    num: '04',
    icon: BarChart3,
    title: 'Executive Telemetry & SLAs',
    desc: 'Comprehensive oversight tracking petition volumes, departmental turnaround velocity, and bottleneck prevention across ministries.',
    tag: 'Real-time Metrics',
  },
  {
    num: '05',
    icon: MapPin,
    title: 'Regional Density Mapping',
    desc: 'Civic heatmaps reveal localized infrastructure patterns, enabling municipal administrators to deploy proactive civic resources.',
    tag: 'Civic Mapping',
  },
  {
    num: '06',
    icon: Lock,
    title: 'Public Sector Governance Standard',
    desc: 'Strict role-based access control, cryptographic verification, and tamper-resistant audit trails protecting citizen integrity.',
    tag: 'Data Integrity',
  },
];

export default function LandingPage() {
  usePageTitle('InsightGov — Modern Digital Governance Platform');

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#202522] selection:bg-[#315C4A]/20 selection:text-[#202522]">
      {/* Editorial Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5DE]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#315C4A] text-white">
              <Shield size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#202522] text-sm tracking-tight leading-none">
                InsightGov
              </span>
              <span className="text-[10px] text-[#68716B] tracking-wider uppercase font-medium mt-0.5">
                Digital Governance Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm">Citizen Portal</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4F0] border border-[#D4E2D8] text-[#315C4A] text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#315C4A]" />
            Official State Redressal & Autonomous Triage
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#202522] leading-[1.12] mb-6">
            Modern digital governance for transparent civic resolution.
          </h1>

          <p className="text-lg sm:text-xl text-[#68716B] leading-relaxed mb-10 font-normal">
            A reliable, light, and transparent public infrastructure uniting citizens and state departments. Sub-second AI grievance classification, geospatial cluster detection, and verifiable audit trails.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-primary btn-lg">
              Submit a Petition <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Officer & Command Sign In
            </Link>
          </div>
        </div>

        {/* Editorial Architecture Telemetry Grid */}
        <div className="mt-16 pt-12 border-t border-[#E5E5DE] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 shadow-card">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#68716B] block mb-2">
              01 / TRIAGE SPEED
            </span>
            <div className="text-3xl font-bold text-[#202522] font-sans">&lt; 1.8s</div>
            <p className="text-xs text-[#68716B] mt-1">Autonomous routing velocity</p>
          </div>

          <div className="bg-[#FBF9F5] rounded-2xl border border-[#EFE8DC] p-6 shadow-card">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#C58B5B] block mb-2">
              02 / CLUSTER RADAR
            </span>
            <div className="text-3xl font-bold text-[#C58B5B] font-sans">200m</div>
            <p className="text-xs text-[#68716B] mt-1">Geospatial duplicate detection</p>
          </div>

          <div className="bg-[#F2F6F3] rounded-2xl border border-[#DFE9E3] p-6 shadow-card">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#315C4A] block mb-2">
              03 / MINISTRIES
            </span>
            <div className="text-3xl font-bold text-[#315C4A] font-sans">32</div>
            <p className="text-xs text-[#68716B] mt-1">Connected government queues</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E5DE] p-6 shadow-card">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#9A7B38] block mb-2">
              04 / ACCURACY
            </span>
            <div className="text-3xl font-bold text-[#9A7B38] font-sans">99.2%</div>
            <p className="text-xs text-[#68716B] mt-1">Classification confidence</p>
          </div>
        </div>
      </section>

      {/* Structured Principles Grid */}
      <section className="py-20 px-6 border-t border-[#E5E5DE] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-2">
              02 / SYSTEM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#202522] tracking-tight mb-3">
              Engineered for public accountability and clarity
            </h2>
            <p className="text-sm sm:text-base text-[#68716B] leading-relaxed">
              Every step of petition processing is recorded in open verifiable audit logs to guarantee that civic grievances are neither delayed nor lost in administrative layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map(({ num, icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="bg-[#F8F7F2] rounded-2xl border border-[#E5E5DE] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4D4CA] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#78917F]">{num}</span>
                    <div className="h-9 w-9 rounded-lg bg-white border border-[#E5E5DE] flex items-center justify-center text-[#315C4A]">
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#202522] mb-2">{title}</h3>
                  <p className="text-xs sm:text-sm text-[#68716B] leading-relaxed">{desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E5E5DE]/80">
                  <span className="text-[11px] font-medium text-[#315C4A] bg-[#EFF4F0] px-2.5 py-1 rounded-md border border-[#D4E2D8]">
                    {tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* InsightGov Intelligence Highlight */}
      <section className="py-20 px-6 border-t border-[#E5E5DE] bg-[#F8F7F2]">
        <div className="max-w-4xl mx-auto bg-[#EFF4F0] rounded-3xl border border-[#D4E2D8] p-8 sm:p-12 text-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#315C4A] block mb-3">
            INSIGHTGOV INTELLIGENCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202522] tracking-tight mb-4">
            A trustworthy, explainable civic decision engine
          </h2>
          <p className="text-sm sm:text-base text-[#68716B] max-w-xl mx-auto mb-8 leading-relaxed">
            Unlike opaque systems, InsightGov provides officers and citizens with detailed explanation steps, department match scores, and verified location records.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link to="/register" className="btn-primary btn-lg">
              Begin Citizen Submission <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Officer Portal Access <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="py-10 px-6 border-t border-[#E5E5DE] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#68716B]">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#315C4A]" />
            <span className="font-semibold text-[#202522]">InsightGov</span>
            <span>— State Digital Governance Framework</span>
          </div>
          <p>© 2026 InsightGov. Built for transparent public administration.</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
