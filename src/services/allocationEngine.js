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
    adjustedDemand: agent.baseDemand * severityMultiplier,
  }));

  for (const agent of adjustedAgents) {
    if (remainingPower <= 0) {
      break;
    }

    const demand = agent.adjustedDemand;
    const allocated =
      remainingPower >= demand ? demand : remainingPower;

    results.push({
      name: agent.name,
      allocated,
      reasoning:
        allocated === demand
          ? `Allocated full demand based on ${agent.priority} priority.`
          : `Allocated remaining power based on ${agent.priority} priority.`,
    });

    remainingPower -= allocated;
  }

  return results;
}
