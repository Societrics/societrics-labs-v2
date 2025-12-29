import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const CheatingDilemma = () => {
  // Parameters
  const SOC_LIMIT_BASE = 0.08;
  const WSI_EDUCATION_WEIGHT = 0.20;
  const WSI_TRUST_WEIGHT = 0.15;
  const INITIAL_WSI = 0.75;
  const INITIAL_SOC = 0.10;
  const INITIAL_TRUST = 0.70;
  const CHEAT_TRUST_DECAY = 0.02;
  const CHEAT_EDUCATION_DECAY = 0.015;
  const SYSTEM_COST_MULTIPLIER = 5.0;

  // State
  const [cheatingRate, setCheatingRate] = useState(0.15);
  const [timeSteps, setTimeSteps] = useState(50);
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [currentTheta, setCurrentTheta] = useState(0);
  const [equilibriumType, setEquilibriumType] = useState('stable');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  
  // Advanced parameters
  const [socLimit, setSocLimit] = useState(0.10);
  const [trustDecay, setTrustDecay] = useState(0.02);
  const [eduDecay, setEduDecay] = useState(0.015);
  const [systemCostMult, setSystemCostMult] = useState(5.0);

  // Simulation engine
  useEffect(() => {
    const data = [];
    let wsi = INITIAL_WSI;
    let soc = socLimit;
    let trust = INITIAL_TRUST;
    let education = 0.80;
    
    for (let t = 0; t <= timeSteps; t++) {
      // Calculate cheating impact
      const cheatInstances = cheatingRate * 100; // per 100 students
      
      // Trust decay
      trust = Math.max(0.1, trust - (cheatInstances * trustDecay * 0.01));
      
      // Education quality decay
      education = Math.max(0.2, education - (cheatInstances * eduDecay * 0.01));
      
      // WSI calculation (simplified: weighted average of fundamentals)
      wsi = (
        0.15 * 0.70 + // Wealth (stable)
        WSI_TRUST_WEIGHT * trust + // Social Trust
        0.10 * 0.65 + // Religion (stable)
        0.15 * 0.75 + // Civilization (stable)
        WSI_EDUCATION_WEIGHT * education + // Education
        0.20 * 0.60 // Political Power (stable)
      );
      
      // SOC capacity (degrades as trust falls)
      soc = socLimit * (0.5 + 0.5 * trust);
      
      // Theta calculation
      const theta = wsi / soc;
      
      // W_acc approximation (simplified DPP)
      const T = 0.9, P = 0.85, C = trust;
      const R = 0.4, S = 0.3 + (cheatingRate * 0.5);
      const W_acc = (T + P + C) - (R + S);
      
      // SIP Trap: interpretation multiplier
      const phi = 2 / (1 + Math.exp(-2 * W_acc)) - 1;
      
      // Payoffs (before and after reclassification)
      const honestPayoff = 10;
      const cheatPayoffBase = 5;
      const systemCost = theta > 1.0 ? systemCostMult * (theta - 1) * 20 : 0;
      const cheatPayoffEffective = cheatPayoffBase * phi - systemCost;
      
      data.push({
        time: t,
        wsi: wsi.toFixed(3),
        soc: soc.toFixed(3),
        theta: theta.toFixed(3),
        trust: trust.toFixed(3),
        education: education.toFixed(3),
        W_acc: W_acc.toFixed(3),
        phi: phi.toFixed(3),
        honestPayoff: honestPayoff.toFixed(1),
        cheatPayoff: cheatPayoffEffective.toFixed(1),
        thresholdCrossed: theta > 1.0
      });
    }
    
    setSimulationData(data);
    setCurrentTheta(parseFloat(data[data.length - 1].theta));
    
    // Determine equilibrium type
    if (parseFloat(data[data.length - 1].theta) > 1.0) {
      setEquilibriumType('crisis');
    } else if (parseFloat(data[data.length - 1].theta) > 0.8) {
      setEquilibriumType('fragile');
    } else {
      setEquilibriumType('stable');
    }
  }, [cheatingRate, timeSteps, socLimit, trustDecay, eduDecay, systemCostMult]);

  const finalState = simulationData[simulationData.length - 1] || {};
  const nashPrediction = "Cheat (always +5 short-term)";
  const sgtPrediction = finalState.thresholdCrossed 
    ? "Honest (Cheat excluded: θ > 1)" 
    : finalState.theta > 0.8 
      ? "Honest (Cheat risky: θ ≈ 1)"
      : "Either (System stable)";

  // Preset scenarios
  const loadPreset = (preset: string) => {
    switch(preset) {
      case 'low':
        setCheatingRate(0.05);
        setTrustDecay(0.02);
        setEduDecay(0.015);
        break;
      case 'medium':
        setCheatingRate(0.20);
        setTrustDecay(0.03);
        setEduDecay(0.02);
        break;
      case 'high':
        setCheatingRate(0.40);
        setTrustDecay(0.04);
        setEduDecay(0.03);
        break;
      case 'default':
        setCheatingRate(0.15);
        setTrustDecay(0.02);
        setEduDecay(0.015);
        setSocLimit(0.10);
        setSystemCostMult(5.0);
        break;
    }
  };

  // Export data as CSV
  const exportData = () => {
    const headers = ['Time', 'WSI', 'SOC', 'Theta', 'Trust', 'Education', 'W_acc', 'Honest_Payoff', 'Cheat_Payoff'];
    const rows = simulationData.map(d => 
      [d.time, d.wsi, d.soc, d.theta, d.trust, d.education, d.W_acc, d.honestPayoff, d.cheatPayoff].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sgt_cheating_dilemma_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          SGT Cheating Dilemma Simulator
        </h1>
        <p className="text-slate-600">
          Nash vs Societrics Equilibrium: How system stability redefines rationality
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
          >
            📊 Export Data (CSV)
          </button>
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition text-sm"
          >
            📖 {showMethodology ? 'Hide' : 'Show'} Methodology
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
          >
            ⚙️ {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
          </button>
        </div>
      </div>

      {/* Methodology Section */}
      {showMethodology && (
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md border-2 border-slate-300">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Mathematical Methodology</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">1. Threshold Calculation (Θ)</h3>
              <code className="bg-slate-100 px-2 py-1 rounded">Θ(t) = WSI(t) / SOC(t)</code>
              <p className="mt-1 text-slate-600">Where WSI = weighted average of 6 fundamentals, SOC = adaptive capacity</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">2. Dual Pull Principle (W_acc)</h3>
              <code className="bg-slate-100 px-2 py-1 rounded">W_acc = (T + P + C) - (R + S)</code>
              <p className="mt-1 text-slate-600">T=Time sense, P=Personal agency, C=Culture, R=Rigidity, S=Social pressure</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">3. SIP Trap (Signal Interpretation)</h3>
              <code className="bg-slate-100 px-2 py-1 rounded">φ(W_acc) = 2σ(2W_acc) - 1</code>
              <p className="mt-1 text-slate-600">Sigmoid function that flips payoff interpretation when trust collapses</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">4. Effective Payoff (Reclassification)</h3>
              <code className="bg-slate-100 px-2 py-1 rounded">Payoff_eff = Base × φ - SystemCost</code>
              <p className="mt-1 text-slate-600">When Θ &gt; 1, SystemCost escalates, making cheating net-negative</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">5. Societrics Equilibrium (σₑ) Conditions</h3>
              <ul className="list-disc ml-5 mt-1 text-slate-600">
                <li>Moral: W_acc ≈ 1 (balanced acceptance)</li>
                <li>Strategic: u_i = ū (no dominant strategy)</li>
                <li>Structural: |ΔC| ≤ SOC (change within capacity)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Presets */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Scenario Presets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => loadPreset('low')}
            className="p-3 border-2 border-green-300 rounded-lg hover:bg-green-50 transition"
          >
            <div className="font-semibold text-green-700">Low Corruption</div>
            <div className="text-xs text-slate-600 mt-1">5% cheating rate</div>
          </button>
          <button
            onClick={() => loadPreset('default')}
            className="p-3 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition"
          >
            <div className="font-semibold text-blue-700">Default</div>
            <div className="text-xs text-slate-600 mt-1">15% cheating rate</div>
          </button>
          <button
            onClick={() => loadPreset('medium')}
            className="p-3 border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 transition"
          >
            <div className="font-semibold text-yellow-700">Medium Crisis</div>
            <div className="text-xs text-slate-600 mt-1">20% cheating rate</div>
          </button>
          <button
            onClick={() => loadPreset('high')}
            className="p-3 border-2 border-red-300 rounded-lg hover:bg-red-50 transition"
          >
            <div className="font-semibold text-red-700">Systemic Collapse</div>
            <div className="text-xs text-slate-600 mt-1">40% cheating rate</div>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Primary Controls</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cheating Rate: {(cheatingRate * 100).toFixed(0)}%
              <span className="text-xs text-slate-500 ml-2" title="Percentage of students who cheat per cohort">ⓘ</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={cheatingRate}
              onChange={(e) => setCheatingRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">
              Percentage of students who cheat per cohort
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Horizon: {timeSteps} years
              <span className="text-xs text-slate-500 ml-2" title="Length of simulation in academic years">ⓘ</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={timeSteps}
              onChange={(e) => setTimeSteps(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">
              Simulation length (academic years)
            </p>
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <h3 className="text-md font-bold text-slate-800 mb-4">Advanced Parameters</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SOC Limit: {socLimit.toFixed(3)}
                  <span className="text-xs text-slate-500 ml-2" title="Standard of Change - system's adaptive capacity">ⓘ</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.20"
                  step="0.01"
                  value={socLimit}
                  onChange={(e) => setSocLimit(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum sustainable rate of change</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Trust Decay Rate: {trustDecay.toFixed(3)}
                  <span className="text-xs text-slate-500 ml-2" title="How much each cheat instance reduces social trust">ⓘ</span>
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.05"
                  step="0.005"
                  value={trustDecay}
                  onChange={(e) => setTrustDecay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">Trust erosion per cheat instance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Education Decay Rate: {eduDecay.toFixed(3)}
                  <span className="text-xs text-slate-500 ml-2" title="How much each cheat instance reduces education quality">ⓘ</span>
                </label>
                <input
                  type="range"
                  min="0.005"
                  max="0.04"
                  step="0.005"
                  value={eduDecay}
                  onChange={(e) => setEduDecay(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">Education quality erosion per cheat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Cost Multiplier: {systemCostMult.toFixed(1)}x
                  <span className="text-xs text-slate-500 ml-2" title="Amplification factor when threshold is crossed">ⓘ</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={systemCostMult}
                  onChange={(e) => setSystemCostMult(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">Penalty escalation after crisis</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current State Dashboard */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${
          equilibriumType === 'crisis' ? 'bg-red-100' : 
          equilibriumType === 'fragile' ? 'bg-yellow-100' : 
          'bg-green-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Threshold Ratio (Θ)</span>
            {equilibriumType === 'crisis' ? <AlertCircle className="text-red-600" size={20} /> :
             equilibriumType === 'fragile' ? <AlertTriangle className="text-yellow-600" size={20} /> :
             <TrendingUp className="text-green-600" size={20} />}
          </div>
          <p className="text-2xl font-bold text-slate-800">{finalState.theta}</p>
          <p className="text-xs text-slate-600 mt-1">
            {currentTheta > 1.0 ? 'CRISIS: System breached' : 
             currentTheta > 0.8 ? 'WARNING: Approaching limit' : 
             'STABLE: System healthy'}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="text-sm font-medium text-slate-700 mb-2">Trust Level</div>
          <p className="text-2xl font-bold text-slate-800">{(parseFloat(finalState.trust) * 100).toFixed(0)}%</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${parseFloat(finalState.trust) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="text-sm font-medium text-slate-700 mb-2">Education Quality</div>
          <p className="text-2xl font-bold text-slate-800">{(parseFloat(finalState.education) * 100).toFixed(0)}%</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${parseFloat(finalState.education) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Equilibrium Comparison */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Equilibrium Predictions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-slate-300 rounded-lg p-4">
            <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
              <span className="bg-slate-600 text-white px-2 py-1 rounded text-xs mr-2">NASH</span>
              Classical Game Theory
            </h3>
            <p className="text-slate-600 mb-3 text-sm">
              Maximizes individual utility, ignores system cost
            </p>
            <div className="bg-slate-50 rounded p-3">
              <p className="text-sm text-slate-600 mb-1">Predicted Strategy:</p>
              <p className="font-bold text-slate-800">{nashPrediction}</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ✗ Does not account for threshold crossing or payoff reclassification
            </p>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-slate-700 mb-2 flex items-center">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">SGT σₑ</span>
              Societrics Equilibrium
            </h3>
            <p className="text-slate-600 mb-3 text-sm">
              Requires moral, strategic, and structural conditions
            </p>
            <div className="bg-white rounded p-3">
              <p className="text-sm text-slate-600 mb-1">Predicted Strategy:</p>
              <p className="font-bold text-blue-800">{sgtPrediction}</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ✓ Excludes strategies that breach SOC limit (|ΔC| ≤ SOC)
            </p>
          </div>
        </div>
      </div>

      {/* Payoff Matrix with Dynamic Values */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Dynamic Payoff Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-2 border-slate-300 p-3 bg-slate-100"></th>
                <th className="border-2 border-slate-300 p-3 bg-slate-100">System Holds (High Standards)</th>
                <th className="border-2 border-slate-300 p-3 bg-slate-100">System Fails (Low Standards)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-2 border-slate-300 p-3 font-semibold bg-slate-50">Student: Honest</td>
                <td className="border-2 border-slate-300 p-3 bg-green-50">
                  <div className="font-semibold text-green-700">Student: +10</div>
                  <div className="text-sm text-slate-600">System: +5</div>
                  <div className="text-xs text-slate-500 mt-1 italic">Constructive Win</div>
                </td>
                <td className="border-2 border-slate-300 p-3 bg-yellow-50">
                  <div className="font-semibold text-yellow-700">Student: +5</div>
                  <div className="text-sm text-slate-600">System: -5</div>
                  <div className="text-xs text-slate-500 mt-1 italic">Frustration Zone</div>
                </td>
              </tr>
              <tr>
                <td className="border-2 border-slate-300 p-3 font-semibold bg-slate-50">Student: Cheat</td>
                <td className="border-2 border-slate-300 p-3 bg-orange-50">
                  <div className="font-semibold text-orange-700">Student: +5 → -15 (T=5)</div>
                  <div className="text-sm text-slate-600">System: -20</div>
                  <div className="text-xs text-slate-500 mt-1 italic">Delayed Crash (Sieve)</div>
                </td>
                <td className="border-2 border-slate-300 p-3 bg-red-100">
                  <div className="font-semibold text-red-700">
                    Student: {finalState.cheatPayoff} (reclassified)
                  </div>
                  <div className="text-sm text-slate-600">System: -50</div>
                  <div className="text-xs text-red-600 mt-1 italic font-bold">
                    {finalState.thresholdCrossed ? '⚠ SYSTEMIC CRISIS' : 'Crisis Risk'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          <strong>SIP Trap Active:</strong> When Θ &gt; 1, payoffs are reclassified. 
          Current effective cheat payoff: <span className="font-mono">{finalState.cheatPayoff}</span>
        </p>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">System Evolution Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={simulationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (years)', position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: 'Index Value', angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip />
            <Legend />
            <ReferenceLine y={1.0} stroke="red" strokeDasharray="3 3" label="Crisis Threshold (Θ=1)" />
            <Line type="monotone" dataKey="theta" stroke="#ef4444" strokeWidth={2} name="Threshold Ratio (Θ)" />
            <Line type="monotone" dataKey="trust" stroke="#3b82f6" strokeWidth={2} name="Social Trust" />
            <Line type="monotone" dataKey="education" stroke="#8b5cf6" strokeWidth={2} name="Education Quality" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Guide */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Key Insights:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Nash Equilibrium:</strong> Always predicts "Cheat" as rational (immediate +5 payoff)</li>
          <li>• <strong>Societrics Equilibrium (σₑ):</strong> Excludes "Cheat" once Θ &gt; 1 due to system collapse</li>
          <li>• <strong>The System Sieve:</strong> Time (T) exposes incompetence; short-term gains become long-term losses</li>
          <li>• <strong>SIP Trap:</strong> When trust falls, all signals invert—even genuine reforms are seen as manipulation</li>
          <li>• <strong>Policy Implication:</strong> Protect SOC capacity through enforcement, or the entire credential system collapses</li>
        </ul>
      </div>
    </div>
  );
};

export default CheatingDilemma;