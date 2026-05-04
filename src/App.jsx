import { useState } from 'react';
import { scenarios } from './data/scenarios';

function App() {
  const [selectedScenario, setSelectedScenario] = useState("flood");

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
      </section>

      <section>
        <h2>Dashboard</h2>
      </section>
    </main>
  );
}

export default App;
