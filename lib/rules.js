// League rules. Safe to import from both the browser and the server.

export const TEAM_SIZE = 4;

// Every scout gets this much virtual money each week.
export const WEEKLY_BUDGET = 50;

// Locking in your first squad of the week is free.
// Every change after that costs this much from the same week's money.
export const CHANGE_FEE = 5;

// Extra points for the top three scouts of each finished week.
export const WEEKLY_BONUS_POINTS = [15, 10, 5];

// Extra money added to next week's budget for the top three scouts.
export const WEEKLY_PRIZE_MONEY = [6, 4, 2];

// What scouts win at the end of the month for backing a top streamer.
export const MONTHLY_REWARDS = [
  {
    rank: 1,
    reward: "Meet the streamer",
    detail: "A live meet and greet with the #1 streamer of the month.",
  },
  {
    rank: 2,
    reward: "Signed merch",
    detail: "A merch pack signed by the #2 streamer.",
  },
  {
    rank: 3,
    reward: "Shoutout on stream",
    detail: "Your scout name read out live by the #3 streamer.",
  },
  {
    rank: 10,
    reward: "Giveaway entry",
    detail: "An entry into the monthly giveaway for backing a top 10 streamer.",
  },
];

export function monthlyReward(rank) {
  return MONTHLY_REWARDS.find((tier) => rank <= tier.rank) || null;
}

export function bonusPoints(rank) {
  return WEEKLY_BONUS_POINTS[rank - 1] || 0;
}

export function prizeMoney(rank) {
  return WEEKLY_PRIZE_MONEY[rank - 1] || 0;
}
