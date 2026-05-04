const priorityWeights = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

function getPriorityWeight(priority) {
  return priorityWeights[priority] ?? 0;
}

export function allocateResources(input) {
  const { scenario, severity, totalPower, agents } = input;
  const severityMultiplier = 1 + severity / 10;
  let remainingPower = totalPower;
  const results = [];

  // Central place for resource allocation logic.
  // Future work can use scenario, severity, totalPower, and agents
  // to calculate how much power each agent should receive.
  const sortedAgents = [...agents].sort(
    (firstAgent, secondAgent) =>
      getPriorityWeight(secondAgent.priority) -
      getPriorityWeight(firstAgent.priority),
  );
  const adjustedAgents = sortedAgents.map((agent) => ({
    ...agent,
    demand: agent.baseDemand * severityMultiplier,
  }));

  for (const agent of adjustedAgents) {
    let allocated = 0;
    let reasoning = 'No allocation due to insufficient resources and lower priority';

    if (remainingPower >= agent.demand) {
      allocated = agent.demand;
      reasoning = `Fully satisfied due to ${agent.priority} priority`;
    } else if (remainingPower > 0) {
      allocated = remainingPower;
      reasoning =
        'Partially allocated due to limited power and higher priority demands';
    }

    results.push({
      name: agent.name,
      allocated,
      reasoning,
    });

    remainingPower -= allocated;
  }

  return results;
}
