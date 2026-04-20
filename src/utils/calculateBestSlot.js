/**
 * Mathematically evaluates the array of time slots against nested availability matrices 
 * to surface the structurally 'best' slot dynamically.
 * 
 * Weights are calculated intuitively:
 * 'available' = +2 points
 * 'maybe' = +1 point
 * 'unavailable' = +0 points
 */
export function calculateBestSlot(timeSlots, availabilities) {
  if (!timeSlots || timeSlots.length === 0) return null;
  if (!availabilities || Object.keys(availabilities).length === 0) return null;

  let optimalSlot = null;
  let highestScore = -1; // Allows a 0-score slot to be selected if it's the only one voted on, but typically requires score > 0

  timeSlots.forEach((slot) => {
    let currentScore = 0;

    Object.values(availabilities).forEach((userVotes) => {
      const vote = userVotes[slot];
      if (vote === 'available') {
        currentScore += 2;
      } else if (vote === 'maybe') {
        currentScore += 1;
      }
    });

    // We only recommend a "best" slot if it actually generated positive voting action
    if (currentScore > highestScore && currentScore > 0) {
      highestScore = currentScore;
      optimalSlot = slot;
    }
  });

  return optimalSlot;
}
