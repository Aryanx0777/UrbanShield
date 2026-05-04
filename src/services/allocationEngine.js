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
    adjustedDemand: agent.baseDemand * severityMultiplier,
  }));

  return [];
}
