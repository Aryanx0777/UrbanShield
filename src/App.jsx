import { useMemo, useState } from 'react';
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
} from 'recharts';
import { agents } from './data/agents';
import { scenarios } from './data/scenarios';
import { getAllocation } from "/src/services/api.js";

function App() {
  const [selectedScenario, setSelectedScenario] = useState("flood");
  const [hasSimulated, setHasSimulated] = useState(false);
  const [allocationResult, setAllocationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const updatedAgents = useMemo(() => {
    return agents.map(agent => {
      const multiplier =
        scenarios[selectedScenario].multipliers[agent.type] || 1;

      return {
        ...agent,
        demand: Math.round(agent.baseDemand * multiplier),
      };
    });
  }, [selectedScenario]);
  const allocationInput = useMemo(() => {
    return {
      city: "Bangalore",
      scenario: selectedScenario,
      totalPower: scenarios[selectedScenario].totalPower,
      agents: updatedAgents.map(agent => ({
        name: agent.name,
        type: agent.type,
        demand: agent.demand,
        priority: agent.priority,
      })),
    };
  }, [updatedAgents, selectedScenario]);
  const totalDemand = useMemo(() => {
    return updatedAgents.reduce((total, agent) => total + agent.demand, 0);
  }, [updatedAgents]);
  const totalAllocated = useMemo(() => {
    return allocationResult
      ? allocationResult.reduce((total, allocation) => total + allocation.allocated, 0)
      : 0;
  }, [allocationResult]);
  const totalDeficit = useMemo(() => {
    return totalDemand - totalAllocated;
  }, [totalDemand, totalAllocated]);
  const chartData = updatedAgents.map(agent => {
    const allocation = allocationResult?.find(a => a.name === agent.name);

    return {
      name: agent.name,
      demand: agent.demand,
      allocated: allocation ? allocation.allocated : 0,
    };
  });
  const priorityData = ["critical", "high", "medium", "low"].map(priority => {
    const total = updatedAgents
      .filter(agent => agent.priority === priority)
      .reduce((sum, agent) => {
        const allocation = allocationResult?.find(a => a.name === agent.name);
        return sum + (allocation ? allocation.allocated : 0);
      }, 0);

    return {
      name: priority,
      value: total,
    };
  });
  const COLORS = {
    critical: "red",
    high: "orange",
    medium: "gold",
    low: "green",
  };
  const handleSimulate = async () => {
    setHasSimulated(true);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const result = await getAllocation(allocationInput);
    setAllocationResult(result);

    setIsLoading(false);
  };
  const getPriorityColor = (priority) => {
    if (priority === "critical") return "red";
    if (priority === "high") return "orange";
    if (priority === "medium") return "goldenrod";
    return "green";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">UrbanShield</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="mb-4">Scenario selector</h2>
            <div className="space-y-4">
              {Object.keys(scenarios).map((scenarioKey) => (
                <button
                  key={scenarioKey}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => setSelectedScenario(scenarioKey)}
                >
                  {scenarios[scenarioKey].label}
                </button>
              ))}
            </div>
            <p>Selected: {scenarios[selectedScenario].label}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="mb-4">Controls</h2>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded mt-2 disabled:opacity-50"
              onClick={handleSimulate}
              disabled={isLoading}
            >
              {isLoading ? "Simulating..." : "Simulate"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <pre>{JSON.stringify(allocationInput, null, 2)}</pre>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="mb-4">Summary</h2>
            <div>Total Demand: {totalDemand}</div>
            {isLoading && <div>Calculating allocation...</div>}
            {allocationResult && (
              <>
                <div>Total Allocated: {totalAllocated}</div>
                <div style={{ color: totalDeficit > 0 ? "red" : "green" }}>
                  Total Deficit: {totalDeficit}
                </div>
              </>
            )}
          </div>

          {allocationResult && (
            <div className="bg-white rounded-xl shadow p-4">
              <BarChart width={500} height={300} data={chartData}>
                <CartesianGrid />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="demand" />
                <Bar dataKey="allocated" />
              </BarChart>

              <PieChart width={400} height={300}>
                <Pie data={priorityData} dataKey="value" nameKey="name">
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="mb-4">Agent list</h2>
            {isLoading ? (
              <p>Running simulation...</p>
            ) : hasSimulated ? (
              updatedAgents.map((agent) => (
                <div key={agent.id}>
                  {(() => {
                    const allocation = allocationResult?.find(
                      (item) => item.name === agent.name
                    );
                    const allocated = allocation?.allocated || 0;
                    const deficit = agent.demand - allocated;

                    return (
                      <>
                        <p style={{ color: getPriorityColor(agent.priority) }}>
                          {agent.name}
                        </p>
                        <p>Demand: {agent.demand}</p>
                        <p>Allocated: {allocated}</p>
                        <p style={{ color: deficit > 0 ? "red" : "green" }}>
                          Deficit: {deficit}
                        </p>
                      </>
                    );
                  })()}
                </div>
              ))
            ) : (
              <p>Run simulation to see updated demand</p>
            )}
          </div>

          {allocationResult && (
            <div className="bg-white rounded-xl shadow p-4">
              <pre>{JSON.stringify(allocationResult, null, 2)}</pre>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="mb-4">Dashboard</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
