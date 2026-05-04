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
  const priorityGroups = adjustedAgents.reduce((groups, agent) => {
    groups[agent.priority] = groups[agent.priority] || [];
    groups[agent.priority].push(agent);
    return groups;
  }, {});

  for (const priority of Object.keys(priorityWeights)) {
    const group = priorityGroups[priority] || [];

    if (group.length === 0) {
      continue;
    }

    const groupDemand = group.reduce((total, agent) => total + agent.demand, 0);

    if (remainingPower >= groupDemand) {
      for (const agent of group) {
        results.push({
          name: agent.name,
          allocated: agent.demand,
          reasoning: `Fully satisfied due to ${agent.priority} priority`,
        });
      }

      remainingPower -= groupDemand;
      continue;
    }

    for (const agent of group) {
      const allocated =
        remainingPower > 0 ? (agent.demand / groupDemand) * remainingPower : 0;
      const reasoning =
        allocated > 0
          ? 'Partially allocated due to limited power and higher priority demands'
          : 'No allocation due to insufficient resources and lower priority';

      results.push({
        name: agent.name,
        allocated,
        reasoning,
      });
    }

    remainingPower = 0;
  }

  return results;
}
