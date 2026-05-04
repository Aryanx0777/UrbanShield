const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const OPENROUTER_API_KEY = import.meta.env?.VITE_OPENROUTER_API_KEY;

function getAgentDemand(agent, severity) {
  if (typeof agent.baseDemand === 'number' && typeof severity === 'number') {
    return agent.baseDemand * (1 + severity / 10);
  }

  return agent.demand ?? 0;
}

function buildAllocationContext(input, allocationResult) {
  const agentMap = new Map(input.agents.map((agent) => [agent.name, agent]));

  return allocationResult.map((result) => {
    const agent = agentMap.get(result.name) || {};

    return {
      name: result.name,
      allocated: result.allocated,
      demand: getAgentDemand(agent, input.severity),
      priority: agent.priority ?? 'unknown',
    };
  });
}

function buildPrompt(input, allocationContext) {
  return `
City: ${input.city}
Scenario: ${input.scenario}
Total Power: ${input.totalPower}

Allocation Result:
${JSON.stringify(allocationContext, null, 2)}

Explain why each agent received its allocation.
Mention shortages if any.
Keep each explanation short and clear.

Return only valid JSON in this format:
[
  {
    "name": "Agent name",
    "allocated": 0,
    "reasoning": "Short explanation"
  }
]
`;
}

function parseAIResponse(content) {
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

export async function enhanceAllocation(input, allocationResult) {
  if (!OPENROUTER_API_KEY) {
    return allocationResult;
  }

  try {
    const allocationContext = buildAllocationContext(input, allocationResult);
    const prompt = buildPrompt(input, allocationContext);

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return allocationResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return allocationResult;
    }

    const enhancedResult = parseAIResponse(content);
    return enhancedResult.length > 0 ? enhancedResult : allocationResult;
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return allocationResult;
  }
}
