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
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-600 border border-red-200",
    chart: "#ef4444",
  },
  high: {
    border: "border-orange-400",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-600 border border-orange-200",
    chart: "#f97316",
  },
  medium: {
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    chart: "#eab308",
  },
  low: {
    border: "border-green-400",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-600 border border-green-200",
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
        bg: "#DCFCE7",
        text: "#16A34A",
      };
    }

    if (allocated > 0 && allocated < demand) {
      return {
        label: "Partial Allocation",
        dot: "#eab308",
        bg: "#FEF3C7",
        text: "#D97706",
      };
    }

    return {
      label: "No Allocation",
      dot: "#ef4444",
      bg: "#FEE2E2",
      text: "#DC2626",
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          UrbanShield
        </h1>
        <p className="text-slate-500">Disaster-Response Simulation Dashboard</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="space-y-6 md:col-span-1">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-150 hover:shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Scenario Selector
            </h2>
            <div className="space-y-2">
              {SCENARIOS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setScenario(item.key)}
                  className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all active:scale-95 cursor-pointer ${
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

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-150 hover:shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Simulation Inputs
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium text-slate-700">
                  <span>Severity</span>
                  <span className="text-blue-600 font-bold">{severity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                  className="mt-2 w-full accent-blue-600 cursor-pointer transition duration-150"
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
                  className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 text-slate-900 font-medium"
                />
              </div>

              <button
                onClick={handleSimulation}
                disabled={loading}
                className={`w-full rounded-lg px-4 py-3 font-bold text-white shadow-md transition duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  loading ? "bg-slate-400 shadow-none" : "bg-green-500 hover:bg-green-600 shadow-green-100"
                }`}
              >
                {loading ? "Simulating..." : "Run Simulation"}
              </button>

              {loading && (
                <div className="flex items-center justify-center space-x-2 mt-2 text-slate-500 text-xs font-medium animate-pulse">
                  <div className="h-3 w-3 border-2 border-slate-300 border-t-green-500 rounded-full animate-spin"></div>
                  <span>Running allocation model...</span>
                </div>
              )}

              {hasSimulated && (
                <button
                  onClick={handleReset}
                  className="w-full rounded-lg bg-gray-200 px-4 py-3 font-bold text-slate-600 transition duration-150 hover:bg-gray-300 active:scale-95 cursor-pointer"
                >
                  Reset Scenario
                </button>
              )}
            </div>
          </section>
        </aside>

        <main className={`md:col-span-3 space-y-6 transition duration-150 ${hasSimulated ? "opacity-100 translate-y-0" : "opacity-100"}`}>
          {!hasSimulated ? (
            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-6 text-6xl">📊</div>
              <h2 className="mb-2 text-2xl font-bold text-slate-800">
                Ready to Simulate
              </h2>
              <p className="max-w-md text-slate-500 text-sm leading-relaxed">
                Configure your disaster scenario and resource parameters on the left, then click 
                <span className="mx-1 font-bold text-green-600">Run Simulation</span> 
                to generate real-time allocation data and AI tactical insights.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {result && (
                <div className="transition duration-150">
                  {result.summary.criticalShortageCount > 0 ? (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-center justify-between shadow-sm transition duration-150 hover:shadow-md">
                      <div>
                        <p className="font-bold flex items-center text-lg">
                          <span className="mr-2">🚨</span>
                          {result.summary.criticalShortageCount} Critical Systems Under Stress
                        </p>
                        <p className="text-sm opacity-90 font-medium text-red-700">
                          Immediate attention required for essential services
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold bg-red-100 text-red-900 px-4 py-1.5 rounded-full border border-red-200 uppercase tracking-widest shadow-sm">
                        High Priority
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl flex items-center shadow-sm transition duration-150 hover:shadow-md font-bold text-base">
                      <span className="mr-2 text-xl">✅</span>
                      System Secure: All critical services are sufficiently allocated
                    </div>
                  )}
                </div>
              )}

              <section className="bg-white rounded-xl shadow-sm p-6 transition duration-150 hover:shadow-md border border-slate-100">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    System Overview
                  </h2>
                  <div className="flex items-center space-x-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <span>Scenario: {getActiveScenarioLabel()}</span>
                    <span className="text-slate-300">|</span>
                    <span>Severity: {severity}</span>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center space-x-3 text-blue-600 py-10 justify-center">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
                    <span className="font-bold text-sm tracking-tight">ANALYZING RESOURCE FLOWS...</span>
                  </div>
                ) : result && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Demand
                      </p>
                      <p className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                        {formatNumber(result?.summary?.totalDemand)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Allocated
                      </p>
                      <p className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                        {formatNumber(result?.summary?.totalAllocated)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        System Deficit
                      </p>
                      <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${
                          result?.summary?.totalShortage > 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatNumber(result?.summary?.totalShortage)}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="bg-white rounded-xl shadow-sm p-6 transition duration-150 hover:shadow-md border border-slate-100">
                  <h2 className="mb-6 text-lg font-semibold text-gray-800">
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
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F8FAFC" />
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
                                <text x={-135} y={0} dy={4} textAnchor="start" fill="#475569" fontSize={11} fontWeight={700}>
                                  {payload.value.length > 15 ? `${payload.value.substring(0, 12)}...` : payload.value}
                                </text>
                                <circle cx={-8} cy={0} r={5} fill={status.dot} />
                              </g>
                            );
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }}
                          cursor={{ fill: '#F8FAFC' }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" height={36} />
                        <Bar dataKey="allocated" fill="#22C55E" radius={[0, 6, 6, 0]} name="Allocated" filter="url(#barShadow)" />
                        <Bar dataKey="demand" fill="#6366F1" radius={[0, 6, 6, 0]} name="Demand" filter="url(#barShadow)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm p-6 transition duration-150 hover:shadow-md border border-slate-100 flex flex-col items-center justify-center">
                  <h2 className="mb-6 text-lg font-semibold text-gray-800 w-full text-left">
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
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }}
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
                          className="text-3xl font-extrabold fill-slate-900 tracking-tight"
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

              <section className="bg-white rounded-xl shadow-sm p-6 transition duration-150 hover:shadow-md border border-slate-100">
                <h2 className="mb-6 text-lg font-semibold text-gray-800">Detailed Agent Status</h2>
                <div className="space-y-4">
                  {result?.allocation?.map((agent) => {
                    const styles = PRIORITY_STYLES[agent.priority] ?? PRIORITY_STYLES.low;
                    const aiReasoning = agent.reasoning?.trim();

                    return (
                      <div
                        key={agent.name}
                        className={`rounded-xl border-l-4 ${styles.border} ${styles.bg} p-6 shadow-sm transition duration-150 hover:shadow-md cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-bold text-slate-900">
                              {agent.name}
                            </h3>
                            {(() => {
                              const status = getServiceStatus(agent.allocated, agent.demand);
                              return (
                                <span
                                  className="rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
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

                        <div className="mt-4 flex items-center space-x-10 text-sm text-slate-700">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Demand</span>
                            <span className="mt-1 text-base font-bold text-slate-800">{formatNumber(agent.demand)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allocated</span>
                            <span className="mt-1 text-base font-extrabold text-slate-800">
                              {formatNumber(agent.allocated)}
                            </span>
                          </div>
                        </div>

                        {agent.shortage && (
                          <div className="mt-4 flex items-center font-bold text-red-600 text-sm bg-red-100/50 w-fit px-3 py-1 rounded-full border border-red-100">
                            <span className="mr-1.5">⚠</span>
                            Shortage: {formatNumber(agent.shortageAmount)}
                          </div>
                        )}

                        <div className="mt-4 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
                            🤖 AI Explanation
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#666",
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

              <section className="bg-white rounded-xl shadow-sm p-6 transition duration-150 hover:shadow-md border border-slate-100">
                <h2 className="mb-6 text-lg font-semibold text-gray-800">AI Strategic Insights</h2>
                <div className="space-y-3">
                  {result.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start rounded-xl border border-slate-100 bg-slate-50/50 p-6 text-slate-700 transition duration-150 hover:bg-slate-100/50 cursor-default"
                    >
                      <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm border border-blue-100 text-xl">
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
