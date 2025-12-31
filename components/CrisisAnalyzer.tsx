import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, AreaChart, Area,
  ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Play, Pause, RotateCcw, Download, Settings, TrendingUp, TrendingDown,
  AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Zap, Shield, Users, BookOpen, Globe, Activity, Target, Layers,
  GitBranch, Clock, Info, Lightbulb, Scale, BarChart3, Map
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const WSI_WEIGHTS = {
  Wealth: 0.20,
  'Social Trust': 0.20,
  Religion: 0.10,
  Civilization: 0.15,
  Education: 0.20,
  'Political Power': 0.15
}; // Sum = 1.0

const TPC_WEIGHTS = {
  'Time-Sense': 0.35,
  'Personal-Sense': 0.35,
  'Cultural Anchoring': 0.30
};

// Crisis scenario presets with full Societrics parameters
const CRISIS_PRESETS = {
  venezuela: {
    id: 'venezuela',
    name: "Venezuela",
    region: "Latin America",
    description: "Authoritarian consolidation with economic collapse",
    color: 'yellow',
    // WSI Fundamentals
    wealth: 0.25,
    trust: 0.30,
    religion: 0.60,
    civilization: 0.45,
    education: 0.55,
    politicalPower: 0.40,
    // TPC Factors
    T: 0.45,  // Time-Sense (low planning efficiency)
    P: 0.35,  // Personal-Sense (low agency)
    C: 0.40,  // Cultural Anchoring (fractured)
    // Resistance/Pressure
    R: 0.70,  // Rigidity (high)
    S: 0.80,  // Social Pressure (high coercion)
    // SOC
    soc: 0.10,
    // Actor-specific
    regimeCoercion: 0.70,
    regimeStructural: 0.60,
    oppositionSymbolic: 0.50,
    populationExit: 0.40
  },
  syria: {
    id: 'syria',
    name: "Syria",
    region: "Middle East",
    description: "Civil war with external intervention",
    color: 'red',
    wealth: 0.15,
    trust: 0.20,
    religion: 0.50,
    civilization: 0.30,
    education: 0.40,
    politicalPower: 0.35,
    T: 0.30,
    P: 0.25,
    C: 0.35,
    R: 0.80,
    S: 0.90,
    soc: 0.08,
    regimeCoercion: 0.85,
    regimeStructural: 0.70,
    oppositionSymbolic: 0.60,
    populationExit: 0.70
  },
  sudan: {
    id: 'sudan',
    name: "Sudan",
    region: "Africa",
    description: "Military coup with civilian resistance",
    color: 'orange',
    wealth: 0.30,
    trust: 0.35,
    religion: 0.55,
    civilization: 0.40,
    education: 0.50,
    politicalPower: 0.30,
    T: 0.50,
    P: 0.45,
    C: 0.45,
    R: 0.75,
    S: 0.75,
    soc: 0.09,
    regimeCoercion: 0.75,
    regimeStructural: 0.55,
    oppositionSymbolic: 0.65,
    populationExit: 0.50
  },
  myanmar: {
    id: 'myanmar',
    name: "Myanmar",
    region: "Southeast Asia",
    description: "Military takeover with mass civil disobedience",
    color: 'purple',
    wealth: 0.35,
    trust: 0.40,
    religion: 0.45,
    civilization: 0.35,
    education: 0.45,
    politicalPower: 0.25,
    T: 0.40,
    P: 0.50,
    C: 0.50,
    R: 0.70,
    S: 0.85,
    soc: 0.085,
    regimeCoercion: 0.80,
    regimeStructural: 0.60,
    oppositionSymbolic: 0.70,
    populationExit: 0.35
  },
  custom: {
    id: 'custom',
    name: "Custom Scenario",
    region: "User Defined",
    description: "Build your own crisis parameters",
    color: 'slate',
    wealth: 0.40,
    trust: 0.45,
    religion: 0.55,
    civilization: 0.50,
    education: 0.55,
    politicalPower: 0.45,
    T: 0.55,
    P: 0.50,
    C: 0.50,
    R: 0.60,
    S: 0.65,
    soc: 0.10,
    regimeCoercion: 0.60,
    regimeStructural: 0.50,
    oppositionSymbolic: 0.50,
    populationExit: 0.40
  }
};

const EXTERNAL_SHOCKS = [
  { 
    id: 'sanctions', 
    name: 'International Sanctions', 
    icon: Globe,
    description: 'Economic isolation from global markets',
    effects: { wealth: 0.85, soc: 0.90, S: 1.15, T: 0.95 },
    ongoingEffects: { wealth: 0.999 }
  },
  { 
    id: 'oil', 
    name: 'Commodity Price Collapse', 
    icon: TrendingDown,
    description: 'Major export revenue collapse',
    effects: { wealth: 0.70, politicalPower: 0.85, P: 0.90 },
    ongoingEffects: { wealth: 0.998 }
  },
  { 
    id: 'aid', 
    name: 'Humanitarian Aid Influx', 
    icon: Shield,
    description: 'International assistance arrives',
    effects: { wealth: 1.10, trust: 1.05, populationExit: 0.95, P: 1.05 },
    ongoingEffects: { wealth: 1.001, trust: 1.0005 }
  },
  { 
    id: 'migration', 
    name: 'Mass Emigration Wave', 
    icon: Users,
    description: 'Brain drain and population flight',
    effects: { P: 0.80, populationExit: 1.30, trust: 0.90, education: 0.95 },
    ongoingEffects: { populationExit: 1.005, P: 0.999 }
  },
  {
    id: 'intervention',
    name: 'Foreign Military Intervention',
    icon: Target,
    description: 'External armed intervention',
    effects: { regimeCoercion: 0.60, S: 0.75, R: 1.20, civilization: 0.80 },
    ongoingEffects: { civilization: 0.998, trust: 0.999 }
  },
  {
    id: 'cyber',
    name: 'Information Warfare',
    icon: Zap,
    description: 'Disinformation and cyber attacks',
    effects: { trust: 0.85, C: 0.90, oppositionSymbolic: 1.15 },
    ongoingEffects: { trust: 0.999, C: 0.9995 }
  }
];

const INTERVENTION_PHASES = {
  circuitBreaker: {
    id: 'circuitBreaker',
    name: 'Circuit Breaker',
    phase: 1,
    description: 'Reduce coercion and social pressure to stop feedback loops',
    color: 'blue',
    icon: Zap,
    effects: { regimeCoercion: 0.7, S: 0.85, R: 0.90, oppositionSymbolic: 1.2 },
    recoveryRates: { S: 0.97, R: 0.98, trust: 1.005 }
  },
  structuralFloor: {
    id: 'structuralFloor',
    name: 'Structural Floor',
    phase: 2,
    description: 'Stabilize institutions and expand system capacity',
    color: 'purple',
    icon: Layers,
    effects: { politicalPower: 0.80, wealth: 1.15, soc: 1.3, regimeStructural: 0.70 },
    recoveryRates: { wealth: 1.01, soc: 1.015, civilization: 1.005 }
  },
  incentiveEngine: {
    id: 'incentiveEngine',
    name: 'Incentive Engine',
    phase: 3,
    description: 'Empower individual agency and rebuild trust',
    color: 'green',
    icon: TrendingUp,
    effects: { P: 1.4, wealth: 1.25, populationExit: 0.70, trust: 1.3 },
    recoveryRates: { P: 1.02, trust: 1.015, wealth: 1.02, populationExit: 0.95 }
  }
};

const EQUILIBRIUM_ZONES = {
  stable: { min: 0, max: 0.7, color: 'green', label: 'Stable', description: 'System can absorb shocks' },
  fragile: { min: 0.7, max: 0.9, color: 'yellow', label: 'Fragile', description: 'Vulnerable to cascading failures' },
  critical: { min: 0.9, max: 1.0, color: 'orange', label: 'Critical', description: 'Approaching breakdown' },
  crisis: { min: 1.0, max: Infinity, color: 'red', label: 'Crisis', description: 'System capacity exceeded' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = (n, decimals = 2) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(decimals);

const calculateTPCModifier = (tpcScore) => {
  if (tpcScore === null || tpcScore === undefined) return 1.0;
  return 0.8 + 0.4 * clamp((tpcScore - 1) / 6, 0, 1);
};

const getZone = (theta) => {
  if (theta >= 1.0) return EQUILIBRIUM_ZONES.crisis;
  if (theta >= 0.9) return EQUILIBRIUM_ZONES.critical;
  if (theta >= 0.7) return EQUILIBRIUM_ZONES.fragile;
  return EQUILIBRIUM_ZONES.stable;
};

const calculateWSI = (state) => {
  return (
    WSI_WEIGHTS.Wealth * state.wealth +
    WSI_WEIGHTS['Social Trust'] * state.trust +
    WSI_WEIGHTS.Religion * state.religion +
    WSI_WEIGHTS.Civilization * state.civilization +
    WSI_WEIGHTS.Education * state.education +
    WSI_WEIGHTS['Political Power'] * state.politicalPower
  );
};

const calculateTPC = (state) => {
  const raw = (
    TPC_WEIGHTS['Time-Sense'] * state.T +
    TPC_WEIGHTS['Personal-Sense'] * state.P +
    TPC_WEIGHTS['Cultural Anchoring'] * state.C
  );
  return 1 + raw * 6; // Convert to 1-7 scale
};

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

const runSimulationStep = (state, phase, activeShocks, shockConfigs) => {
  const newState = { ...state };
  
  // Calculate W_acc (Dual Pull Principle)
  const W_acc = (newState.T + newState.P + newState.C) - (newState.R + newState.S);
  
  // Calculate indices
  const wsi = calculateWSI(newState);
  const tpcScore = calculateTPC(newState);
  const tpcModifier = calculateTPCModifier(tpcScore);
  const adjustedWSI = wsi * tpcModifier;
  
  // Dynamic SOC (affected by trust and culture)
  const socTrustFactor = 0.3 + 0.7 * newState.trust;
  const socCultureFactor = 0.5 + 0.5 * newState.C;
  const effectiveSOC = newState.soc * socTrustFactor * socCultureFactor;
  
  // Theta calculation
  const theta = adjustedWSI / effectiveSOC;
  
  // Apply ongoing shock effects
  activeShocks.forEach(shockId => {
    const shock = shockConfigs.find(s => s.id === shockId);
    if (shock?.ongoingEffects) {
      Object.keys(shock.ongoingEffects).forEach(key => {
        if (newState[key] !== undefined) {
          newState[key] *= shock.ongoingEffects[key];
        }
      });
    }
  });

  // Calculate actor payoffs
  const regimePayoff = newState.politicalPower * 10 - (theta > 1.0 ? 30 * (theta - 1) : 0);
  const oppositionPayoff = newState.trust * 8 + newState.oppositionSymbolic * 5 - (theta > 1.0 ? 20 * (theta - 1) : 0);
  const populationPayoff = (newState.wealth + newState.education) * 5 - newState.populationExit * 10;
  
  // Phase-specific dynamics
  const phaseConfig = INTERVENTION_PHASES[phase];
  
  if (!phaseConfig) {
    // Natural decay (no intervention)
    newState.trust = clamp(newState.trust * 0.985, 0.05, 1);
    newState.wealth = clamp(newState.wealth * 0.975, 0.05, 1);
    newState.education = clamp(newState.education * 0.990, 0.1, 1);
    newState.soc = clamp(newState.soc * 0.985, 0.02, 0.3);
    newState.S = clamp(newState.S + newState.regimeCoercion * 0.005, 0, 1);
    newState.R = clamp(newState.R + 0.003, 0, 1);
    newState.populationExit = clamp(newState.populationExit + 0.01, 0, 0.90);
    newState.politicalPower = clamp(newState.politicalPower * 0.990, 0.1, 1);
    newState.T = clamp(newState.T * 0.995, 0.2, 1);
    newState.P = clamp(newState.P * 0.990, 0.1, 1);
    newState.C = clamp(newState.C * 0.995, 0.2, 1);
  } else {
    // Apply recovery rates from intervention phase
    Object.keys(phaseConfig.recoveryRates).forEach(key => {
      if (newState[key] !== undefined) {
        const rate = phaseConfig.recoveryRates[key];
        if (rate > 1) {
          newState[key] = clamp(newState[key] * rate, 0.05, 1);
        } else {
          newState[key] = clamp(newState[key] * rate, 0.05, 0.95);
        }
      }
    });
  }
  
  // Update derived TPC factors
  newState.T = clamp(0.3 + 0.7 * (wsi / 0.75), 0.2, 1);
  newState.C = clamp(newState.trust * 0.8 + 0.2, 0.2, 1);
  
  return {
    state: newState,
    metrics: {
      wsi,
      tpcScore,
      tpcModifier,
      adjustedWSI,
      soc: effectiveSOC,
      theta,
      W_acc,
      regimePayoff,
      oppositionPayoff,
      populationPayoff,
      zone: getZone(theta),
      thresholdCrossed: theta > 1.0
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
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700'
  };

  return (
    <div className={`rounded-xl p-4 border-2 ${colorMap[color]} transition-all hover:shadow-md`}>
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

const ZoneIndicator = ({ theta, showLabels = true }) => {
  const zone = getZone(theta);
  const percentage = Math.min(theta * 100, 150);
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">System State</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold 
          ${zone.color === 'green' ? 'bg-green-100 text-green-700' : ''}
          ${zone.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
          ${zone.color === 'orange' ? 'bg-orange-100 text-orange-700' : ''}
          ${zone.color === 'red' ? 'bg-red-100 text-red-700' : ''}
        `}>
          {zone.label}
        </span>
      </div>
      
      <div className="relative h-8 bg-slate-100 rounded-full overflow-visible mb-2">
        <div className="absolute inset-y-0 left-0 w-[46.67%] bg-gradient-to-r from-green-400 to-green-500 rounded-l-full" />
        <div className="absolute inset-y-0 left-[46.67%] w-[13.33%] bg-gradient-to-r from-yellow-400 to-yellow-500" />
        <div className="absolute inset-y-0 left-[60%] w-[6.67%] bg-gradient-to-r from-orange-400 to-orange-500" />
        <div className="absolute inset-y-0 left-[66.67%] right-0 bg-gradient-to-r from-red-400 to-red-500 rounded-r-full" />
        
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-slate-900 rounded-full transition-all duration-500 shadow-lg"
          style={{ left: `calc(${Math.min(percentage / 1.5, 100)}% - 3px)` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-bold">
            Θ = {fmt(theta, 3)}
          </div>
        </div>
      </div>
      
      {showLabels && (
        <div className="flex justify-between text-xs text-slate-500 px-1">
          <span>0</span>
          <span>0.7</span>
          <span>0.9</span>
          <span>1.0</span>
          <span>1.5+</span>
        </div>
      )}
      
      <p className="text-xs text-slate-500 mt-2 text-center">{zone.description}</p>
    </div>
  );
};

const CrisisCard = ({ crisis, isSelected, onClick }) => {
  const colorMap = {
    yellow: 'border-yellow-400 bg-yellow-50',
    red: 'border-red-400 bg-red-50',
    orange: 'border-orange-400 bg-orange-50',
    purple: 'border-purple-400 bg-purple-50',
    slate: 'border-slate-400 bg-slate-50'
  };

  const initialTheta = calculateWSI(crisis) / crisis.soc;

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        isSelected 
          ? `${colorMap[crisis.color]} ring-2 ring-offset-2 ring-${crisis.color}-400` 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-slate-800">{crisis.name}</h3>
          <p className="text-xs text-slate-500">{crisis.region}</p>
        </div>
        {isSelected && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
      <p className="text-xs text-slate-600 mb-3">{crisis.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Initial Θ:</span>
        <span className={`font-bold ${initialTheta > 1 ? 'text-red-600' : initialTheta > 0.7 ? 'text-yellow-600' : 'text-green-600'}`}>
          {fmt(initialTheta, 2)}
        </span>
      </div>
    </button>
  );
};

const ShockButton = ({ shock, isActive, onClick }) => {
  const Icon = shock.icon;
  return (
    <button
      onClick={onClick}
      disabled={isActive}
      className={`p-3 rounded-xl border-2 text-left transition-all ${
        isActive 
          ? 'border-red-400 bg-red-50 cursor-not-allowed opacity-75' 
          : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-slate-500'}`} />
        <span className="font-semibold text-sm text-slate-800">{shock.name}</span>
      </div>
      <p className="text-xs text-slate-500">{shock.description}</p>
      <div className="mt-2 text-xs font-medium">
        {isActive ? (
          <span className="text-red-600">✓ Active</span>
        ) : (
          <span className="text-slate-400">Click to apply</span>
        )}
      </div>
    </button>
  );
};

const InterventionButton = ({ phase, currentPhase, onClick, disabled }) => {
  const config = INTERVENTION_PHASES[phase];
  const Icon = config.icon;
  const isActive = currentPhase === phase;
  const canActivate = !disabled;

  const colorMap = {
    blue: { active: 'border-blue-500 bg-blue-50 ring-blue-300', hover: 'hover:border-blue-300' },
    purple: { active: 'border-purple-500 bg-purple-50 ring-purple-300', hover: 'hover:border-purple-300' },
    green: { active: 'border-green-500 bg-green-50 ring-green-300', hover: 'hover:border-green-300' }
  };

  return (
    <button
      onClick={onClick}
      disabled={!canActivate}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        isActive 
          ? `${colorMap[config.color].active} ring-2` 
          : canActivate 
            ? `border-slate-200 bg-white ${colorMap[config.color].hover}` 
            : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isActive ? `bg-${config.color}-500 text-white` : 'bg-slate-100 text-slate-500'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs text-slate-500">Phase {config.phase}</span>
          <h4 className="font-semibold text-slate-800">{config.name}</h4>
        </div>
      </div>
      <p className="text-xs text-slate-600">{config.description}</p>
    </button>
  );
};

const RadarProfile = ({ state, title }) => {
  const data = [
    { subject: 'Wealth', value: state.wealth * 100, fullMark: 100 },
    { subject: 'Trust', value: state.trust * 100, fullMark: 100 },
    { subject: 'Education', value: state.education * 100, fullMark: 100 },
    { subject: 'Civilization', value: state.civilization * 100, fullMark: 100 },
    { subject: 'Political', value: state.politicalPower * 100, fullMark: 100 },
    { subject: 'Agency (P)', value: state.P * 100, fullMark: 100 },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
          <Radar name="State" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const EquilibriumComparison = ({ stats, currentPhase }) => {
  const nashPrediction = "Regime Coercion";
  const nashOutcome = "Crisis persists indefinitely";
  
  let sgtPrediction, sgtOutcome, sgtColor;
  if (currentPhase === 'incentiveEngine') {
    sgtPrediction = "Recovery Path Active";
    sgtOutcome = "System rebuilding toward equilibrium";
    sgtColor = 'green';
  } else if (currentPhase === 'structuralFloor') {
    sgtPrediction = "Stabilization Active";
    sgtOutcome = "Institutions being rebuilt";
    sgtColor = 'purple';
  } else if (currentPhase === 'circuitBreaker') {
    sgtPrediction = "De-escalation Active";
    sgtOutcome = "Breaking destructive feedback loops";
    sgtColor = 'blue';
  } else if (stats?.meanTheta && parseFloat(stats.meanTheta) > 1.0) {
    sgtPrediction = "Intervention Required";
    sgtOutcome = "3-phase pathway needed for recovery";
    sgtColor = 'red';
  } else {
    sgtPrediction = "Monitor & Prepare";
    sgtOutcome = "System fragile but recoverable";
    sgtColor = 'yellow';
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="border-2 border-slate-300 rounded-xl p-5 bg-slate-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded-full">NASH</span>
          <span className="font-semibold text-slate-700">Classical Game Theory</span>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Predicted Strategy:</p>
            <p className="font-bold text-red-600">{nashPrediction}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Predicted Outcome:</p>
            <p className="text-sm text-slate-700">{nashOutcome}</p>
          </div>
        </div>
      </div>

      <div className={`border-2 rounded-xl p-5 
        ${sgtColor === 'green' ? 'border-green-400 bg-green-50' : ''}
        ${sgtColor === 'purple' ? 'border-purple-400 bg-purple-50' : ''}
        ${sgtColor === 'blue' ? 'border-blue-400 bg-blue-50' : ''}
        ${sgtColor === 'red' ? 'border-red-400 bg-red-50' : ''}
        ${sgtColor === 'yellow' ? 'border-yellow-400 bg-yellow-50' : ''}
      `}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 text-white text-xs font-bold rounded-full
            ${sgtColor === 'green' ? 'bg-green-600' : ''}
            ${sgtColor === 'purple' ? 'bg-purple-600' : ''}
            ${sgtColor === 'blue' ? 'bg-blue-600' : ''}
            ${sgtColor === 'red' ? 'bg-red-600' : ''}
            ${sgtColor === 'yellow' ? 'bg-yellow-600' : ''}
          `}>SGT σₑ</span>
          <span className="font-semibold text-slate-700">Societrics Equilibrium</span>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Predicted Strategy:</p>
            <p className={`font-bold
              ${sgtColor === 'green' ? 'text-green-700' : ''}
              ${sgtColor === 'purple' ? 'text-purple-700' : ''}
              ${sgtColor === 'blue' ? 'text-blue-700' : ''}
              ${sgtColor === 'red' ? 'text-red-700' : ''}
              ${sgtColor === 'yellow' ? 'text-yellow-700' : ''}
            `}>{sgtPrediction}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Predicted Outcome:</p>
            <p className="text-sm text-slate-700">{sgtOutcome}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MethodologyPanel = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-slate-300 mb-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        SGT Crisis Framework
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">1. Threshold Ratio (Θ)</h3>
            <code className="block bg-slate-200 px-3 py-2 rounded font-mono text-sm">
              Θ = (WSI × TPC_mod) / SOC
            </code>
            <p className="mt-2 text-slate-600">
              System strain relative to adaptive capacity. Crisis at Θ ≥ 1.0
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-2">2. Actor Payoffs</h3>
            <div className="space-y-1 text-xs font-mono bg-slate-200 p-2 rounded">
              <div>Regime = PP × 10 - 30(Θ-1) if Θ&gt;1</div>
              <div>Opposition = Trust × 8 + Symbolic × 5</div>
              <div>Population = (Wealth + Edu) × 5 - Exit × 10</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">3. Dual Pull Principle</h3>
            <code className="block bg-blue-100 px-3 py-2 rounded font-mono text-sm">
              W_acc = (T + P + C) - (R + S)
            </code>
            <p className="mt-2 text-blue-700">
              Acceptance/Resistance balance determines system trajectory
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">4. SGT Intervention Pathway</h3>
            <ol className="list-decimal ml-4 space-y-1 text-green-700">
              <li><strong>Circuit Breaker:</strong> Stop R+S feedback</li>
              <li><strong>Structural Floor:</strong> Rebuild SOC capacity</li>
              <li><strong>Incentive Engine:</strong> Empower P, restore trust</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CrisisAnalyzer = () => {
  // State
  const [selectedCrisis, setSelectedCrisis] = useState('venezuela');
  const [state, setState] = useState({ ...CRISIS_PRESETS.venezuela });
  const [history, setHistory] = useState([]);
  const [time, setTime] = useState(0);
  const [phase, setPhase] = useState(null);
  const [activeShocks, setActiveShocks] = useState([]);
  const [interventionLog, setInterventionLog] = useState([]);
  
  // Simulation controls
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [maxTime, setMaxTime] = useState(150);
  
  // UI state
  const [showMethodology, setShowMethodology] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [activeChart, setActiveChart] = useState('system');

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    const wsi = calculateWSI(state);
    const tpcScore = calculateTPC(state);
    const tpcModifier = calculateTPCModifier(tpcScore);
    const adjustedWSI = wsi * tpcModifier;
    const socTrustFactor = 0.3 + 0.7 * state.trust;
    const socCultureFactor = 0.5 + 0.5 * state.C;
    const effectiveSOC = state.soc * socTrustFactor * socCultureFactor;
    const theta = adjustedWSI / effectiveSOC;
    const W_acc = (state.T + state.P + state.C) - (state.R + state.S);
    
    return { wsi, tpcScore, tpcModifier, adjustedWSI, soc: effectiveSOC, theta, W_acc, zone: getZone(theta) };
  }, [state]);

  // Statistics
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const thetas = history.map(d => d.theta);
    const trusts = history.map(d => d.trust);
    const wealths = history.map(d => d.wealth);
    
    return {
      meanTheta: fmt(thetas.reduce((a, b) => a + b, 0) / thetas.length, 3),
      maxTheta: fmt(Math.max(...thetas), 3),
      minTheta: fmt(Math.min(...thetas), 3),
      timeInCrisis: history.filter(d => d.theta > 1.0).length,
      trustChange: fmt((trusts[trusts.length - 1] - trusts[0]) * 100, 1),
      wealthChange: fmt((wealths[wealths.length - 1] / wealths[0] - 1) * 100, 1),
      interventions: interventionLog.filter(l => l.type === 'intervention').length,
      shocks: interventionLog.filter(l => l.type === 'shock').length
    };
  }, [history, interventionLog]);

  // Reset
  const reset = useCallback(() => {
    setTime(0);
    setIsRunning(false);
    setState({ ...CRISIS_PRESETS[selectedCrisis] });
    setHistory([]);
    setPhase(null);
    setActiveShocks([]);
    setInterventionLog([]);
  }, [selectedCrisis]);

  // Load crisis
  const loadCrisis = useCallback((crisisId) => {
    setSelectedCrisis(crisisId);
    setState({ ...CRISIS_PRESETS[crisisId] });
    setHistory([]);
    setTime(0);
    setPhase(null);
    setActiveShocks([]);
    setInterventionLog([]);
    setIsRunning(false);
  }, []);

  // Apply shock
  const applyShock = useCallback((shockId) => {
    const shock = EXTERNAL_SHOCKS.find(s => s.id === shockId);
    if (!shock || activeShocks.includes(shockId)) return;

    const newState = { ...state };
    Object.keys(shock.effects).forEach(key => {
      if (newState[key] !== undefined) {
        newState[key] = clamp(newState[key] * shock.effects[key], 0.05, 1);
      }
    });

    setState(newState);
    setActiveShocks([...activeShocks, shockId]);
    setInterventionLog([...interventionLog, { time, type: 'shock', name: shock.name }]);
  }, [state, activeShocks, interventionLog, time]);

  // Apply intervention
  const applyIntervention = useCallback((phaseId) => {
    const phaseConfig = INTERVENTION_PHASES[phaseId];
    if (!phaseConfig) return;

    const newState = { ...state };
    Object.keys(phaseConfig.effects).forEach(key => {
      if (newState[key] !== undefined) {
        newState[key] = clamp(newState[key] * phaseConfig.effects[key], 0.05, 1);
      }
    });

    setState(newState);
    setPhase(phaseId);
    setInterventionLog([...interventionLog, { time, type: 'intervention', name: phaseConfig.name }]);
  }, [state, interventionLog, time]);

  // Simulation step
  const simulationStep = useCallback(() => {
    const result = runSimulationStep(state, phase, activeShocks, EXTERNAL_SHOCKS);
    setState(result.state);
    
    setHistory(prev => [...prev, {
      time,
      ...result.metrics,
      trust: result.state.trust,
      wealth: result.state.wealth,
      education: result.state.education,
      P: result.state.P,
      S: result.state.S,
      R: result.state.R,
      phase: phase || 'initial',
      populationExit: result.state.populationExit
    }]);
    
    setTime(prev => prev + 1);
  }, [state, phase, activeShocks, time]);

  // Auto-play
  useEffect(() => {
    if (isRunning && time < maxTime) {
      const timer = setTimeout(simulationStep, speed);
      return () => clearTimeout(timer);
    } else if (time >= maxTime) {
      setIsRunning(false);
    }
  }, [isRunning, time, speed, maxTime, simulationStep]);

  // Export
  const exportData = useCallback(() => {
    const headers = ['Time', 'WSI', 'TPC', 'AdjWSI', 'SOC', 'Theta', 'W_acc', 'Trust', 'Wealth', 'Education', 'P', 'Phase'];
    const rows = history.map(d => 
      [d.time, fmt(d.wsi,4), fmt(d.tpcScore,4), fmt(d.adjustedWSI,4), fmt(d.soc,4), fmt(d.theta,4), fmt(d.W_acc,4), fmt(d.trust,4), fmt(d.wealth,4), fmt(d.education,4), fmt(d.P,4), d.phase].join(',')
    );
    
    let csv = `# SGT Crisis Analysis: ${CRISIS_PRESETS[selectedCrisis].name}\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Events: ${interventionLog.map(i => `${i.type}:${i.name}@T${i.time}`).join('; ')}\n\n`;
    csv += [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sgt_crisis_${selectedCrisis}_${Date.now()}.csv`;
    a.click();
  }, [history, selectedCrisis, interventionLog]);

  // Can apply intervention?
  const canApplyPhase = (phaseId) => {
    if (phaseId === 'circuitBreaker') return phase === null;
    if (phaseId === 'structuralFloor') return phase === 'circuitBreaker';
    if (phaseId === 'incentiveEngine') return phase === 'structuralFloor';
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                <Globe className="w-8 h-8 text-red-600" />
                SGT Multi-Crisis Analyzer
              </h1>
              <p className="text-slate-600 mt-1">
                Advanced confrontation analysis with interventions, shocks, and policy pathways
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
                onClick={() => setShowStatistics(!showStatistics)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                  showStatistics ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <MethodologyPanel isOpen={showMethodology} />

        {/* Crisis Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5" />
            Select Crisis Scenario
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.values(CRISIS_PRESETS).map(crisis => (
              <CrisisCard
                key={crisis.id}
                crisis={crisis}
                isSelected={selectedCrisis === crisis.id}
                onClick={() => loadCrisis(crisis.id)}
              />
            ))}
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="grid md:grid-cols-5 gap-4">
          <MetricCard
            title="Threshold (Θ)"
            value={fmt(currentMetrics.theta, 3)}
            subtitle={currentMetrics.zone.label}
            icon={Activity}
            color={currentMetrics.zone.color}
            info="System strain / adaptive capacity"
          />
          <MetricCard
            title="WSI (Adjusted)"
            value={fmt(currentMetrics.adjustedWSI, 3)}
            subtitle={`Raw: ${fmt(currentMetrics.wsi, 3)}`}
            icon={Scale}
            color="blue"
            info="Weight Shift Index × TPC Modifier"
          />
          <MetricCard
            title="TPC Modifier"
            value={fmt(currentMetrics.tpcModifier, 3)}
            subtitle={`Score: ${fmt(currentMetrics.tpcScore, 2)}`}
            icon={TrendingUp}
            color={currentMetrics.tpcModifier >= 1 ? 'green' : 'orange'}
            info="Time-Personal-Culture adjustment (0.8-1.2)"
          />
          <MetricCard
            title="W_acc (DPP)"
            value={fmt(currentMetrics.W_acc, 3)}
            subtitle={currentMetrics.W_acc >= 0 ? 'Acceptance' : 'Resistance'}
            icon={GitBranch}
            color={currentMetrics.W_acc >= 0 ? 'green' : 'red'}
            info="Dual Pull: (T+P+C) - (R+S)"
          />
          <MetricCard
            title="Time / Phase"
            value={time}
            subtitle={phase ? INTERVENTION_PHASES[phase]?.name : 'No intervention'}
            icon={Clock}
            color="slate"
          />
        </div>

        {/* Zone Indicator */}
        <ZoneIndicator theta={currentMetrics.theta} />

        {/* Statistics Panel */}
        {showStatistics && stats && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Statistical Summary</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Mean Θ</p>
                <p className="text-2xl font-bold text-slate-800">{stats.meanTheta}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Peak Θ</p>
                <p className="text-2xl font-bold text-slate-800">{stats.maxTheta}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Time in Crisis</p>
                <p className="text-2xl font-bold text-slate-800">{stats.timeInCrisis} periods</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Trust Δ</p>
                <p className={`text-2xl font-bold ${parseFloat(stats.trustChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.trustChange}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Shocks */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            External Shocks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXTERNAL_SHOCKS.map(shock => (
              <ShockButton
                key={shock.id}
                shock={shock}
                isActive={activeShocks.includes(shock.id)}
                onClick={() => applyShock(shock.id)}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition ${
                isRunning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? 'Pause' : 'Run'}
            </button>
            
            <button
              onClick={reset}
              className="px-6 py-3 bg-slate-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            
            <select
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="px-4 py-3 border-2 border-slate-200 rounded-xl font-medium"
            >
              <option value={500}>Slow</option>
              <option value={300}>Normal</option>
              <option value={100}>Fast</option>
              <option value={50}>Very Fast</option>
            </select>
          </div>

          {/* SGT Intervention Pathway */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              SGT Policy Pathway
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <InterventionButton
                phase="circuitBreaker"
                currentPhase={phase}
                onClick={() => applyIntervention('circuitBreaker')}
                disabled={!canApplyPhase('circuitBreaker')}
              />
              <InterventionButton
                phase="structuralFloor"
                currentPhase={phase}
                onClick={() => applyIntervention('structuralFloor')}
                disabled={!canApplyPhase('structuralFloor')}
              />
              <InterventionButton
                phase="incentiveEngine"
                currentPhase={phase}
                onClick={() => applyIntervention('incentiveEngine')}
                disabled={!canApplyPhase('incentiveEngine')}
              />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">System Evolution</h2>
            <div className="flex gap-2">
              {['system', 'actors', 'tpc'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveChart(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeChart === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'system' ? 'System Health' : tab === 'actors' ? 'Actor Payoffs' : 'TPC Factors'}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            {activeChart === 'system' ? (
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1.5]} />
                <Tooltip formatter={(value) => fmt(value, 3)} />
                <Legend />
                <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Crisis Θ=1', fill: '#ef4444', fontSize: 12 }} />
                <Line type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} dot={false} name="Threshold (Θ)" />
                <Line type="monotone" dataKey="trust" stroke="#3b82f6" strokeWidth={2} dot={false} name="Trust" />
                <Line type="monotone" dataKey="wealth" stroke="#10b981" strokeWidth={2} dot={false} name="Wealth" />
                <Line type="monotone" dataKey="soc" stroke="#8b5cf6" strokeWidth={2} dot={false} name="SOC" />
              </LineChart>
            ) : activeChart === 'actors' ? (
              <ComposedChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => fmt(value, 1)} />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line type="monotone" dataKey="regimePayoff" stroke="#ef4444" strokeWidth={2} dot={false} name="Regime" />
                <Line type="monotone" dataKey="oppositionPayoff" stroke="#3b82f6" strokeWidth={2} dot={false} name="Opposition" />
                <Line type="monotone" dataKey="populationPayoff" stroke="#10b981" strokeWidth={2} dot={false} name="Population" />
              </ComposedChart>
            ) : (
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" />
                <YAxis domain={[-1, 2]} />
                <Tooltip formatter={(value) => fmt(value, 3)} />
                <Legend />
                <ReferenceLine y={1.0} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#f97316" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="tpcModifier" stroke="#8b5cf6" strokeWidth={3} dot={false} name="TPC Modifier" />
                <Line type="monotone" dataKey="W_acc" stroke="#f59e0b" strokeWidth={2} dot={false} name="W_acc (DPP)" />
                <Line type="monotone" dataKey="P" stroke="#10b981" strokeWidth={2} dot={false} name="Agency (P)" />
              </LineChart>
            )}
          </ResponsiveContainer>

          {/* Event markers */}
          {interventionLog.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm font-semibold text-indigo-900 mb-2">Event Timeline:</p>
              <div className="flex flex-wrap gap-2">
                {interventionLog.map((log, i) => (
                  <span key={i} className={`text-xs px-3 py-1 rounded-full ${
                    log.type === 'shock' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    T{log.time}: {log.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Equilibrium Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Equilibrium Analysis
          </h2>
          <EquilibriumComparison stats={stats} currentPhase={phase} />
        </div>

        {/* Radar Profile */}
        <div className="grid md:grid-cols-2 gap-6">
          <RadarProfile state={state} title="Current State Profile" />
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Insights
            </h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>TPC Integration:</strong> Modifier now affects Θ calculation directly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Dynamic SOC:</strong> Capacity depends on trust and cultural anchoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Sequential Pathway:</strong> Phases must be applied in order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span><strong>Nash vs SGT:</strong> Classical theory predicts stalemate; SGT predicts recovery path</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 py-4">
          Societrics Game Theory • Multi-Crisis Analysis Framework
        </div>
      </div>
    </div>
  );
};

export default CrisisAnalyzer;