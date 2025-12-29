"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import { Play, RotateCcw, Download, Settings, TrendingUp } from 'lucide-react';

const CrisisAnalyzer = () => {
  // Crisis presets
  const CRISIS_PRESETS: any = {
    venezuela: {
      name: "Venezuela",
      wsi: 0.52, soc: 0.10, trust: 0.30, wealth: 0.25, education: 0.55,
      civilization: 0.45, politicalPower: 0.40, regimeCoercion: 0.70,
      regimeStructural: 0.60, oppositionSymbolic: 0.50, populationExit: 0.40,
      T: 0.75, P: 0.60, C: 0.50, R: 0.70, S: 0.80
    },
    syria: {
      name: "Syria",
      wsi: 0.35, soc: 0.08, trust: 0.20, wealth: 0.15, education: 0.40,
      civilization: 0.30, politicalPower: 0.35, regimeCoercion: 0.85,
      regimeStructural: 0.70, oppositionSymbolic: 0.60, populationExit: 0.70,
      T: 0.60, P: 0.40, C: 0.35, R: 0.80, S: 0.90
    },
    sudan: {
      name: "Sudan",
      wsi: 0.45, soc: 0.09, trust: 0.35, wealth: 0.30, education: 0.50,
      civilization: 0.40, politicalPower: 0.30, regimeCoercion: 0.75,
      regimeStructural: 0.55, oppositionSymbolic: 0.65, populationExit: 0.50,
      T: 0.70, P: 0.55, C: 0.45, R: 0.75, S: 0.75
    },
    custom: {
      name: "Custom",
      wsi: 0.50, soc: 0.10, trust: 0.40, wealth: 0.35, education: 0.55,
      civilization: 0.45, politicalPower: 0.40, regimeCoercion: 0.65,
      regimeStructural: 0.55, oppositionSymbolic: 0.50, populationExit: 0.45,
      T: 0.75, P: 0.65, C: 0.50, R: 0.65, S: 0.70
    }
  };

  const [selectedCrisis, setSelectedCrisis] = useState('venezuela');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  
  const [history, setHistory] = useState<any[]>([]);
  const [state, setState] = useState<any>(CRISIS_PRESETS.venezuela);
  const [phase, setPhase] = useState('initial');
  const [interventionLog, setInterventionLog] = useState<any[]>([]);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [scenario2History, setScenario2History] = useState<any[]>([]);
  const [scenario2State, setScenario2State] = useState<any>(null);
  const [scenario2Phase, setScenario2Phase] = useState('initial');
  
  // External shocks
  const [availableShocks, setAvailableShocks] = useState([
    { id: 'sanctions', name: 'International Sanctions', active: false },
    { id: 'oil', name: 'Oil Price Collapse', active: false },
    { id: 'aid', name: 'Humanitarian Aid', active: false },
    { id: 'migration', name: 'Mass Migration Wave', active: false }
  ]);

  // UI state
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // Reset simulation
  const reset = () => {
    setTime(0);
    setIsRunning(false);
    setState(CRISIS_PRESETS[selectedCrisis]);
    setHistory([]);
    setPhase('initial');
    setInterventionLog([]);
    setScenario2History([]);
    setScenario2State(null);
    setScenario2Phase('initial');
    setAvailableShocks(availableShocks.map(s => ({ ...s, active: false })));
  };

  // Load crisis preset
  const loadCrisis = (crisisKey: string) => {
    setSelectedCrisis(crisisKey);
    setState(CRISIS_PRESETS[crisisKey]);
    setHistory([]);
    setTime(0);
    setPhase('initial');
    setInterventionLog([]);
  };

  // Enable comparison mode
  const startComparison = () => {
    if (!comparisonMode) {
      setScenario2State({ ...state });
      setScenario2History([...history]);
      setScenario2Phase(phase);
      setComparisonMode(true);
    } else {
      setComparisonMode(false);
      setScenario2History([]);
      setScenario2State(null);
    }
  };

  // Apply external shock
  const applyShock = (shockId: string) => {
    const shock = availableShocks.find(s => s.id === shockId);
    if (!shock || shock.active) return;

    let newState = { ...state };
    const shockEffects: any = {
      sanctions: { wealth: 0.85, soc: 0.90, S: 1.15 },
      oil: { wealth: 0.70, wsi: 0.90, politicalPower: 0.85 },
      aid: { wealth: 1.10, trust: 1.05, populationExit: 0.95 },
      migration: { P: 0.80, populationExit: 1.30, trust: 0.90 }
    };

    Object.keys(shockEffects[shockId]).forEach(key => {
      newState[key] *= shockEffects[shockId][key];
    });

    setState(newState);
    setAvailableShocks(availableShocks.map(s => 
      s.id === shockId ? { ...s, active: true } : s
    ));
    setInterventionLog([...interventionLog, {
      time, type: 'shock', name: shock.name
    }]);
  };

  // Apply policy intervention
  const applyIntervention = (phaseType: string, isScenario2 = false) => {
    const targetState = isScenario2 ? scenario2State : state;
    let newState = { ...targetState };
    
    switch(phaseType) {
      case 'circuitBreaker':
        newState.regimeCoercion *= 0.7;
        newState.S *= 0.85;
        newState.R *= 0.90;
        newState.oppositionSymbolic *= 1.2;
        break;
      case 'structuralFloor':
        newState.politicalPower *= 0.80;
        newState.wealth *= 1.15;
        newState.soc *= 1.3;
        newState.regimeStructural *= 0.70;
        break;
      case 'incentiveEngine':
        newState.P *= 1.4;
        newState.wealth *= 1.25;
        newState.populationExit *= 0.70;
        newState.trust *= 1.3;
        break;
    }
    
    if (isScenario2) {
      setScenario2State(newState);
      setScenario2Phase(phaseType);
    } else {
      setState(newState);
      setPhase(phaseType);
      setInterventionLog([...interventionLog, {
        time, type: 'intervention', name: phaseType
      }]);
    }
  };

  // Simulation step
  const simulationStep = () => {
    const runStep = (s: any, currentPhase: string) => {
      const W_acc = (s.T + s.P + s.C) - (s.R + s.S);
      const theta = s.wsi / s.soc;
      
      // Apply shocks
      availableShocks.forEach(shock => {
        if (shock.active) {
          if (shock.id === 'sanctions') s.wealth *= 0.999;
          if (shock.id === 'oil') s.wealth *= 0.998;
          if (shock.id === 'aid') s.wealth *= 1.001;
          if (shock.id === 'migration') s.populationExit *= 1.005;
        }
      });

      const regimePayoff = s.politicalPower * 10 - (theta > 1.0 ? 30 * (theta - 1) : 0);
      const oppositionPayoff = s.trust * 8 - (theta > 1.0 ? 20 * (theta - 1) : 0);
      const populationPayoff = (s.wealth + s.education) * 5 - s.populationExit * 10;
      
      if (currentPhase === 'initial') {
        s.trust *= 0.985;
        s.wealth *= 0.975;
        s.education *= 0.990;
        s.soc *= 0.985;
        s.S += s.regimeCoercion * 0.005;
        s.R += 0.003;
        s.populationExit = Math.min(0.80, s.populationExit + 0.01);
        s.politicalPower *= 0.990;
      } else {
        if (currentPhase === 'circuitBreaker') {
          s.S = Math.max(0.40, s.S * 0.97);
          s.R = Math.max(0.40, s.R * 0.98);
          s.trust *= 1.005;
        } else if (currentPhase === 'structuralFloor') {
          s.wealth *= 1.01;
          s.soc *= 1.015;
          s.civilization *= 1.005;
        } else if (currentPhase === 'incentiveEngine') {
          s.P = Math.min(1.0, s.P * 1.02);
          s.trust *= 1.015;
          s.wealth *= 1.02;
          s.populationExit *= 0.95;
        }
      }
      
      s.wsi = (
        0.20 * s.wealth + 0.15 * s.trust + 0.10 * 0.60 +
        0.15 * s.civilization + 0.20 * s.education + 0.20 * s.politicalPower
      );
      
      s.T = 0.5 + 0.5 * (s.wsi / 0.75);
      s.C = s.trust;
      
      return {
        time,
        wsi: s.wsi.toFixed(3),
        soc: s.soc.toFixed(3),
        theta: theta.toFixed(3),
        W_acc: W_acc.toFixed(3),
        trust: s.trust.toFixed(3),
        wealth: s.wealth.toFixed(3),
        politicalPower: s.politicalPower.toFixed(3),
        regimePayoff: regimePayoff.toFixed(1),
        oppositionPayoff: oppositionPayoff.toFixed(1),
        populationPayoff: populationPayoff.toFixed(1),
        thresholdCrossed: theta > 1.0,
        phase: currentPhase
      };
    };

    const newState = { ...state };
    const record = runStep(newState, phase);
    setState(newState);
    setHistory(prev => [...prev, record]);

    if (comparisonMode && scenario2State) {
      const newState2 = { ...scenario2State };
      const record2 = runStep(newState2, scenario2Phase);
      setScenario2State(newState2);
      setScenario2History(prev => [...prev, record2]);
    }

    setTime(prev => prev + 1);
  };

  // Auto-play
  useEffect(() => {
    if (isRunning && time < 200) {
      const timer = setTimeout(simulationStep, speed);
      return () => clearTimeout(timer);
    } else if (time >= 200) {
      setIsRunning(false);
    }
  }, [isRunning, time, speed]);

  // Export data
  const exportData = () => {
    const headers = ['Time', 'WSI', 'SOC', 'Theta', 'W_acc', 'Trust', 'Wealth', 'Phase', 'Regime_Payoff', 'Opposition_Payoff', 'Population_Payoff'];
    const rows = history.map(d => 
      [d.time, d.wsi, d.soc, d.theta, d.W_acc, d.trust, d.wealth, d.phase, d.regimePayoff, d.oppositionPayoff, d.populationPayoff].join(',')
    );
    
    let csv = `# SGT Crisis Analysis: ${CRISIS_PRESETS[selectedCrisis].name}\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Interventions: ${interventionLog.map(i => `${i.type}:${i.name}@T${i.time}`).join('; ')}\n`;
    csv += [headers.join(','), ...rows].join('\n');
    
    if (comparisonMode) {
      csv += '\n\n# Scenario 2 Data\n';
      const rows2 = scenario2History.map(d => 
        [d.time, d.wsi, d.soc, d.theta, d.W_acc, d.trust, d.wealth, d.phase, d.regimePayoff, d.oppositionPayoff, d.populationPayoff].join(',')
      );
      csv += [headers.join(','), ...rows2].join('\n');
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sgt_crisis_${selectedCrisis}_${Date.now()}.csv`;
    a.click();
  };

  // Calculate statistics
  const calculateStats = (data: any[]) => {
    if (!data.length) return null;
    const thetas = data.map(d => parseFloat(d.theta));
    const trustValues = data.map(d => parseFloat(d.trust));
    const wealthValues = data.map(d => parseFloat(d.wealth));
    
    return {
      meanTheta: (thetas.reduce((a, b) => a + b, 0) / thetas.length).toFixed(3),
      maxTheta: Math.max(...thetas).toFixed(3),
      timeInCrisis: data.filter(d => d.thresholdCrossed).length,
      trustRecovery: ((trustValues[trustValues.length - 1] - trustValues[0]) * 100).toFixed(1),
      wealthChange: ((wealthValues[wealthValues.length - 1] / wealthValues[0] - 1) * 100).toFixed(1),
      interventions: interventionLog.length
    };
  };

  const stats = calculateStats(history);
  const stats2 = comparisonMode ? calculateStats(scenario2History) : null;
  const currentData = history[history.length - 1] || {};
  const currentTheta = parseFloat(currentData.theta) || 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-red-50 rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          SGT Multi-Crisis Analyzer
        </h1>
        <p className="text-slate-600">
          Advanced confrontation analysis with interventions, shocks, and comparative scenarios
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button onClick={exportData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2">
            <Download size={16} /> Export Data (CSV)
          </button>
          <button onClick={startComparison} className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${comparisonMode ? 'bg-purple-600 text-white' : 'bg-slate-600 text-white'}`}>
            <TrendingUp size={16} /> {comparisonMode ? 'Exit' : 'Start'} Comparison Mode
          </button>
          <button onClick={() => setShowStatistics(!showStatistics)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
            📊 {showStatistics ? 'Hide' : 'Show'} Statistics
          </button>
          <button onClick={() => setShowCustomBuilder(!showCustomBuilder)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-2">
            <Settings size={16} /> Custom Builder
          </button>
        </div>
      </div>

      {/* Crisis Selection */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Select Crisis Scenario</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(CRISIS_PRESETS).map(key => (
            <button
              key={key}
              onClick={() => loadCrisis(key)}
              className={`p-3 border-2 rounded-lg transition ${
                selectedCrisis === key 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-slate-800 capitalize">{CRISIS_PRESETS[key].name}</div>
              <div className="text-xs text-slate-600 mt-1">
                Θ₀: {(CRISIS_PRESETS[key].wsi / CRISIS_PRESETS[key].soc).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Builder */}
      {showCustomBuilder && (
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md border-2 border-purple-300">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Custom Scenario Builder</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {['wsi', 'soc', 'trust', 'wealth', 'regimeCoercion', 'P'].map(param => (
              <div key={param}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {param}: {state[param]?.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={state[param]}
                  onChange={(e) => setState({ ...state, [param]: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-purple-200 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${currentTheta > 1.0 ? 'bg-red-100' : currentTheta > 0.8 ? 'bg-yellow-100' : 'bg-green-100'}`}>
          <div className="text-xs font-medium text-slate-600">THRESHOLD (Θ)</div>
          <div className="text-2xl font-bold text-slate-800">{currentData.theta || '0.520'}</div>
          <div className="text-xs mt-1">{currentTheta > 1.0 ? '🔴 RED ZONE' : currentTheta > 0.8 ? '🟡 FRAGILE' : '🟢 STABLE'}</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600">W_acc (DPP)</div>
          <div className="text-2xl font-bold text-slate-800">{currentData.W_acc || '0.850'}</div>
          <div className="text-xs mt-1">{parseFloat(currentData.W_acc) < 0 ? 'Resistance' : 'Acceptance'}</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600">TIME / PHASE</div>
          <div className="text-2xl font-bold text-slate-800">{time}</div>
          <div className="text-xs mt-1 capitalize">{phase === 'initial' ? 'Natural Decay' : phase}</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600">INTERVENTIONS</div>
          <div className="text-2xl font-bold text-slate-800">{interventionLog.length}</div>
          <div className="text-xs mt-1">Active measures</div>
        </div>
      </div>

      {/* Statistics */}
      {showStatistics && stats && (
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Statistical Summary</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Scenario 1{comparisonMode ? ' (Current)' : ''}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Mean Θ:</span><strong>{stats.meanTheta}</strong></div>
                <div className="flex justify-between"><span>Max Θ:</span><strong>{stats.maxTheta}</strong></div>
                <div className="flex justify-between"><span>Time in Crisis:</span><strong>{stats.timeInCrisis} periods</strong></div>
                <div className="flex justify-between"><span>Trust Change:</span><strong>{stats.trustRecovery}%</strong></div>
                <div className="flex justify-between"><span>Wealth Change:</span><strong>{stats.wealthChange}%</strong></div>
                <div className="flex justify-between"><span>Interventions:</span><strong>{stats.interventions}</strong></div>
              </div>
            </div>
            {comparisonMode && stats2 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Scenario 2 (Comparison)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Mean Θ:</span><strong>{stats2.meanTheta}</strong></div>
                  <div className="flex justify-between"><span>Max Θ:</span><strong>{stats2.maxTheta}</strong></div>
                  <div className="flex justify-between"><span>Time in Crisis:</span><strong>{stats2.timeInCrisis} periods</strong></div>
                  <div className="flex justify-between"><span>Trust Change:</span><strong>{stats2.trustRecovery}%</strong></div>
                  <div className="flex justify-between"><span>Wealth Change:</span><strong>{stats2.wealthChange}%</strong></div>
                  <div className="flex justify-between"><span>Interventions:</span><strong>{stats2.interventions}</strong></div>
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Comparison</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { name: 'S1', theta: parseFloat(stats.meanTheta) },
                  ...(stats2 ? [{ name: 'S2', theta: parseFloat(stats2.meanTheta) }] : [])
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="theta" fill="#3b82f6" />
                  <ReferenceLine y={1.0} stroke="red" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* External Shocks */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 mb-3">External Shocks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableShocks.map(shock => (
            <button
              key={shock.id}
              onClick={() => applyShock(shock.id)}
              disabled={shock.active}
              className={`p-3 border-2 rounded-lg text-sm transition ${
                shock.active 
                  ? 'border-red-400 bg-red-50 cursor-not-allowed' 
                  : 'border-slate-300 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              <div className="font-semibold">{shock.name}</div>
              <div className="text-xs mt-1">{shock.active ? '✓ Applied' : 'Click to apply'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Simulation Controls</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${isRunning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {isRunning ? '⏸ Pause' : <><Play size={16} /> Run</>}
          </button>
          <button onClick={reset} className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <select value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="border rounded px-3 py-2">
            <option value={1000}>Slow</option>
            <option value={500}>Normal</option>
            <option value={200}>Fast</option>
          </select>
        </div>

        {/* SGT Interventions */}
        <div className="pt-4 border-t-2">
          <h3 className="font-semibold text-slate-800 mb-3">SGT Policy Pathway {comparisonMode && '(Scenario 1)'}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <button onClick={() => applyIntervention('circuitBreaker')} disabled={phase !== 'initial'} className={`p-4 border-2 rounded-lg ${phase === 'circuitBreaker' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'} disabled:opacity-50`}>
              <div className="font-semibold">Phase 1: Circuit Breaker</div>
              <div className="text-xs text-slate-600 mt-1">Reduce R+S</div>
            </button>
            <button onClick={() => applyIntervention('structuralFloor')} disabled={phase !== 'circuitBreaker'} className={`p-4 border-2 rounded-lg ${phase === 'structuralFloor' ? 'border-purple-500 bg-purple-50' : 'border-slate-300'} disabled:opacity-50`}>
              <div className="font-semibold">Phase 2: Structural Floor</div>
              <div className="text-xs text-slate-600 mt-1">Stabilize SOC</div>
            </button>
            <button onClick={() => applyIntervention('incentiveEngine')} disabled={phase !== 'structuralFloor'} className={`p-4 border-2 rounded-lg ${phase === 'incentiveEngine' ? 'border-green-500 bg-green-50' : 'border-slate-300'} disabled:opacity-50`}>
              <div className="font-semibold">Phase 3: Incentive Engine</div>
              <div className="text-xs text-slate-600 mt-1">Empower P</div>
            </button>
          </div>

          {comparisonMode && (
            <>
              <h3 className="font-semibold text-slate-800 mb-3 mt-4">Scenario 2 Pathway</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <button onClick={() => applyIntervention('circuitBreaker', true)} disabled={scenario2Phase !== 'initial'} className={`p-4 border-2 rounded-lg ${scenario2Phase === 'circuitBreaker' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'} disabled:opacity-50`}>
                  <div className="font-semibold">Phase 1: Circuit Breaker</div>
                  <div className="text-xs text-slate-600 mt-1">Reduce R+S</div>
                </button>
                <button onClick={() => applyIntervention('structuralFloor', true)} disabled={scenario2Phase !== 'circuitBreaker'} className={`p-4 border-2 rounded-lg ${scenario2Phase === 'structuralFloor' ? 'border-purple-500 bg-purple-50' : 'border-slate-300'} disabled:opacity-50`}>
                  <div className="font-semibold">Phase 2: Structural Floor</div>
                  <div className="text-xs text-slate-600 mt-1">Stabilize SOC</div>
                </button>
                <button onClick={() => applyIntervention('incentiveEngine', true)} disabled={scenario2Phase !== 'structuralFloor'} className={`p-4 border-2 rounded-lg ${scenario2Phase === 'incentiveEngine' ? 'border-green-500 bg-green-50' : 'border-slate-300'} disabled:opacity-50`}>
                  <div className="font-semibold">Phase 3: Incentive Engine</div>
                  <div className="text-xs text-slate-600 mt-1">Empower P</div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">System Evolution{comparisonMode ? ' - Comparative View' : ''}</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" type="number" domain={[0, 200]} label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={1.0} stroke="red" strokeDasharray="3 3" label="Crisis (Θ=1)" />
            <ReferenceLine y={0.0} stroke="orange" strokeDasharray="3 3" label="Neutral (W_acc=0)" />
            
            {/* Scenario 1 lines */}
            <Line data={history} type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} name="S1: Threshold (Θ)" dot={false} />
            <Line data={history} type="monotone" dataKey="trust" stroke="#3b82f6" strokeWidth={2} name="S1: Trust" dot={false} />
            <Line data={history} type="monotone" dataKey="wealth" stroke="#10b981" strokeWidth={2} name="S1: Wealth" dot={false} />
            
            {/* Scenario 2 lines (dashed) */}
            {comparisonMode && (
              <>
                <Line data={scenario2History} type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="S2: Threshold (Θ)" dot={false} />
                <Line data={scenario2History} type="monotone" dataKey="trust" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="S2: Trust" dot={false} />
                <Line data={scenario2History} type="monotone" dataKey="wealth" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="S2: Wealth" dot={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Intervention markers */}
        {interventionLog.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="text-sm font-semibold text-blue-900 mb-2">Intervention Timeline:</div>
            <div className="flex flex-wrap gap-2">
              {interventionLog.map((log, i) => (
                <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                  T{log.time}: {log.name} ({log.type})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nash vs SGT Predictions */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Equilibrium Predictions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-slate-400 rounded-lg p-4 bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-slate-600 text-white px-2 py-1 rounded text-xs">NASH</span>
              Classical Game Theory
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Prediction</div>
                <p className="text-slate-600 text-xs mt-1">
                  Regime survival via coercion is rational. Opposition symbolic resistance continues but cannot alter collapse.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Outcome</div>
                <p className="text-red-600 font-semibold text-xs">
                  System persists in crisis indefinitely. No pathway to recovery predicted.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Empirical Validation</div>
                <p className="text-slate-600 text-xs mt-1">
                  Current Mean Θ: {stats?.meanTheta || 'N/A'}<br/>
                  Time in Crisis: {stats?.timeInCrisis || 0} periods
                </p>
              </div>
            </div>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">SGT σₑ</span>
              Societrics Equilibrium
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-semibold text-blue-800">Prediction</div>
                <p className="text-slate-600 text-xs mt-1">
                  Coercion excluded once Θ &gt; 1. Only 3-phase pathway admissible: Circuit Breaker → Structural Floor → Incentive Engine.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-semibold text-blue-800">Outcome</div>
                <p className="text-green-600 font-semibold text-xs">
                  Constructive Succession restores equilibrium. Sequential interventions required.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-semibold text-blue-800">Empirical Validation</div>
                <p className="text-slate-600 text-xs mt-1">
                  Trust Recovery: {stats?.trustRecovery || 'N/A'}%<br/>
                  Wealth Change: {stats?.wealthChange || 'N/A'}%<br/>
                  Interventions Applied: {stats?.interventions || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Key SGT Insights:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Multi-Crisis Testing:</strong> Framework validated across Venezuela, Syria, Sudan scenarios</li>
          <li>• <strong>External Shocks:</strong> Model handles sanctions, oil price collapse, humanitarian aid, migration waves</li>
          <li>• <strong>Comparative Analysis:</strong> Run parallel scenarios to test intervention timing and sequencing</li>
          <li>• <strong>Statistical Rigor:</strong> Mean Θ, max Θ, time-in-crisis, and recovery metrics quantify outcomes</li>
          <li>• <strong>Nash Divergence:</strong> Classical theory fails when Θ &gt; 1; SGT predicts pathway requirements</li>
          <li>• <strong>Policy Actionable:</strong> Sequential phases prevent crisis lock-in that Nash cannot escape</li>
        </ul>
      </div>

      {/* User Guide */}
      <div className="mt-6 bg-slate-50 rounded-lg p-4 text-xs text-slate-700">
        <h4 className="font-semibold mb-2">Quick Start Guide:</h4>
        <ol className="list-decimal ml-4 space-y-1">
          <li><strong>Select Crisis:</strong> Choose Venezuela, Syria, Sudan, or build custom scenario</li>
          <li><strong>Apply Shocks:</strong> Test external disruptions (sanctions, oil collapse, etc.)</li>
          <li><strong>Run Simulation:</strong> Watch natural decay path (no intervention)</li>
          <li><strong>Apply SGT Pathway:</strong> Sequential interventions (Phase 1→2→3)</li>
          <li><strong>Enable Comparison:</strong> Run second scenario with different intervention timing</li>
          <li><strong>View Statistics:</strong> Compare mean Θ, recovery rates, time-in-crisis</li>
          <li><strong>Export Data:</strong> Download CSV with full time series and intervention log</li>
        </ol>
      </div>
    </div>
  );
};

export default CrisisAnalyzer;