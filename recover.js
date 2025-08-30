const fs = require("fs");

const data = JSON.parse(fs.readFileSync("shares.json", "utf-8"));
const { keys, ...rawShares } = data;
const { k, n } = keys;

const shares = Object.entries(rawShares).map(([x, obj]) => {
  const base = parseInt(obj.base);
  const value = parseInt(obj.value, base);
  return { x: parseInt(x), y: value };
});

function lagrangeInterpolation(subset) {
  let secret = 0;
  const len = subset.length;

  for (let i = 0; i < len; i++) {
    const { x: xi, y: yi } = subset[i];
    let term = yi;

    for (let j = 0; j < len; j++) {
      if (i !== j) {
        const { x: xj } = subset[j];
        term *= (0 - xj) / (xi - xj);
      }
    }
    secret += term;
  }

  return Math.round(secret);
}

function getCombinations(arr, k) {
  if (k === 1) return arr.map(x => [x]);
  const combos = [];
  arr.forEach((val, i) => {
    const restCombos = getCombinations(arr.slice(i + 1), k - 1);
    restCombos.forEach(c => combos.push([val, ...c]));
  });
  return combos;
}

function reconstructSecret(shares, k) {
  const combinations = getCombinations(shares, k);
  const results = {};

  for (const subset of combinations) {
    const secret = lagrangeInterpolation(subset);
    results[secret] = (results[secret] || 0) + 1;
  }

  return parseInt(
    Object.keys(results).reduce((a, b) => (results[a] > results[b] ? a : b))
  );
}

const secret = reconstructSecret(shares, k);

let wrongShare = null;
for (const share of shares) {
  const subset = shares.filter(s => s !== share);
  const reconstructed = reconstructSecret(subset, k);
  if (reconstructed === secret) {
    wrongShare = share;
    break;
  }
}

console.log("Secret is:", secret);
console.log("Wrong Share is:", wrongShare);
