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
import { agents } from "./data/agents";
import { runSimulation } from "./services/runSimulation";

const SCENARIOS = [
  { key: "flood", label: "Flood" },
  { key: "chemical", label: "Chemical" },
  { key: "fire", label: "Fire" },
  { key: "power_failure", label: "Power Failure" },
];

const PRIORITY_STYLES = {
  critical: {
    border: "border-red-500",
    bg: "bg-red-500/10",
    badge: "bg-red-500/15 text-red-200 border border-red-400/30",
    chart: "#ef4444",
  },
  high: {
    border: "border-orange-400",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/15 text-orange-200 border border-orange-400/30",
    chart: "#f97316",
  },
  medium: {
    border: "border-yellow-400",
    bg: "bg-yellow-500/10",
    badge: "bg-yellow-500/15 text-yellow-100 border border-yellow-400/30",
    chart: "#eab308",
  },
  low: {
    border: "border-green-400",
    bg: "bg-green-500/10",
    badge: "bg-green-500/15 text-green-200 border border-green-400/30",
    chart: "#22c55e",
  },
};

const DONUT_COLORS = {
  Allocated: "#22c55e",
  Shortage: "#ef4444",
};

const formatNumber = (num) => {
  if (!Number.isFinite(num)) {
    return 0;
  }

  return Number.isInteger(num) ? num : Number(num.toFixed(2));
};

function App() {
  const [scenario, setScenario] = useState("flood");
  const [severity, setSeverity] = useState(5);
  const [totalPower, setTotalPower] = useState(100);
  const [result, setResult] = useState(null);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [loading, setLoading] = useState(false);

  const chartData = result?.allocation ?? [];

  const getActiveScenarioLabel = () => {
    return SCENARIOS.find(s => s.key === scenario)?.label || scenario;
  };

  const getServiceStatus = (allocated, demand) => {
    if (allocated >= demand * 0.98) {
      return {
        label: "Fully Satisfied",
        dot: "#22c55e",
        bg: "rgba(34, 197, 94, 0.14)",
        text: "#86efac",
      };
    }

    if (allocated > 0 && allocated < demand) {
      return {
        label: "Partial Allocation",
        dot: "#eab308",
        bg: "rgba(234, 179, 8, 0.14)",
        text: "#fde68a",
      };
    }

    return {
      label: "No Allocation",
      dot: "#ef4444",
      bg: "rgba(239, 68, 68, 0.14)",
      text: "#fca5a5",
    };
  };

  const donutData = useMemo(() => {
    if (!result) {
      return [];
    }

    const allocated = result.summary.totalAllocated;
    const shortage = result.summary.totalShortage;

    return [
      { name: "Allocated", value: allocated },
      { name: "Shortage", value: shortage },
    ];
  }, [result]);

  function buildInput() {
    return {
      city: "Bangalore",
      scenario,
      severity: Number(severity),
      totalPower: Number(totalPower),
      agents: agents.map((agent) => ({
        name: agent.name,
        type: agent.type,
        demand: agent.baseDemand,
        priority: agent.priority,
      })),
    };
  }

  const handleSimulation = async () => {
    setLoading(true);

    try {
      const input = buildInput();
      console.log("INPUT:", input);
      const res = await runSimulation(input);
      console.log("RESULT:", res);
      setResult(res);
      setHasSimulated(true);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setHasSimulated(false);
    setScenario("flood");
    setSeverity(5);
    setTotalPower(100);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 font-sans text-slate-100">
      <header className="mb-10 border-b border-white/10 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          UrbanShield
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-400">Disaster-Response Simulation Dashboard</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="space-y-6 md:col-span-1">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30">
            <h2 className="mb-4 text-lg font-bold text-white">
              Scenario Selector
            </h2>
            <div className="space-y-2">
              {SCENARIOS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setScenario(item.key)}
                  className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all active:scale-95 cursor-pointer ${
                    scenario === item.key
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-950/40"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30">
            <h2 className="mb-4 text-lg font-bold text-white">
              Simulation Inputs
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium text-slate-400">
                  <span>Severity</span>
                  <span className="text-blue-300 font-bold">{severity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                  className="mt-2 w-full accent-blue-400 cursor-pointer transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400">
                  Total Power Supply
                </label>
                <input
                  type="number"
                  value={totalPower}
                  onChange={(event) => setTotalPower(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                onClick={handleSimulation}
                disabled={loading}
                className={`w-full rounded-lg px-4 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  loading ? "bg-slate-600 shadow-none" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-950/40"
                }`}
              >
                {loading ? "Simulating..." : "Run Simulation"}
              </button>

              {loading && (
                <div className="flex items-center justify-center space-x-2 mt-2 text-slate-400 text-xs font-medium animate-pulse">
                  <div className="h-3 w-3 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin"></div>
                  <span>Running allocation model...</span>
                </div>
              )}

              {hasSimulated && (
                <button
                  onClick={handleReset}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 font-bold text-slate-200 transition-all duration-300 hover:scale-[1.02] hover:bg-white/15 active:scale-95 cursor-pointer"
                >
                  Reset Scenario
                </button>
              )}
            </div>
          </section>
        </aside>

        <main className={`md:col-span-3 space-y-8 transition-all duration-300 ${hasSimulated ? "opacity-100 translate-y-0" : "opacity-100"}`}>
          {!hasSimulated ? (
            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-12 text-center shadow-xl shadow-black/20 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30">
              <div className="mb-6 text-6xl">📊</div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Ready to Simulate
              </h2>
              <p className="max-w-md text-slate-400 text-sm leading-relaxed">
                Configure your disaster scenario and resource parameters on the left, then click 
                <span className="mx-1 font-bold text-emerald-300">Run Simulation</span> 
                to generate real-time allocation data and AI tactical insights.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {result && (
                <div className="transition-all duration-300">
                  {result.summary.criticalShortageCount > 0 ? (
                    <div className="bg-red-500/10 border border-red-400/25 text-red-100 p-6 rounded-2xl flex items-center justify-between shadow-xl shadow-red-950/20 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:shadow-red-950/30">
                      <div>
                        <p className="font-bold flex items-center text-lg">
                          <span className="mr-2">🚨</span>
                          {result.summary.criticalShortageCount} Critical Systems Under Stress
                        </p>
                        <p className="text-sm opacity-90 font-medium text-red-200/80">
                          Immediate attention required for essential services
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold bg-red-400/15 text-red-100 px-4 py-1.5 rounded-full border border-red-300/25 uppercase tracking-widest shadow-sm">
                        High Priority
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-400/25 text-emerald-100 p-6 rounded-2xl flex items-center shadow-xl shadow-emerald-950/20 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:shadow-emerald-950/30 font-bold text-base">
                      <span className="mr-2 text-xl">✅</span>
                      System Secure: All critical services are sufficiently allocated
                    </div>
                  )}
                </div>
              )}

              <section className="bg-slate-900/70 rounded-2xl shadow-xl shadow-black/20 p-6 transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30 border border-white/10 backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    System Overview
                  </h2>
                  <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    <span>Scenario: {getActiveScenarioLabel()}</span>
                    <span className="text-slate-600">|</span>
                    <span>Severity: {severity}</span>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-3 text-blue-300 py-10 justify-center">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-300 [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-300 [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-300"></div>
                    <span className="font-bold text-sm tracking-tight">ANALYZING RESOURCE FLOWS...</span>
                  </div>
                ) : result && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.02]">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Demand
                      </p>
                      <p className="mt-1 text-3xl font-bold text-white tracking-tight">
                        {formatNumber(result?.summary?.totalDemand)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.02]">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Allocated
                      </p>
                      <p className="mt-1 text-3xl font-bold text-white tracking-tight">
                        {formatNumber(result?.summary?.totalAllocated)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.02]">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        System Deficit
                      </p>
                      <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${
                          result?.summary?.totalShortage > 0
                            ? "text-red-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {formatNumber(result?.summary?.totalShortage)}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="bg-slate-900/70 rounded-2xl shadow-xl shadow-black/20 p-6 transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30 border border-white/10 backdrop-blur">
                  <h2 className="mb-6 text-lg font-bold text-white">
                    Agent Allocation Details
                  </h2>
                  <div className="h-[320px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        barCategoryGap="25%"
                      >
                        <defs>
                          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="1" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.2" />
                            </feComponentTransfer>
                            <feMerge>
                              <feMergeNode />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.14)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          axisLine={false}
                          tickLine={false}
                          tick={(props) => {
                            const { x, y, payload } = props;
                            const agent = result.allocation.find(a => a.name === payload.value);
                            if (!agent) return null;
                            const status = getServiceStatus(agent.allocated, agent.demand);
                            
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text x={-135} y={0} dy={4} textAnchor="start" fill="#CBD5E1" fontSize={11} fontWeight={700}>
                                  {payload.value.length > 15 ? `${payload.value.substring(0, 12)}...` : payload.value}
                                </text>
                                <circle cx={-8} cy={0} r={5} fill={status.dot} />
                              </g>
                            );
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: '#111827', color: '#E5E7EB', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.35)', fontSize: '12px', fontWeight: '600' }}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" height={36} />
                        <Bar dataKey="allocated" fill="#22C55E" radius={[0, 6, 6, 0]} name="Allocated" filter="url(#barShadow)" />
                        <Bar dataKey="demand" fill="#6366F1" radius={[0, 6, 6, 0]} name="Demand" filter="url(#barShadow)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="bg-slate-900/70 rounded-2xl shadow-xl shadow-black/20 p-6 transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/30 border border-white/10 backdrop-blur flex flex-col items-center justify-center">
                  <h2 className="mb-6 text-lg font-bold text-white w-full text-left">
                    Allocation Coverage
                  </h2>
                  <div className="h-[320px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={3}
                          cornerRadius={8}
                          stroke="none"
                          labelLine={false}
                          label={({ percent }) => {
                            if (percent < 0.05) return null;
                            return `${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {donutData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={DONUT_COLORS[entry.name]}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [formatNumber(value), name]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: '#111827', color: '#E5E7EB', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.35)', fontSize: '12px', fontWeight: '600' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle"
                          formatter={(value) => {
                            const original = donutData.find((item) => item.name === value);
                            return `${value} (${formatNumber(original?.value || 0)})`;
                          }}
                        />
                        <text
                          x="50%"
                          y="48%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-3xl font-extrabold fill-white tracking-tight"
                        >
                          {formatNumber(result?.summary?.totalShortage)}
                        </text>
                        <text
                          x="50%"
                          y="56%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[10px] font-bold uppercase tracking-[0.3em] fill-slate-400"
                        >
                          shortage
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <section className="bg-slate-900/70 rounded-2xl shadow-xl shadow-black/20 p-6 transition-all duration-300 hover:border-blue-400/30 border border-white/10 backdrop-blur">
                <h2 className="mb-6 text-lg font-bold text-white">Detailed Agent Status</h2>
                <div className="space-y-4">
                  {result?.allocation?.map((agent) => {
                    const styles = PRIORITY_STYLES[agent.priority] ?? PRIORITY_STYLES.low;
                    const aiReasoning = agent.reasoning?.trim();

                    return (
                      <div
                        key={agent.name}
                        className={`rounded-2xl border border-white/10 border-l-4 ${styles.border} ${styles.bg} p-6 shadow-lg shadow-black/10 backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:bg-white/10 cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-bold text-white">
                              {agent.name}
                            </h3>
                            {(() => {
                              const status = getServiceStatus(agent.allocated, agent.demand);
                              return (
                                <span
                                  className="rounded border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                                  style={{ backgroundColor: status.bg, color: status.text }}
                                >
                                  {status.label}
                                </span>
                              );
                            })()}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${styles.badge}`}
                          >
                            {agent.priority}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center space-x-10 text-sm text-slate-300">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Demand</span>
                            <span className="mt-1 text-base font-bold text-white">{formatNumber(agent.demand)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allocated</span>
                            <span className="mt-1 text-base font-extrabold text-white">
                              {formatNumber(agent.allocated)}
                            </span>
                          </div>
                        </div>

                        {agent.shortage && (
                          <div className="mt-4 flex items-center font-bold text-red-200 text-sm bg-red-500/10 w-fit px-3 py-1 rounded-full border border-red-400/20">
                            <span className="mr-1.5">⚠</span>
                            Shortage: {formatNumber(agent.shortageAmount)}
                          </div>
                        )}

                        <div className="mt-4 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            🤖 AI Explanation
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#CBD5E1",
                              fontStyle: "italic",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {aiReasoning || "AI reasoning unavailable (using rule-based explanation)"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-slate-900/70 rounded-2xl shadow-xl shadow-black/20 p-6 transition-all duration-300 hover:border-blue-400/30 border border-white/10 backdrop-blur">
                <h2 className="mb-6 text-lg font-bold text-white">AI Strategic Insights</h2>
                <div className="space-y-3">
                  {result.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.01] hover:bg-white/10 cursor-default"
                    >
                      <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-200 shadow-sm border border-blue-400/20 text-xl">
                        💡
                      </div>
                      <p className="text-sm font-semibold leading-relaxed py-1">{insight}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
