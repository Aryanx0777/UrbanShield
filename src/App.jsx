import { useMemo, useState } from 'react';
import { agents } from './data/agents';
import { scenarios } from './data/scenarios';

function App() {
  const [selectedScenario, setSelectedScenario] = useState("flood");
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
      </section>

      <section>
        <h2>Agent list</h2>
        {updatedAgents.map((agent) => (
          <div key={agent.id}>
            <p>{agent.name}</p>
            <p>{agent.type}</p>
            <p>{agent.priority}</p>
            <p>{agent.demand}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Dashboard</h2>
      </section>
    </main>
  );
}

export default App;
