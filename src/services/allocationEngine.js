const priorityWeights = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

const priorityOrder = ['critical', 'high', 'medium', 'low'];

function getPriorityWeight(priority) {
  return priorityWeights[priority] ?? 0;
}

function formatPower(value) {
  return Number(value.toFixed(2));
}

function getSeverityMultiplier(agent, severity) {
  if (agent.priority === 'critical') {
    return 1 + severity / 8;
  }

  return 1 + severity / 12;
}

function getReasoning(agent, allocated) {
  const demand = agent.demand;
  const percentage = demand > 0 ? Math.round((allocated / demand) * 100) : 0;
  const allocatedPower = formatPower(allocated);
  const demandPower = formatPower(demand);

  if (allocated === demand) {
    return `Fully allocated (${allocatedPower}/${demandPower} MW, 100%) due to ${agent.priority} priority`;
  }

  if (allocated > 0) {
    return `Allocated ${allocatedPower}/${demandPower} MW (~${percentage}%) due to limited power after serving higher priority services`;
  }

  return `0/${demandPower} MW (0%) allocated due to insufficient resources and lower priority`;
}

export function allocateResources(input) {
  const { severity, agents } = input;
  let remainingPower = input.totalPower;
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
    demand: (agent.demand ?? agent.baseDemand ?? 0) * getSeverityMultiplier(agent, severity),
  }));
  const priorityGroups = adjustedAgents.reduce((groups, agent) => {
    groups[agent.priority] = groups[agent.priority] || [];
    groups[agent.priority].push(agent);
    return groups;
  }, {});

  for (const priority of priorityOrder) {
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
          reasoning: getReasoning(agent, agent.demand),
        });
      }

      remainingPower -= groupDemand;
      continue;
    }

    for (const agent of group) {
      const allocated =
        remainingPower > 0 ? (agent.demand / groupDemand) * remainingPower : 0;

      results.push({
        name: agent.name,
        allocated,
        reasoning: getReasoning(agent, allocated),
      });
    }

    remainingPower = Math.max(remainingPower - groupDemand, 0);
  }

  return results;
}
