function getFulfillmentPercent(result) {
  if (!result.demand) {
    return 100;
  }

  return Math.round((result.allocated / result.demand) * 100);
}

export function generateInsights(allocationResult) {
  const insights = [];
  const criticalServices = allocationResult.filter(
    (result) => result.priority === 'critical',
  );
  const shortageServices = allocationResult.filter((result) => result.shortage);

  if (
    criticalServices.length > 0 &&
    criticalServices.every((result) => !result.shortage)
  ) {
    insights.push('Critical services are fully satisfied');
  } else if (criticalServices.some((result) => result.shortage)) {
    insights.push('Some critical services are under-served');
  }

  if (shortageServices.length > 0) {
    const mostAffected = [...shortageServices].sort(
      (first, second) =>
        getFulfillmentPercent(first) - getFulfillmentPercent(second),
    )[0];
    const deficit = 100 - getFulfillmentPercent(mostAffected);

    insights.push(`${mostAffected.name} faces ${deficit}% deficit`);
  }

  const mediumShortage = shortageServices.some(
    (result) => result.priority === 'medium',
  );

  if (mediumShortage) {
    insights.push('Power shortage is impacting medium priority sectors');
  } else if (shortageServices.length > 0) {
    insights.push('Available power is below total system demand');
  }

  return insights.slice(0, 3);
}
