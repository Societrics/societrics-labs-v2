import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, AreaChart, Area, ScatterChart,
  Scatter, ZAxis, ComposedChart, Bar
} from 'recharts';
import { 
  AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Play, Pause,
  RotateCcw, Download, BookOpen, Settings, Zap, Shield, Target,
  ChevronDown, ChevronUp, Info, Lightbulb, Users, GraduationCap,
  Activity, BarChart3, Layers, GitBranch, Clock, CheckCircle, XCircle,
  Scale // <--- Added this missing one
} from 'lucide-react';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const WSI_WEIGHTS = {
  Wealth: 0.15,
  'Social Trust': 0.20,      // Increased - critical for cheating dynamics
  Religion: 0.10,
  Civilization: 0.15,
  Education: 0.25,           // Increased - directly affected
  'Political Power': 0.15
};
// Weights now sum to 1.0

const TPC_WEIGHTS = {
  'Time-Sense': 0.35,
  'Personal-Sense': 0.35,
  'Cultural Anchoring': 0.30
};

const INITIAL_STATE = {
  wsi: 0.75,
  trust: 0.70,
  education: 0.80,
  wealth: 0.70,
  civilization: 0.75,
  religion: 0.65,
  politicalPower: 0.60,
  tpcTime: 0.65,
  tpcPersonal: 0.70,
  tpcCulture: 0.60
};

const EQUILIBRIUM_ZONES = {
  stable: { min: 0, max: 0.7, color: 'green', label: 'Stable Equilibrium' },
  fragile: { min: 0.7, max: 0.9, color: 'yellow', label: 'Fragile Zone' },
  critical: { min: 0.9, max: 1.0, color: 'orange', label: 'Critical Zone' },
  crisis: { min: 1.0, max: Infinity, color: 'red', label: 'System Crisis' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Sigmoid function for smooth transitions
const sigmoid = (x: number, k: number = 1): number => 1 / (1 + Math.exp(-k * x));

// Clamp value between min and max
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
// Calculate TPC Modifier (0.8 - 1.2)
const calculateTPCModifier = (tpcScore) => {
  if (tpcScore === null || tpcScore === undefined) return 1.0;
  return 0.8 + 0.4 * ((clamp(tpcScore, 1, 7) - 1) / 6);
};

// Get zone based on theta value
const getZone = (theta) => {
  if (theta >= 1.0) return EQUILIBRIUM_ZONES.crisis;
  if (theta >= 0.9) return EQUILIBRIUM_ZONES.critical;
  if (theta >= 0.7) return EQUILIBRIUM_ZONES.fragile;
  return EQUILIBRIUM_ZONES.stable;
};

// Format number for display
const fmt = (n, decimals = 2) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
};

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

const runSimulation = (params) => {
  const {
    cheatingRate,
    timeSteps,
    socLimit,
    trustDecay,
    eduDecay,
    systemCostMult,
    enforcementStart,
    enforcementStrength,
    initialState = INITIAL_STATE
  } = params;

  const data = [];
  
  // Initialize state
  let state = { ...initialState };
  let cumulativeCheats = 0;
  let systemCollapsed = false;
  let collapseTime = null;

  for (let t = 0; t <= timeSteps; t++) {
    // Check if enforcement kicks in
    const isEnforcing = enforcementStart !== null && t >= enforcementStart;
    const effectiveCheatRate = isEnforcing 
      ? cheatingRate * (1 - enforcementStrength)
      : cheatingRate;

    // Calculate cheat instances this period
    const cheatInstances = effectiveCheatRate * 100;
    cumulativeCheats += cheatInstances;

    // === DECAY DYNAMICS ===
    
    // Trust decay (accelerates as trust falls - feedback loop)
    const trustDecayRate = trustDecay * (1 + (1 - state.trust) * 0.5);
    state.trust = clamp(
      state.trust - (cheatInstances * trustDecayRate * 0.01),
      0.1, 1.0
    );

    // Education quality decay
    const eduDecayRate = eduDecay * (1 + (1 - state.education) * 0.3);
    state.education = clamp(
      state.education - (cheatInstances * eduDecayRate * 0.01),
      0.2, 1.0
    );

    // Secondary effects
    state.civilization = clamp(
      state.civilization - (cheatInstances * 0.005 * 0.01),
      0.3, 1.0
    );
    
    // TPC degradation
    state.tpcTime = clamp(state.tpcTime - (cheatInstances * 0.003 * 0.01), 0.3, 1.0);
    state.tpcPersonal = clamp(state.tpcPersonal - (cheatInstances * 0.004 * 0.01), 0.3, 1.0);
    state.tpcCulture = clamp(state.tpcCulture - (cheatInstances * 0.005 * 0.01), 0.3, 1.0);

    // === CALCULATE INDICES ===

    // WSI (normalized weighted average)
    const wsi = (
      WSI_WEIGHTS.Wealth * state.wealth +
      WSI_WEIGHTS['Social Trust'] * state.trust +
      WSI_WEIGHTS.Religion * state.religion +
      WSI_WEIGHTS.Civilization * state.civilization +
      WSI_WEIGHTS.Education * state.education +
      WSI_WEIGHTS['Political Power'] * state.politicalPower
    );

    // TPC Score (1-7 scale)
    const tpcRaw = (
      TPC_WEIGHTS['Time-Sense'] * state.tpcTime +
      TPC_WEIGHTS['Personal-Sense'] * state.tpcPersonal +
      TPC_WEIGHTS['Cultural Anchoring'] * state.tpcCulture
    );
    const tpcScore = 1 + tpcRaw * 6; // Convert to 1-7 scale
    const tpcModifier = calculateTPCModifier(tpcScore);

    // SOC (Standard of Change) - dynamic based on multiple factors
    const socBase = socLimit;
    const socTrustFactor = 0.3 + 0.7 * state.trust;
    const socCultureFactor = 0.5 + 0.5 * state.tpcCulture;
    const soc = socBase * socTrustFactor * socCultureFactor;

    // Theta (threshold ratio) - NOW INCLUDES TPC MODIFIER
    const adjustedWSI = wsi * tpcModifier;
    const theta = adjustedWSI / soc;

    // === DUAL PULL PRINCIPLE (W_acc) ===
    const T = state.tpcTime;
    const P = state.tpcPersonal;
    const C = state.tpcCulture;
    const R = 0.3 + (1 - state.civilization) * 0.3; // Rigidity
    const S = 0.2 + effectiveCheatRate * 0.8; // Social pressure to cheat
    const W_acc = (T + P + C) - (R + S);

    // === SIP TRAP (Signal Interpretation Problem) ===
    const phi = 2 * sigmoid(2 * W_acc) - 1;

    // === PAYOFF CALCULATIONS ===
    const honestPayoff = 10;
    const cheatPayoffBase = 5;
    
    // System cost escalates exponentially when threshold crossed
    const systemCost = theta > 1.0 
      ? systemCostMult * Math.pow(theta - 1, 1.5) * 20 
      : theta > 0.9 
        ? systemCostMult * (theta - 0.9) * 10
        : 0;
    
    // Effective cheat payoff after reclassification
    const cheatPayoffEffective = cheatPayoffBase * Math.max(phi, 0.1) - systemCost;

    // Detect collapse
    if (theta > 1.0 && !systemCollapsed) {
      systemCollapsed = true;
      collapseTime = t;
    }

    // === SOCIETRICS EQUILIBRIUM CONDITIONS ===
    const moralCondition = Math.abs(W_acc - 0.5) < 0.3; // W_acc near balanced
    const strategicCondition = Math.abs(honestPayoff - cheatPayoffEffective) > 2; // Clear dominant strategy
    const structuralCondition = theta < 1.0; // Within SOC capacity
    
    const equilibriumType = structuralCondition && strategicCondition && moralCondition
      ? 'societrics'
      : structuralCondition
        ? 'fragile'
        : 'collapsed';

    // Store data point
    data.push({
      time: t,
      wsi: wsi,
      adjustedWSI: adjustedWSI,
      soc: soc,
      theta: theta,
      trust: state.trust,
      education: state.education,
      civilization: state.civilization,
      tpcScore: tpcScore,
      tpcModifier: tpcModifier,
      W_acc: W_acc,
      phi: phi,
      honestPayoff: honestPayoff,
      cheatPayoff: cheatPayoffEffective,
      systemCost: systemCost,
      thresholdCrossed: theta > 1.0,
      zone: getZone(theta),
      equilibriumType: equilibriumType,
      cumulativeCheats: cumulativeCheats,
      isEnforcing: isEnforcing,
      moralCondition,
      strategicCondition,
      structuralCondition
    });
  }

  return {
    data,
    summary: {
      finalTheta: data[data.length - 1].theta,
      finalTrust: data[data.length - 1].trust,
      finalEducation: data[data.length - 1].education,
      collapsed: systemCollapsed,
      collapseTime,
      totalCheats: cumulativeCheats,
      avgTheta: data.reduce((a, b) => a + b.theta, 0) / data.length,
      peakTheta: Math.max(...data.map(d => d.theta)),
      tippingPoint: data.find(d => d.theta >= 1.0)?.time || null
    }
  };
};

// ============================================================================
// COMPONENTS
// ============================================================================

const InfoTooltip = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <Info className="w-4 h-4 text-slate-400 cursor-help" />
    <div className="hidden group-hover:block absolute z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl -left-28 top-6">
      {text}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
    </div>
  </div>
);

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, info }) => {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700'
  };

  return (
    <div className={`rounded-xl p-4 border-2 ${colorStyles[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {info && <InfoTooltip text={info} />}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ZoneIndicator = ({ theta }) => {
  const zone = getZone(theta);
  const percentage = Math.min(theta * 100, 150);
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">System State</span>
        <span className={`px-2 py-1 rounded-full text-xs font-bold bg-${zone.color}-100 text-${zone.color}-700`}>
          {zone.label}
        </span>
      </div>
      
      {/* Zone bar */}
      <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="absolute inset-y-0 left-0 w-[70%] bg-green-400" />
        <div className="absolute inset-y-0 left-[70%] w-[20%] bg-yellow-400" />
        <div className="absolute inset-y-0 left-[90%] w-[10%] bg-orange-400" />
        <div className="absolute inset-y-0 left-[100%] w-[50%] bg-red-400" />
        
        {/* Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-slate-800 transition-all duration-500"
          style={{ left: `${Math.min(percentage, 150) / 1.5}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Θ = {fmt(theta, 3)}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span>
        <span>0.7</span>
        <span>0.9</span>
        <span>1.0</span>
        <span>1.5+</span>
      </div>
    </div>
  );
};

const EquilibriumComparison = ({ finalState }) => {
  const nashPrediction = "CHEAT";
  const nashReason = "Immediate +5 payoff dominates";
  
  let sgtPrediction, sgtReason, sgtColor;
  
  if (finalState.theta >= 1.0) {
    sgtPrediction = "HONEST (Forced)";
    sgtReason = "Cheat strategy excluded: Θ > 1, system cost exceeds benefit";
    sgtColor = "green";
  } else if (finalState.theta >= 0.9) {
    sgtPrediction = "HONEST (Rational)";
    sgtReason = "Approaching threshold: risk-adjusted payoff favors honesty";
    sgtColor = "blue";
  } else if (finalState.cheatPayoff < finalState.honestPayoff) {
    sgtPrediction = "HONEST (Optimal)";
    sgtReason = "Adjusted payoff: honest > cheat after system costs";
    sgtColor = "green";
  } else {
    sgtPrediction = "MIXED";
    sgtReason = "System stable enough to tolerate some cheating";
    sgtColor = "yellow";
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Nash */}
      <div className="border-2 border-slate-300 rounded-xl p-5 bg-slate-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded-full">NASH</span>
          <span className="font-semibold text-slate-700">Classical Game Theory</span>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-3">
          <p className="text-sm text-slate-500 mb-1">Predicted Strategy:</p>
          <p className="text-xl font-bold text-red-600">{nashPrediction}</p>
          <p className="text-xs text-slate-500 mt-2">{nashReason}</p>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span>Ignores system-level costs</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span>No threshold awareness</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span>Static payoff matrix</span>
          </div>
        </div>
      </div>

      {/* SGT */}
      <div className={`border-2 border-${sgtColor}-400 rounded-xl p-5 bg-${sgtColor}-50`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 bg-${sgtColor}-600 text-white text-xs font-bold rounded-full`}>SGT σₑ</span>
          <span className="font-semibold text-slate-700">Societrics Equilibrium</span>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-3">
          <p className="text-sm text-slate-500 mb-1">Predicted Strategy:</p>
          <p className={`text-xl font-bold text-${sgtColor}-700`}>{sgtPrediction}</p>
          <p className="text-xs text-slate-500 mt-2">{sgtReason}</p>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Structural: |ΔC| ≤ SOC {finalState.structuralCondition ? '✓' : '✗'}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Strategic: Clear dominant {finalState.strategicCondition ? '✓' : '✗'}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Moral: W_acc balanced {finalState.moralCondition ? '✓' : '✗'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DynamicPayoffMatrix = ({ finalState }) => {
  const cells = [
    {
      row: 'Honest',
      col: 'System Holds',
      student: '+10',
      system: '+5',
      label: 'Constructive Win',
      color: 'green',
      active: finalState.theta < 0.7
    },
    {
      row: 'Honest',
      col: 'System Fails',
      student: '+5',
      system: '-5',
      label: 'Frustration Zone',
      color: 'yellow',
      active: finalState.theta >= 0.7 && finalState.theta < 1.0
    },
    {
      row: 'Cheat',
      col: 'System Holds',
      student: '+5 → -15',
      system: '-20',
      label: 'Delayed Crash',
      color: 'orange',
      active: false
    },
    {
      row: 'Cheat',
      col: 'System Fails',
      student: fmt(finalState.cheatPayoff, 1),
      system: '-50',
      label: finalState.theta >= 1.0 ? '⚠ CRISIS' : 'Risk Zone',
      color: 'red',
      active: finalState.theta >= 1.0
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-2 border-slate-300 p-3 bg-slate-100" />
            <th className="border-2 border-slate-300 p-3 bg-slate-100 text-sm">System Holds (Θ &lt; 0.7)</th>
            <th className="border-2 border-slate-300 p-3 bg-slate-100 text-sm">System Fails (Θ ≥ 1.0)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-2 border-slate-300 p-3 font-semibold bg-slate-50">Honest</td>
            <td className={`border-2 border-slate-300 p-3 ${cells[0].active ? 'ring-4 ring-green-400' : ''} bg-green-50`}>
              <div className="font-semibold text-green-700">Student: {cells[0].student}</div>
              <div className="text-sm text-slate-600">System: {cells[0].system}</div>
              <div className="text-xs text-slate-500 mt-1 italic">{cells[0].label}</div>
            </td>
            <td className={`border-2 border-slate-300 p-3 ${cells[1].active ? 'ring-4 ring-yellow-400' : ''} bg-yellow-50`}>
              <div className="font-semibold text-yellow-700">Student: {cells[1].student}</div>
              <div className="text-sm text-slate-600">System: {cells[1].system}</div>
              <div className="text-xs text-slate-500 mt-1 italic">{cells[1].label}</div>
            </td>
          </tr>
          <tr>
            <td className="border-2 border-slate-300 p-3 font-semibold bg-slate-50">Cheat</td>
            <td className={`border-2 border-slate-300 p-3 bg-orange-50`}>
              <div className="font-semibold text-orange-700">Student: {cells[2].student}</div>
              <div className="text-sm text-slate-600">System: {cells[2].system}</div>
              <div className="text-xs text-slate-500 mt-1 italic">{cells[2].label}</div>
            </td>
            <td className={`border-2 border-slate-300 p-3 ${cells[3].active ? 'ring-4 ring-red-400' : ''} bg-red-100`}>
              <div className="font-semibold text-red-700">Student: {cells[3].student}</div>
              <div className="text-sm text-slate-600">System: {cells[3].system}</div>
              <div className={`text-xs mt-1 font-bold ${finalState.theta >= 1.0 ? 'text-red-600' : 'text-slate-500'}`}>
                {cells[3].label}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div className="mt-3 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
        <strong>Current State:</strong> Θ = {fmt(finalState.theta, 3)} | 
        φ (SIP) = {fmt(finalState.phi, 3)} | 
        Effective Cheat Payoff = {fmt(finalState.cheatPayoff, 1)} | 
        System Cost = {fmt(finalState.systemCost, 1)}
      </div>
    </div>
  );
};

const MethodologyPanel = ({ isOpen, onToggle }) => {
  if (!isOpen) return null;
  
  return (
    <div className="bg-white rounded-xl p-6 border-2 border-slate-300 mb-6 shadow-inner">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Mathematical Framework
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">1. Threshold Ratio (Θ)</h3>
            <code className="block bg-slate-200 px-3 py-2 rounded font-mono text-sm">
              Θ(t) = (WSI × TPC_mod) / SOC
            </code>
            <p className="mt-2 text-slate-600">
              Ratio of system strain to adaptive capacity. Crisis occurs at Θ ≥ 1.0
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">2. WSI Calculation</h3>
            <code className="block bg-slate-200 px-3 py-2 rounded font-mono text-xs">
              WSI = Σ(wᵢ × domainᵢ) where Σwᵢ = 1
            </code>
            <p className="mt-2 text-slate-600">
              Weighted sum of 6 domains: Wealth (0.15), Trust (0.20), Religion (0.10), 
              Civilization (0.15), Education (0.25), Political (0.15)
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">3. TPC Modifier</h3>
            <code className="block bg-slate-200 px-3 py-2 rounded font-mono text-sm">
              TPC_mod = 0.8 + 0.4 × ((TPC - 1) / 6)
            </code>
            <p className="mt-2 text-slate-600">
              Scales from 0.8× (constraining) to 1.2× (enabling) based on Time, Personal, Culture factors
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">4. Dual Pull Principle (W_acc)</h3>
            <code className="block bg-blue-100 px-3 py-2 rounded font-mono text-sm">
              W_acc = (T + P + C) - (R + S)
            </code>
            <p className="mt-2 text-blue-700">
              T=Time-sense, P=Personal agency, C=Culture, R=Rigidity, S=Social pressure
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">5. SIP Trap (φ)</h3>
            <code className="block bg-purple-100 px-3 py-2 rounded font-mono text-sm">
              φ = 2σ(2W_acc) - 1
            </code>
            <p className="mt-2 text-purple-700">
              Signal Interpretation Problem: when trust collapses, all signals invert
            </p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-bold text-red-800 mb-2">6. Effective Payoff</h3>
            <code className="block bg-red-100 px-3 py-2 rounded font-mono text-sm">
              P_eff = Base × φ - Cost(Θ)
            </code>
            <p className="mt-2 text-red-700">
              System cost escalates when Θ {'>'} 1, making cheating net-negative
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-bold text-green-800 mb-2">Societrics Equilibrium (σₑ) Conditions</h3>
        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <div className="font-bold text-green-700">Moral</div>
            <div className="text-sm text-green-600">W_acc ≈ 0.5</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-700">Strategic</div>
            <div className="text-sm text-green-600">Clear dominant strategy</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-700">Structural</div>
            <div className="text-sm text-green-600">|ΔC| ≤ SOC (Θ {'<'} 1)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CheatingDilemma = () => {
  // Primary parameters
  const [cheatingRate, setCheatingRate] = useState(0.15);
  const [timeSteps, setTimeSteps] = useState(50);
  
  // Advanced parameters
  const [socLimit, setSocLimit] = useState(0.10);
  const [trustDecay, setTrustDecay] = useState(0.02);
  const [eduDecay, setEduDecay] = useState(0.015);
  const [systemCostMult, setSystemCostMult] = useState(5.0);
  
  // Intervention parameters
  const [enforcementStart, setEnforcementStart] = useState(null);
  const [enforcementStrength, setEnforcementStrength] = useState(0.5);
  
  // UI state
  const [showMethodology, setShowMethodology] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChart, setActiveChart] = useState('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Run simulation
  const simulation = useMemo(() => runSimulation({
    cheatingRate,
    timeSteps,
    socLimit,
    trustDecay,
    eduDecay,
    systemCostMult,
    enforcementStart,
    enforcementStrength
  }), [cheatingRate, timeSteps, socLimit, trustDecay, eduDecay, systemCostMult, enforcementStart, enforcementStrength]);

  const { data, summary } = simulation;
  const finalState = data[data.length - 1] || {};
  const currentState = data[Math.min(playbackTime, data.length - 1)] || finalState;

  // Playback animation
  useEffect(() => {
    if (isPlaying && playbackTime < data.length - 1) {
      const timer = setTimeout(() => setPlaybackTime(p => p + 1), 100);
      return () => clearTimeout(timer);
    } else if (playbackTime >= data.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, playbackTime, data.length]);

  // Preset scenarios
  const loadPreset = (preset) => {
    const presets = {
      low: { cheatingRate: 0.05, trustDecay: 0.015, eduDecay: 0.01 },
      default: { cheatingRate: 0.15, trustDecay: 0.02, eduDecay: 0.015 },
      medium: { cheatingRate: 0.25, trustDecay: 0.025, eduDecay: 0.02 },
      high: { cheatingRate: 0.40, trustDecay: 0.035, eduDecay: 0.025 },
      intervention: { cheatingRate: 0.30, trustDecay: 0.02, eduDecay: 0.015, enforcement: 25 }
    };
    
    const p = presets[preset];
    if (p) {
      setCheatingRate(p.cheatingRate);
      setTrustDecay(p.trustDecay);
      setEduDecay(p.eduDecay);
      if (p.enforcement) setEnforcementStart(p.enforcement);
      else setEnforcementStart(null);
      setPlaybackTime(0);
    }
  };

  // Export data
  const exportData = () => {
    const headers = ['Time', 'WSI', 'AdjustedWSI', 'SOC', 'Theta', 'Trust', 'Education', 'TPC', 'W_acc', 'Phi', 'HonestPayoff', 'CheatPayoff', 'SystemCost'];
    const rows = data.map(d => 
      [d.time, fmt(d.wsi,4), fmt(d.adjustedWSI,4), fmt(d.soc,4), fmt(d.theta,4), fmt(d.trust,4), fmt(d.education,4), fmt(d.tpcScore,4), fmt(d.W_acc,4), fmt(d.phi,4), fmt(d.honestPayoff,2), fmt(d.cheatPayoff,2), fmt(d.systemCost,2)].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sgt_simulation_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                <Scale className="w-8 h-8 text-indigo-600" />
                SGT Cheating Dilemma Simulator
              </h1>
              <p className="text-slate-600 mt-1">
                Nash vs Societrics Equilibrium: How system stability redefines rationality
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                  showMethodology ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Theory
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Methodology Panel */}
        <MethodologyPanel isOpen={showMethodology} />

        {/* Presets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'low', label: 'Low Risk', color: 'green', rate: '5%' },
            { key: 'default', label: 'Baseline', color: 'blue', rate: '15%' },
            { key: 'medium', label: 'Elevated', color: 'yellow', rate: '25%' },
            { key: 'high', label: 'Crisis', color: 'red', rate: '40%' },
            { key: 'intervention', label: 'Intervention', color: 'purple', rate: '30% + fix' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => loadPreset(p.key)}
              className={`p-3 rounded-xl border-2 border-${p.color}-300 bg-${p.color}-50 hover:bg-${p.color}-100 transition`}
            >
              <div className={`font-semibold text-${p.color}-700`}>{p.label}</div>
              <div className="text-xs text-slate-600">{p.rate}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Simulation Parameters
            </h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                Cheating Rate: {(cheatingRate * 100).toFixed(0)}%
                <InfoTooltip text="Percentage of students who cheat per academic cohort" />
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={cheatingRate}
                onChange={(e) => { setCheatingRate(parseFloat(e.target.value)); setPlaybackTime(0); }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                Time Horizon: {timeSteps} years
                <InfoTooltip text="Length of simulation in academic years" />
              </label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={timeSteps}
                onChange={(e) => { setTimeSteps(parseInt(e.target.value)); setPlaybackTime(0); }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-6 pt-6 border-t border-slate-200 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  SOC Limit: {socLimit.toFixed(3)}
                </label>
                <input
                  type="range" min="0.05" max="0.20" step="0.01" value={socLimit}
                  onChange={(e) => setSocLimit(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  Trust Decay: {trustDecay.toFixed(3)}
                </label>
                <input
                  type="range" min="0.01" max="0.05" step="0.005" value={trustDecay}
                  onChange={(e) => setTrustDecay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  Education Decay: {eduDecay.toFixed(3)}
                </label>
                <input
                  type="range" min="0.005" max="0.04" step="0.005" value={eduDecay}
                  onChange={(e) => setEduDecay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  System Cost: {systemCostMult.toFixed(1)}×
                </label>
                <input
                  type="range" min="1" max="10" step="0.5" value={systemCostMult}
                  onChange={(e) => setSystemCostMult(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          )}

          {/* Intervention Control */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-indigo-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Policy Intervention
              </span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enforcementStart !== null}
                  onChange={(e) => setEnforcementStart(e.target.checked ? 25 : null)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-slate-600">Enable</span>
              </label>
            </div>
            
            {enforcementStart !== null && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Start at year: {enforcementStart}</label>
                  <input
                    type="range" min="5" max={timeSteps - 5} step="5" value={enforcementStart}
                    onChange={(e) => setEnforcementStart(parseInt(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Strength: {(enforcementStrength * 100).toFixed(0)}%</label>
                  <input
                    type="range" min="0.1" max="0.9" step="0.1" value={enforcementStrength}
                    onChange={(e) => setEnforcementStrength(parseFloat(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Threshold (Θ)"
            value={fmt(finalState.theta, 3)}
            subtitle={summary.collapsed ? `Collapsed at year ${summary.collapseTime}` : 'System intact'}
            icon={Activity}
            color={finalState.theta >= 1.0 ? 'red' : finalState.theta >= 0.7 ? 'yellow' : 'green'}
            info="Ratio of system strain to adaptive capacity. Crisis at Θ ≥ 1.0"
          />
          <MetricCard
            title="Social Trust"
            value={`${(finalState.trust * 100).toFixed(0)}%`}
            subtitle={`From 70% initial`}
            icon={Users}
            color={finalState.trust < 0.4 ? 'red' : finalState.trust < 0.6 ? 'yellow' : 'blue'}
            trend={((finalState.trust - 0.7) / 0.7) * 100}
            info="Social trust level - affects SOC capacity and payoff interpretation"
          />
          <MetricCard
            title="Education Quality"
            value={`${(finalState.education * 100).toFixed(0)}%`}
            subtitle={`From 80% initial`}
            icon={GraduationCap}
            color={finalState.education < 0.4 ? 'red' : finalState.education < 0.6 ? 'yellow' : 'purple'}
            trend={((finalState.education - 0.8) / 0.8) * 100}
            info="Education quality - degrades with cheating prevalence"
          />
          <MetricCard
            title="TPC Modifier"
            value={fmt(finalState.tpcModifier, 3)}
            subtitle={finalState.tpcModifier >= 1 ? 'Enabling' : 'Constraining'}
            icon={TrendingUp}
            color={finalState.tpcModifier >= 1.1 ? 'green' : finalState.tpcModifier >= 0.95 ? 'blue' : 'orange'}
            info="Time-Personal-Culture modifier (0.8-1.2) applied to WSI"
          />
        </div>

        {/* Zone Indicator */}
        <ZoneIndicator theta={finalState.theta} />

        {/* Equilibrium Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Equilibrium Analysis
          </h2>
          <EquilibriumComparison finalState={finalState} />
        </div>

        {/* Payoff Matrix */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Dynamic Payoff Matrix
          </h2>
          <DynamicPayoffMatrix finalState={finalState} />
        </div>

        {/* Charts */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              System Evolution
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying && playbackTime >= data.length - 1) setPlaybackTime(0); }}
                className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { setPlaybackTime(0); setIsPlaying(false); }}
                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <span className="text-sm text-slate-600 ml-2">
                Year: {currentState.time} / {timeSteps}
              </span>
            </div>
          </div>

          {/* Chart tabs */}
          <div className="flex gap-2 mb-4">
            {['main', 'payoffs', 'tpc'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeChart === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'main' ? 'System Health' : tab === 'payoffs' ? 'Payoff Evolution' : 'TPC Factors'}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            {activeChart === 'main' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" label={{ value: 'Time (years)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[0, 1.5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => fmt(value, 3)}
                />
                <Legend />
                <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Crisis Θ=1', fill: '#ef4444' }} />
                <ReferenceLine y={0.7} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                {enforcementStart && <ReferenceLine x={enforcementStart} stroke="#8b5cf6" strokeDasharray="3 3" label={{ value: 'Intervention', fill: '#8b5cf6' }} />}
                <Line type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} dot={false} name="Threshold (Θ)" />
                <Line type="monotone" dataKey="trust" stroke="#3b82f6" strokeWidth={2} dot={false} name="Trust" />
                <Line type="monotone" dataKey="education" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Education" />
                <Line type="monotone" dataKey="soc" stroke="#10b981" strokeWidth={2} dot={false} name="SOC Capacity" />
              </LineChart>
            ) : activeChart === 'payoffs' ? (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis domain={[-30, 15]} />
                <Tooltip formatter={(value) => fmt(value, 1)} />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                {enforcementStart && <ReferenceLine x={enforcementStart} stroke="#8b5cf6" strokeDasharray="3 3" />}
                <Line type="monotone" dataKey="honestPayoff" stroke="#10b981" strokeWidth={2} dot={false} name="Honest Payoff" />
                <Line type="monotone" dataKey="cheatPayoff" stroke="#ef4444" strokeWidth={2} dot={false} name="Cheat Payoff (Effective)" />
                <Area type="monotone" dataKey="systemCost" fill="#fecaca" stroke="#f87171" fillOpacity={0.3} name="System Cost" />
              </ComposedChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1.3]} />
                <Tooltip formatter={(value) => fmt(value, 3)} />
                <Legend />
                <ReferenceLine y={1.0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="tpcModifier" stroke="#8b5cf6" strokeWidth={3} dot={false} name="TPC Modifier" />
                <Line type="monotone" dataKey="W_acc" stroke="#f59e0b" strokeWidth={2} dot={false} name="W_acc (Dual Pull)" />
                <Line type="monotone" dataKey="phi" stroke="#06b6d4" strokeWidth={2} dot={false} name="φ (SIP Trap)" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
          <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Key Insights
          </h3>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-indigo-800">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>Nash Equilibrium</strong> always predicts "Cheat" (immediate +5 dominates)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>Societrics (σₑ)</strong> excludes "Cheat" when Θ {'>'} 1 due to system collapse</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>TPC Modifier</strong> amplifies or constrains WSI based on cultural factors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>SIP Trap</strong> inverts signal interpretation when trust collapses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>Policy Window</strong> exists before Θ reaches 0.9 - intervention still effective</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span><strong>System Sieve</strong> exposes incompetence over time; short-term gains become losses</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 py-4">
          Societrics Game Theory Simulator • Based on the SGT Cheating Dilemma Framework
        </div>
      </div>
    </div>
  );
};

export default CheatingDilemma;