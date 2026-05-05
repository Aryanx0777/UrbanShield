const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'openrouter/free';
const FALLBACK_MODELS = [
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];
const OPENROUTER_API_KEY = import.meta.env?.VITE_OPENROUTER_API_KEY?.trim();
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
Reasoning must explain intentional prioritization clearly and justify the allocation decision.
Do not imply system failure, missing output, or that the allocation should be questioned.
For reduced or deferred allocations, use phrases like "Due to higher priority demands...", "Resources were prioritized for critical services...", or "Lower priority allocation was reduced under constraints..."
Example: use "Allocation deferred due to higher priority critical services under limited power" instead of "No allocation provided".
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
    ...entry,
    name: entry.name ?? '',
    allocated: Number.isFinite(entry.allocated) ? entry.allocated : 0,
    reasoning: entry.reasoning ?? '',
    demand: Number.isFinite(entry.demand) ? entry.demand : 0,
    shortage: Boolean(entry.shortage),
    shortageAmount: Number.isFinite(entry.shortageAmount)
      ? entry.shortageAmount
      : 0,
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

  return allocationResult.map((entry) =>
    normalizeAllocationEntry({
      ...entry,
      reasoning: validReasoningByName.get(entry.name) || entry.reasoning || '',
    }),
  );
}

function buildLocalReasoning(entry) {
  const allocated = Number.isFinite(entry.allocated) ? entry.allocated : 0;
  const demand = Number.isFinite(entry.demand) ? entry.demand : 0;

  if (allocated >= demand * 0.98) {
    return 'Resources were prioritized to satisfy this service under the current demand profile.';
  }

  if (allocated > 0) {
    return 'Lower priority allocation was reduced under constraints while preserving partial service coverage.';
  }

  return 'Allocation deferred due to higher priority critical services under limited power.';
}

function applyLocalReasoning(allocationResult) {
  return allocationResult.map((entry) =>
    normalizeAllocationEntry({
      ...entry,
      reasoning: entry.reasoning || buildLocalReasoning(entry),
    }),
  );
}

async function requestAICompletion(prompt, model) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'UrbanShield',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    let details = '';

    try {
      details = await response.text();
    } catch {
      details = 'Unable to read OpenRouter error body';
    }

    throw new Error(
      `OpenRouter request failed for ${model}: ${response.status} ${response.statusText} ${details}`,
    );
  }

  return response;
}

async function requestAICompletionWithFallback(prompt) {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError;

  for (const model of models) {
    try {
      return await requestAICompletion(prompt, model);
    } catch (error) {
      lastError = error;

      if (DEBUG_AI) {
        console.warn(`AI model unavailable, trying next free model: ${model}`);
      }
    }
  }

  throw lastError;
}

export async function enhanceAllocation(input, allocationResult) {
  if (!OPENROUTER_API_KEY) {
    return applyLocalReasoning(allocationResult);
  }

  try {
    const allocationContext = buildAllocationContext(input, allocationResult);
    const prompt = buildPrompt(input, allocationContext);

    const response = await requestAICompletionWithFallback(prompt);

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
    return applyLocalReasoning(allocationResult);
  }
}
