import Link from 'next/link';
import { Activity, BrainCircuit, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Societrics<span className="text-blue-500">Labs</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Interactive Multi-Agent Systems & Crisis Simulations.
            Explore the Fourth Generation of Social Science.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
          
          {/* Card 1: Venezuela */}
          <Link href="/venezuela" className="group block p-8 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all">
            <div className="w-12 h-12 bg-red-900/50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="text-red-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Venezuela Crisis Model
            </h2>
            <p className="text-slate-400 mb-6">
              A confrontation analysis simulation demonstrating the SIP Trap and the failure of classical Nash Equilibrium in regime collapse scenarios.
            </p>
            <div className="flex items-center text-sm font-bold text-blue-500">
              Launch Simulation <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Cheating Dilemma */}
          <Link href="/cheating" className="group block p-8 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all">
            <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BrainCircuit className="text-purple-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              The Cheating Dilemma
            </h2>
            <p className="text-slate-400 mb-6">
              {/* FIXED: Changed > to &gt; below */}
              Model the "System Sieve" effect. See how short-term rationality (cheating) leads to long-term systemic collapse (θ &gt; 1).
            </p>
            <div className="flex items-center text-sm font-bold text-blue-500">
              Launch Simulation <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Multi-Crisis Analyzer */}
          <Link href="/analyzer" className="group block p-8 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all md:col-span-2">
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="text-green-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Multi-Crisis Analyzer
            </h2>
            <p className="text-slate-400 mb-6">
              Advanced tool. Compare scenarios (Venezuela, Syria, Sudan) and test the SGT Pathway against external shocks like sanctions and oil collapse.
            </p>
            <div className="flex items-center text-sm font-bold text-blue-500">
              Launch Analyzer <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          {/* Card 4: Assessment Tool */}
          <Link href="/assessment" className="group block p-8 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all md:col-span-2">
            <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="text-indigo-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Field Assessment Tool
            </h2>
            <p className="text-slate-400 mb-6">
              Conduct live Societrics surveys. Calculates WSI, TPC, and CSI indices in real-time for community diagnosis.
            </p>
            <div className="flex items-center text-sm font-bold text-blue-500">
              Start Assessment <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>

        <footer className="mt-16 text-slate-600 text-sm">
          © {new Date().getFullYear()} Societrics Labs. Powered by the Mindbrood Initiative.
        </footer>
      </div>
    </main>
  );
}