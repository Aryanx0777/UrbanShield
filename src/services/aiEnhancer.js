const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const OPENROUTER_API_KEY = import.meta.env?.VITE_OPENROUTER_API_KEY;
const DEBUG_AI = true;

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
Keep reasoning short, 1-2 lines maximum.
Avoid markdown.
Avoid explanations outside JSON.

Return ONLY JSON array in this exact format:
[
  {
    "name": string,
    "allocated": number,
    "reasoning": string
  }
]
Do not include any extra text.
`;
}

function parseAIResponse(content) {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isValidAIEntry(entry) {
  return (
    entry &&
    typeof entry.name === 'string' &&
    Number.isFinite(entry.allocated) &&
    typeof entry.reasoning === 'string' &&
    entry.reasoning.trim().length > 0
  );
}

function normalizeAllocationEntry(entry) {
  return {
    name: entry.name ?? '',
    allocated: Number.isFinite(entry.allocated) ? entry.allocated : 0,
    reasoning: entry.reasoning ?? '',
  };
}

function mergeReasoning(allocationResult, aiResult) {
  if (!Array.isArray(aiResult)) {
    return allocationResult.map(normalizeAllocationEntry);
  }

  const validReasoningByName = new Map();

  for (const entry of aiResult) {
    if (isValidAIEntry(entry)) {
      validReasoningByName.set(entry.name, entry.reasoning.trim());
    }
  }

  if (validReasoningByName.size === 0) {
    return allocationResult.map(normalizeAllocationEntry);
  }

  return allocationResult.map((entry) => ({
    name: entry.name ?? '',
    allocated: Number.isFinite(entry.allocated) ? entry.allocated : 0,
    reasoning: validReasoningByName.get(entry.name) || entry.reasoning || '',
  }));
}

export async function enhanceAllocation(input, allocationResult) {
  if (!OPENROUTER_API_KEY) {
    return allocationResult.map(normalizeAllocationEntry);
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
      return allocationResult.map(normalizeAllocationEntry);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return allocationResult.map(normalizeAllocationEntry);
    }

    if (DEBUG_AI) {
      console.log('Raw AI response:', content);
    }

    const parsedOutput = parseAIResponse(content);

    if (DEBUG_AI) {
      console.log('Parsed AI output:', parsedOutput);
    }

    return mergeReasoning(allocationResult, parsedOutput);
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return allocationResult.map(normalizeAllocationEntry);
  }
}
