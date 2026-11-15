import { TEAM_SIZE } from "./rules";

// maxSpend is what the scout can put into salaries right now:
// this week's money minus change fees (including the change being made).
export function validateDraft(body, creators, maxSpend) {
  if (
    !body ||
    !Array.isArray(body.picks) ||
    body.picks.length !== TEAM_SIZE ||
    new Set(body.picks).size !== TEAM_SIZE
  ) {
    return `Pick exactly ${TEAM_SIZE} different creators.`;
  }

  const byId = new Map(
    creators.map((creator) => [creator.id, creator])
  );

  const hasUnknownCreator = body.picks.some(
    (id) => typeof id !== "string" || !byId.has(id)
  );

  if (hasUnknownCreator) {
    return "Your squad contains an unknown creator.";
  }

  // Use prices from our dataset, not from the browser.
  const cost = body.picks.reduce(
    (total, id) => total + byId.get(id).salary,
    0
  );

  if (cost > maxSpend) {
    return maxSpend <= 0
      ? "You have no money left for changes this week. Your current squad stays locked."
      : `This squad costs $${cost}, but you only have $${maxSpend} to spend this week.`;
  }

  return null;
}
