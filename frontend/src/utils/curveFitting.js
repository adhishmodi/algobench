export function calculateRSquared(results, complexityFn) {
  if (results.length === 0) return 0;
  if (results.length === 1) return 1;

  // Normalization
  const maxTime = Math.max(...results.map(r => r.time_ms));
  // Avoid division by zero if all times are 0 somehow
  const denom = maxTime === 0 ? 1 : maxTime;
  
  const normalizedResults = results.map(r => ({
    n: r.size,
    t: r.time_ms / denom
  }));

  // y = c * f(n)
  // c = sum(t * f(n)) / sum(f(n)^2)
  let sumTF = 0;
  let sumF2 = 0;
  let sumT = 0;

  for (const r of normalizedResults) {
    const f_n = complexityFn(r.n);
    sumTF += r.t * f_n;
    sumF2 += f_n * f_n;
    sumT += r.t;
  }

  // Handle f(n) = 0 edge cases safely
  const c = sumF2 === 0 ? 0 : sumTF / sumF2;
  const meanT = sumT / normalizedResults.length;

  let ssRes = 0;
  let ssTot = 0;

  for (const r of normalizedResults) {
    const f_n = complexityFn(r.n);
    const predicted = c * f_n;
    ssRes += Math.pow(r.t - predicted, 2);
    ssTot += Math.pow(r.t - meanT, 2);
  }

  if (ssTot === 0) return ssRes === 0 ? 1 : 0; // Perfect flat line
  return 1 - (ssRes / ssTot);
}

const COMPLEXITY_FUNCTIONS = {
  "O(1)": n => 1,
  "O(\\log n)": n => Math.log2(n || 1),
  "O(n)": n => n,
  "O(n \\log n)": n => n * Math.log2(n || 1),
  "O(n^2)": n => n * n,
  "O(n^3)": n => n * n * n,
  "O(2^n)": n => Math.pow(2, n)
};

export function detectEmpiricalComplexity(results) {
  if (!results || results.length < 2) {
    return { detected: null, confidenceWarning: null, scores: [], bestC: null };
  }

  const scores = [];
  
  // Need to also calculate the 'c' constant for the best fit so we can draw the Ideal curve
  const maxTime = Math.max(...results.map(r => r.time_ms));
  const denom = maxTime === 0 ? 1 : maxTime;
  
  for (const [notation, fn] of Object.entries(COMPLEXITY_FUNCTIONS)) {
    const r2 = calculateRSquared(results, fn);
    
    // Calculate un-normalized c for drawing
    let sumTF = 0;
    let sumF2 = 0;
    for (const r of results) {
      const f_n = fn(r.size);
      sumTF += r.time_ms * f_n;
      sumF2 += f_n * f_n;
    }
    const rawC = sumF2 === 0 ? 0 : sumTF / sumF2;
    
    scores.push({ notation, r2, fn, rawC });
  }

  // Sort by R^2 descending
  scores.sort((a, b) => b.r2 - a.r2);

  const best = scores[0];
  const secondBest = scores[1];
  
  let warning = null;
  // If top two are within 5% of each other, warn
  if (secondBest && (best.r2 - secondBest.r2) < 0.05) {
    warning = `Likely ${best.notation}, but behaving like ${secondBest.notation} at this scale.`;
  }

  return {
    detected: best.notation,
    confidenceWarning: warning,
    scores: scores,
    bestC: best.rawC,
    bestFn: best.fn
  };
}
