import { useMemo, useState } from 'react';
import { agents } from './data/agents';
import { scenarios } from './data/scenarios';

function App() {
  const [selectedScenario, setSelectedScenario] = useState("flood");
  const [hasSimulated, setHasSimulated] = useState(false);
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
        <button onClick={() => setHasSimulated(true)}>Simulate</button>
      </section>

      <pre>{JSON.stringify(allocationInput, null, 2)}</pre>

      <section>
        <h2>Agent list</h2>
        {hasSimulated ? (
          updatedAgents.map((agent) => (
            <div key={agent.id}>
              <p>{agent.name}</p>
              <p>{agent.type}</p>
              <p>{agent.priority}</p>
              <p>{agent.demand}</p>
            </div>
          ))
        ) : (
          <p>Run simulation to see updated demand</p>
        )}
      </section>

      <section>
        <h2>Dashboard</h2>
      </section>
    </main>
  );
}

export default App;
