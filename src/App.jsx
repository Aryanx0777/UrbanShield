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
    const result = await getAllocation(allocationInput);
    setAllocationResult(result);
  };
  const getPriorityColor = (priority) => {
    if (priority === "critical") return "red";
    if (priority === "high") return "orange";
    if (priority === "medium") return "goldenrod";
    return "green";
  };

  return (
    <main>
      <h1>UrbanShield</h1>

      <section>
        <h2>Scenario selector</h2>
        {Object.keys(scenarios).map((scenarioKey) => (
          <button
            key={scenarioKey}
            onClick={() => setSelectedScenario(scenarioKey)}
          >
            {scenarios[scenarioKey].label}
          </button>
        ))}
        <p>Selected: {scenarios[selectedScenario].label}</p>
      </section>

      <section>
        <h2>Controls</h2>
        <button onClick={handleSimulate}>Simulate</button>
      </section>

      <pre>{JSON.stringify(allocationInput, null, 2)}</pre>

      <section>
        <h2>Summary</h2>
        <div>Total Demand: {totalDemand}</div>
        {allocationResult && (
          <>
            <div>Total Allocated: {totalAllocated}</div>
            <div style={{ color: totalDeficit > 0 ? "red" : "green" }}>
              Total Deficit: {totalDeficit}
            </div>
          </>
        )}
      </section>

      {allocationResult && (
        <BarChart width={600} height={300} data={chartData}>
          <CartesianGrid />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="demand" />
          <Bar dataKey="allocated" />
        </BarChart>
      )}

      {allocationResult && (
        <PieChart width={400} height={300}>
          <Pie data={priorityData} dataKey="value" nameKey="name">
            {priorityData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      )}

      <section>
        <h2>Agent list</h2>
        {hasSimulated ? (
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
      </section>

      {allocationResult && (
        <pre>{JSON.stringify(allocationResult, null, 2)}</pre>
      )}

      <section>
        <h2>Dashboard</h2>
      </section>
    </main>
  );
}

export default App;
