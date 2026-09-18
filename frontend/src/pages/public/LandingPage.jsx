import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ArrowRight, ArrowUpRight, CheckCircle,
  BarChart3, Activity, Users, Building2
} from 'lucide-react';
import ChatWidget from "../../components/chatbot/ChatWidget";
import usePageTitle from '@/hooks/usePageTitle';

const capabilities = [
  {
    code: '01',
    title: 'Autonomous Triage',
    desc: 'Citizen grievances are instantly analysed, categorised, and routed to the responsible state department with zero manual backlog.',
  },
  {
    code: '02',
    title: 'Geospatial Radar',
    desc: 'Spatial coordinate clustering identifies duplicates within 200m radius to streamline municipal field intervention.',
  },
  {
    code: '03',
    title: 'Verifiable Audit Logs',
    desc: 'Transparent explainability traces provide officers and citizens with confidence metrics and decision criteria.',
  },
  {
    code: '04',
    title: 'Executive Telemetry',
    desc: 'Continuous operational monitoring across ministerial resolution velocity, department workloads, and citizen satisfaction.',
  },
];

export default function LandingPage() {
  usePageTitle('InsightGov — Civic Intelligence Operating System');

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#181817] selection:bg-[#FFF0EB] selection:text-[#F05A3C]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#F7F6F2]/90 backdrop-blur-md border-b border-[#DDDCD7]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#181817]" />
            <span className="font-bold text-sm tracking-tight text-[#181817] font-mono uppercase">
              INSIGHTGOV
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-xs px-3.5 py-1.5">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-xs px-3.5 py-1.5">
              Citizen Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-36 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F05A3C]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#6F6F6A]">
              CIVIC INTELLIGENCE OPERATING SYSTEM
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#181817] uppercase leading-[1.05] mb-8">
            PUBLIC ADMINISTRATION<br />
            MADE <span className="text-[#F05A3C]">INTELLIGENT.</span>
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-[#DDDCD7] my-8">
            <div>
              <p className="text-xs font-mono uppercase text-[#6F6F6A]">Applications.</p>
              <p className="text-sm font-semibold text-[#181817] mt-0.5">Automated Intake</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-[#6F6F6A]">Departments.</p>
              <p className="text-sm font-semibold text-[#181817] mt-0.5">Cross-Ministry</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-[#6F6F6A]">Officers.</p>
              <p className="text-sm font-semibold text-[#181817] mt-0.5">Active Ledgers</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-[#6F6F6A]">Insights.</p>
              <p className="text-sm font-semibold text-[#181817] mt-0.5">Explainable AI</p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-[#6F6F6A] max-w-2xl leading-relaxed mb-8">
            The intelligence layer for public administration. High-precision grievance classification, geospatial duplicate detection, and verifiable resolution tracking in one institutional console.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-cta text-xs px-5 py-3 rounded-md">
              Submit an Application <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn-secondary text-xs px-5 py-3 rounded-md">
              Officer & Command Access <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Typographic Metrics Banner */}
        <div className="mt-16 pt-10 border-t border-[#DDDCD7] grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block mb-1">
              ROUTING VELOCITY
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#181817] font-mono">
              &lt; 1.8s
            </div>
            <p className="text-xs text-[#6F6F6A] mt-1">Autonomous classification</p>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#F05A3C] block mb-1">
              CLUSTER RADAR
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F05A3C] font-mono">
              200m
            </div>
            <p className="text-xs text-[#6F6F6A] mt-1">Spatial duplicate threshold</p>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block mb-1">
              CONNECTED MINISTRIES
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#181817] font-mono">
              32
            </div>
            <p className="text-xs text-[#6F6F6A] mt-1">Public administration queues</p>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6F6F6A] block mb-1">
              DISPATCH PRECISION
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#181817] font-mono">
              99.2%
            </div>
            <p className="text-xs text-[#6F6F6A] mt-1">Classification accuracy</p>
          </div>
        </div>
      </section>

      {/* System Capabilities Section */}
      <section className="py-20 px-6 border-t border-[#DDDCD7] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
              CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#181817] uppercase tracking-tight">
              Operational Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#DDDCD7]">
            <div className="space-y-8 pr-0 md:pr-8">
              {capabilities.slice(0, 2).map(({ code, title, desc }) => (
                <div key={title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F05A3C]">{code}</span>
                    <h3 className="text-base font-bold text-[#181817]">{title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6F6F6A] leading-relaxed pl-6 border-l border-[#DDDCD7]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-8 pt-8 md:pt-0 pl-0 md:pl-8">
              {capabilities.slice(2, 4).map(({ code, title, desc }) => (
                <div key={title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F05A3C]">{code}</span>
                    <h3 className="text-base font-bold text-[#181817]">{title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6F6F6A] leading-relaxed pl-6 border-l border-[#DDDCD7]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charcoal Intelligence Highlight Panel */}
      <section className="py-20 px-6 border-t border-[#DDDCD7] bg-[#181817] text-[#F7F6F2]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#292927] border border-[#292927]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F05A3C]" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#F05A3C]">
              INSIGHTGOV INTELLIGENCE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
            High-Authority Public Administration
          </h2>

          <p className="text-sm sm:text-base text-[#A3A39E] max-w-xl mx-auto leading-relaxed">
            Eliminating bureaucratic opacity with verifiable reasoning, multi-department telemetry, and grounded public policy references.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-cta text-xs px-6 py-3 rounded-md">
              Submit Application
            </Link>
            <Link to="/login" className="bg-[#292927] hover:bg-[#333330] text-white border border-[#3A3A37] text-xs font-semibold uppercase px-6 py-3 rounded-md transition-colors">
              Access Console
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#DDDCD7] bg-[#F7F6F2]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6F6F6A]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-[#181817]" />
            <span className="font-bold text-[#181817]">INSIGHTGOV</span>
            <span>/ Civic Intelligence System</span>
          </div>
          <p>© 2026 InsightGov. Government, made intelligible.</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
