import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { runSimulation } from "./services/api";

const SCENARIOS = [
  { key: "flood", label: "Flood" },
  { key: "chemical", label: "Chemical" },
  { key: "fire", label: "Fire" },
  { key: "power_failure", label: "Power Failure" },
];

const PRIORITY_STYLES = {
  critical: {
    border: "border-red-600",
    badge: "bg-red-50 text-red-700 border border-red-100",
    chart: "#DC2626",
  },
  high: {
    border: "border-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-100",
    chart: "#F59E0B",
  },
  medium: {
    border: "border-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-100",
    chart: "#FCD34D",
  },
  low: {
    border: "border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    chart: "#22C55E",
  },
};

function App() {
  const [scenario, setScenario] = useState("flood");
  const [severity, setSeverity] = useState(5);
  const [totalPower, setTotalPower] = useState(100);
  const [result, setResult] = useState(null);
  const [beforeOptimization, setBeforeOptimization] = useState(null);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimizationMessage, setOptimizationMessage] = useState("");

  const chartData = result?.allocation ?? [];

  const priorityData = useMemo(() => {
    return ["critical", "high", "medium", "low"].map((priority) => ({
      name: priority,
      value: chartData
        .filter((agent) => agent.priority === priority)
        .reduce((sum, agent) => sum + agent.allocated, 0),
    }));
  }, [chartData]);

  const buildInput = () => ({
    city: "Bangalore",
    scenario,
    severity,
    totalPower,
  });

  const handleSimulate = async () => {
    setLoading(true);
    setOptimizationMessage("");
    setBeforeOptimization(null);

    try {
      const input = buildInput();
      const res = await runSimulation(input);

      setResult(res);
      setHasSimulated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    if (!result) return;

    // Capture state before optimization
    setBeforeOptimization(JSON.parse(JSON.stringify(result)));

    const newAllocation = [...result.allocation];
    let pool = 0;

    // Phase 1: Harvest surplus from low priority (Utilities)
    newAllocation.forEach((agent, idx) => {
      if (agent.priority === "low" || agent.priority === "medium") {
        const safeMin = Math.max(10, Math.floor(agent.demand * 0.4));
        if (agent.allocated > safeMin) {
          const reduction = agent.allocated - safeMin;
          pool += reduction;
          newAllocation[idx] = { ...agent, allocated: safeMin, shortage: true, shortageAmount: agent.demand - safeMin };
        }
      }
    });

    // Phase 2: Redistribute to Critical then High
    const targets = ["critical", "high", "medium"];
    targets.forEach((prio) => {
      newAllocation.forEach((agent, idx) => {
        if (agent.priority === prio && agent.allocated < agent.demand && pool > 0) {
          const needed = agent.demand - agent.allocated;
          const transfer = Math.min(pool, needed);
          pool -= transfer;
          const newAllocated = agent.allocated + transfer;
          newAllocation[idx] = { 
            ...agent, 
            allocated: newAllocated, 
            shortage: newAllocated < agent.demand,
            shortageAmount: Math.max(0, agent.demand - newAllocated)
          };
        }
      });
    });

    const totalAllocated = newAllocation.reduce((sum, a) => sum + a.allocated, 0);
    const totalShortage = newAllocation.reduce((sum, a) => sum + (a.demand - a.allocated), 0);
    const criticalShortageCount = newAllocation.filter(a => a.priority === 'critical' && a.shortage).length;

    setResult({
      ...result,
      allocation: newAllocation,
      summary: {
        ...result.summary,
        totalAllocated,
        totalShortage,
        criticalShortageCount
      }
    });
    
    setOptimizationMessage("✅ Allocation optimized based on priority");
    setTimeout(() => setOptimizationMessage(""), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          UrbanShield
        </h1>
        <p className="text-slate-500">Disaster-Response Simulation Dashboard</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="space-y-6 md:col-span-1">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Scenario Selector
            </h2>
            <div className="space-y-2">
              {SCENARIOS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setScenario(item.key)}
                  className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all ${
                    scenario === item.key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Simulation Inputs
            </h2>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Severity</span>
                  <span className="text-blue-600">{severity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Total Power Supply
                </label>
                <input
                  type="number"
                  value={totalPower}
                  onChange={(event) => setTotalPower(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing..." : "Run Simulation"}
              </button>

              {hasSimulated && (
                <button
                  onClick={handleOptimize}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Optimize Allocation
                </button>
              )}

              {optimizationMessage && (
                <p className="text-center text-xs font-medium text-emerald-600 animate-fade-in">
                  {optimizationMessage}
                </p>
              )}
            </div>
          </section>
        </aside>

        <main className="space-y-8 md:col-span-3">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-slate-800">
              System Overview
            </h2>
            {loading ? (
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
                <span className="font-medium">Calculating resource allocation...</span>
              </div>
            ) : hasSimulated && result ? (
              <>
                {result?.summary?.criticalShortageCount > 0 && (
                  <div className="mb-6 flex items-center rounded-lg bg-red-50 p-4 border border-red-100 text-red-800">
                    <span className="mr-3 text-lg">⚠</span>
                    <span className="font-medium">Critical infrastructure stress detected. Immediate resource reallocation required.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Demand
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {result?.summary?.totalDemand}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Allocated
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {result?.summary?.totalAllocated}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      System Deficit
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        result?.summary?.totalShortage > 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {result?.summary?.totalShortage}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                Configure scenario parameters and initiate simulation to view results
              </div>
            )}
          </section>

          {hasSimulated && result && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Recommended Actions
              </h2>
              <div className="space-y-3">
                {(() => {
                  const deficit = result.summary.totalShortage;
                  if (deficit <= 0) {
                    return (
                      <div className="flex items-center text-emerald-600 font-medium">
                        <span className="mr-2 text-lg">✅</span>
                        Resources are balanced. No immediate action required.
                      </div>
                    );
                  }

                  const actions = [];
                  const allocation = result.allocation || [];

                  // Find low priority candidates for reduction
                  const lowPriority = allocation.filter(a => a.priority === 'low' || a.priority === 'medium');
                  const highPriority = allocation.filter(a => a.priority === 'critical' || a.priority === 'high');

                  // Rule 1: Reduce low priority if they have significant allocation
                  lowPriority.forEach(agent => {
                    if (agent.allocated > 10) {
                      actions.push({
                        type: 'reduce',
                        text: `⚠ Reduce ${agent.name} allocation by ${Math.min(10, Math.floor(agent.allocated * 0.15))} units to free up power.`
                      });
                    }
                  });

                  // Rule 2: Increase high priority if they have shortages
                  highPriority.forEach(agent => {
                    if (agent.shortage) {
                      actions.push({
                        type: 'increase',
                        text: `✅ Increase allocation to ${agent.name} to mitigate critical deficit.`
                      });
                    }
                  });

                  // Sort and limit to 4 recommendations
                  const sortedActions = [...actions].sort((a, b) => (a.type === 'increase' ? -1 : 1)).slice(0, 4);

                  return sortedActions.map((action, idx) => (
                    <div key={idx} className={`rounded-lg p-3 text-sm font-medium ${
                      action.type === 'increase' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      {action.text}
                    </div>
                  ));
                })()}
              </div>
            </section>
          )}

          {hasSimulated && result && beforeOptimization && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                Optimization Impact
              </h2>
              
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Deficit</p>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-slate-400 line-through">{beforeOptimization.summary.totalShortage}</span>
                    <span className="text-2xl font-bold text-emerald-600">{result.summary.totalShortage}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    Net improvement: {beforeOptimization.summary.totalShortage - result.summary.totalShortage} units
                  </p>
                </div>
                
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Allocated Power</p>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-slate-400">{beforeOptimization.summary.totalAllocated}</span>
                    <span className="text-xl font-bold text-slate-700">→</span>
                    <span className="text-2xl font-bold text-slate-900">{result.summary.totalAllocated}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Status</p>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-lg font-medium text-slate-400">{beforeOptimization.summary.criticalShortageCount}</span>
                    <span className="text-xl font-bold text-slate-700">→</span>
                    <span className={`text-2xl font-bold ${result.summary.criticalShortageCount < beforeOptimization.summary.criticalShortageCount ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {result.summary.criticalShortageCount}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 font-medium">Critical shortages resolved</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Service Name</th>
                      <th className="px-4 py-3">Before</th>
                      <th className="px-4 py-3">After</th>
                      <th className="px-4 py-3 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.allocation.map((agent, idx) => {
                      const prev = beforeOptimization.allocation.find(a => a.name === agent.name);
                      const diff = agent.allocated - (prev?.allocated || 0);
                      
                      return (
                        <tr key={agent.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">{agent.name}</td>
                          <td className="px-4 py-3 text-slate-500">{prev?.allocated}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{agent.allocated}</td>
                          <td className={`px-4 py-3 text-right font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {hasSimulated && result && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-slate-800">
                  Agent Allocation Details
                </h2>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" align="right" iconType="rect" height={36} />
                      <Bar dataKey="allocated" fill="#22C55E" radius={[0, 4, 4, 0]} name="Allocated" />
                      <Bar dataKey="demand" fill="#6366F1" radius={[0, 4, 4, 0]} name="Demand" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-slate-800">
                  Resource Priority Distribution
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      cornerRadius={8}
                    >
                      {priorityData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PRIORITY_STYLES[entry.name].chart}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" />
                    <text
                      x="50%"
                      y="48%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-3xl font-extrabold fill-slate-900"
                    >
                      {result?.summary?.totalShortage}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-bold uppercase tracking-[0.2em] fill-slate-400"
                    >
                      shortage
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasSimulated && result && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">Detailed Agent Status</h2>
              <div className="space-y-4">
                {result?.allocation?.map((agent) => {
                  const styles = PRIORITY_STYLES[agent.priority] ?? PRIORITY_STYLES.low;

                  return (
                    <div
                      key={agent.name}
                      className={`rounded-xl border-l-4 ${styles.border} bg-white p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">
                          {agent.name}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles.badge}`}
                        >
                          {agent.priority}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center space-x-8 text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Demand</span>
                          <span className="mt-0.5 text-base font-semibold text-slate-700">{agent.demand}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allocated</span>
                          <span className="mt-0.5 text-base font-semibold text-slate-700">{agent.allocated}</span>
                        </div>
                        {agent.shortage && (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Deficit</span>
                            <span className="mt-0.5 text-base font-bold text-red-600">-{agent.shortageAmount}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm leading-relaxed text-slate-600">
                          <span className="mr-2 font-bold text-slate-400 text-xs uppercase">Analysis:</span>
                          {agent.reasoning}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-800">AI Strategic Insights</h2>
            {hasSimulated && result?.insights?.length ? (
              <div className="space-y-4">
                {result.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-slate-700 transition-all hover:bg-slate-50"
                  >
                    <div className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      💡
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                Strategic insights will be generated upon simulation completion
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
