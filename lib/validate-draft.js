export function validateDraft(body, creators) {
  if (
    !body ||
    !Array.isArray(body.picks) ||
    body.picks.length !== 5 ||
    new Set(body.picks).size !== 5
  ) {
    return "Pick exactly five different creators.";
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

  if (cost > 50) {
    return "Your squad exceeds the $50 virtual budget.";
  }

  return null;
}
