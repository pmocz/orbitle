// ============================================================
// CONSTANTS
// ============================================================
const COLORS = ["Crimson", "Amber", "Teal", "Violet"];
const COLOR_SHORT = ["Crm", "Amb", "Tea", "Vlt"];
const COLOR_HEX = { Crimson: "#c84b4b", Amber: "#d49a3a", Teal: "#3aa89a", Violet: "#9a6bb8" };
const PLANETS = ["Rocky", "Ocean", "Ice", "Lava"];
const PLANET_SHORT = ["Rky", "Ocn", "Ice", "Lav"];
const ATMOSPHERES = ["Methane", "Oxygen", "Nitrogen", "Hydrogen"];
const ATMOSPHERE_SHORT = ["CH₄", "O₂", "N₂", "H₂"];
const MOONS = [0, 1, 2, 3];

const CATEGORIES = [
  { key: "color",      label: "Color",      values: COLORS,      short: COLOR_SHORT },
  { key: "planet",     label: "Planet",     values: PLANETS,     short: PLANET_SHORT },
  { key: "atmosphere", label: "Atmosphere", values: ATMOSPHERES, short: ATMOSPHERE_SHORT },
  { key: "moons",      label: "Moons",      values: MOONS,       short: MOONS.map(String) },
];
const CATEGORY_KEYS = CATEGORIES.map(cat => cat.key);

// ============================================================
// PERMUTATION HELPERS
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

const ALL_PERMS_4 = permutations([0, 1, 2, 3]);

// ============================================================
// DAILY SEEDING
// ============================================================
function utcPuzzleId(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcMidnight(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
}

function timeUntilNextPuzzle() {
  return Math.max(0, nextUtcMidnight() - Date.now());
}

function countdownText(ms = timeUntilNextPuzzle()) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeed(seed, fn) {
  const nativeRandom = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = nativeRandom;
  }
}

// ============================================================
// CLUE HELPERS
// ============================================================
function valAt(sol, cat, slot) { return sol[cat][slot]; }
function slotOf(sol, cat, valIdx) { return sol[cat].indexOf(valIdx); }

function labelFor(cat, valIdx) {
  if (cat === "color") return `${COLORS[valIdx]}-colored planet`;
  if (cat === "planet") return `${PLANETS[valIdx]} planet`;
  if (cat === "atmosphere") return `${ATMOSPHERES[valIdx]} atmosphere planet`;
  if (cat === "moons") return `${MOONS[valIdx]}-moon planet`;
  return "?";
}

// ============================================================
// CLUE FACTORIES
// ============================================================
function clueAtSlot(sol, cat, slot) {
  const valIdx = valAt(sol, cat, slot);
  return {
    text: `The ${labelFor(cat, valIdx)} is in orbit ${slot + 1}.`,
    test: (s) => s[cat][slot] === valIdx,
    weight: 4,
    anchor: true
  };
}

function clueAtPosition(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const slot = Math.floor(Math.random() * 4);
  return clueAtSlot(sol, cat, slot);
}

function cluePaired(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  let c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  while (c2 === c1) c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const slot = Math.floor(Math.random() * 4);
  const v1 = valAt(sol, c1, slot), v2 = valAt(sol, c2, slot);
  return { text: `The ${labelFor(c1, v1)} shares an orbit with the ${labelFor(c2, v2)}.`, test: (s) => slotOf(s, c1, v1) === slotOf(s, c2, v2), weight: 3 };
}

function clueNotPaired(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  let c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  while (c2 === c1) c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v1 = Math.floor(Math.random() * 4);
  const slot1 = slotOf(sol, c1, v1);
  const otherSlots = [0, 1, 2, 3].filter((s) => s !== slot1);
  const otherSlot = otherSlots[Math.floor(Math.random() * otherSlots.length)];
  const v2 = valAt(sol, c2, otherSlot);
  return { text: `The ${labelFor(c1, v1)} is not in the same orbit as the ${labelFor(c2, v2)}.`, test: (s) => slotOf(s, c1, v1) !== slotOf(s, c2, v2), weight: 1 };
}

function clueImmediatelyLeft(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const slot = Math.floor(Math.random() * 3);
    const v1 = valAt(sol, c1, slot), v2 = valAt(sol, c2, slot + 1);
    if (c1 === c2 && v1 === v2) continue;
    return { text: `The ${labelFor(c1, v1)} is immediately inward of the ${labelFor(c2, v2)}.`, test: (s) => slotOf(s, c1, v1) + 1 === slotOf(s, c2, v2), weight: 3 };
  }
  return null;
}

function clueLeftOf(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if (s1 < s2) return { text: `The ${labelFor(c1, v1)} orbits closer in than the ${labelFor(c2, v2)}.`, test: (s) => slotOf(s, c1, v1) < slotOf(s, c2, v2), weight: 2 };
  }
  return null;
}

function clueAdjacent(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if (Math.abs(s1 - s2) === 1) return { text: `The ${labelFor(c1, v1)} is adjacent to the ${labelFor(c2, v2)}.`, test: (s) => Math.abs(slotOf(s, c1, v1) - slotOf(s, c2, v2)) === 1, weight: 2 };
  }
  return null;
}

function clueNotAdjacent(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if (Math.abs(s1 - s2) > 1) return { text: `The ${labelFor(c1, v1)} is not adjacent to the ${labelFor(c2, v2)}.`, test: (s) => Math.abs(slotOf(s, c1, v1) - slotOf(s, c2, v2)) > 1, weight: 1 };
  }
  return null;
}

function clueOneBetween(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if (Math.abs(s1 - s2) === 2) return { text: `Exactly one orbit separates the ${labelFor(c1, v1)} from the ${labelFor(c2, v2)}.`, test: (s) => Math.abs(slotOf(s, c1, v1) - slotOf(s, c2, v2)) === 2, weight: 2 };
  }
  return null;
}

function clueMoreMoonsThan(sol) {
  const c2 = CATEGORIES[Math.floor(Math.random() * 3)].key;
  for (let attempt = 0; attempt < 20; attempt++) {
    const v2 = Math.floor(Math.random() * 4);
    const slot2 = slotOf(sol, c2, v2);
    const moonsAtSlot = sol.moons[slot2];
    const candidates = [0, 1, 2, 3].filter((s) => s !== slot2 && sol.moons[s] < moonsAtSlot);
    if (candidates.length === 0) continue;
    const otherSlot = candidates[Math.floor(Math.random() * candidates.length)];
    const c1 = CATEGORIES[Math.floor(Math.random() * 3)].key;
    const v1 = valAt(sol, c1, otherSlot);
    if (c1 === c2 && v1 === v2) continue;
    return { text: `The ${labelFor(c2, v2)} has more moons than the ${labelFor(c1, v1)}.`, test: (s) => s.moons[slotOf(s, c2, v2)] > s.moons[slotOf(s, c1, v1)], weight: 2 };
  }
  return null;
}

function clueExactMoons(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 3)].key;
  const v1 = Math.floor(Math.random() * 4);
  const slot = slotOf(sol, c1, v1);
  const n = sol.moons[slot];
  return { text: `The ${labelFor(c1, v1)} has ${n} moon${n === 1 ? "" : "s"}.`, test: (s) => s.moons[slotOf(s, c1, v1)] === n, weight: 4 };
}

function clueNotAtPosition(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v = Math.floor(Math.random() * 4);
  const trueSlot = slotOf(sol, cat, v);
  const otherSlots = [0, 1, 2, 3].filter((s) => s !== trueSlot);
  const slot = otherSlots[Math.floor(Math.random() * otherSlots.length)];
  return { text: `The ${labelFor(cat, v)} is not in orbit ${slot + 1}.`, test: (s) => slotOf(s, cat, v) !== slot, weight: 1 };
}

function clueOneOfTwoOrbits(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v = Math.floor(Math.random() * 4);
  const trueSlot = slotOf(sol, cat, v);
  const otherSlots = [0, 1, 2, 3].filter((s) => s !== trueSlot);
  const otherSlot = otherSlots[Math.floor(Math.random() * otherSlots.length)];
  const options = [trueSlot, otherSlot].sort((a, b) => a - b);
  return {
    text: `The ${labelFor(cat, v)} is in orbit ${options[0] + 1} or orbit ${options[1] + 1}.`,
    test: (s) => options.includes(slotOf(s, cat, v)),
    weight: 2
  };
}

function clueInwardOrOutwardOfOrbit(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v = Math.floor(Math.random() * 4);
  const trueSlot = slotOf(sol, cat, v);
  const inwardChoices = [2, 3, 4].filter((orbit) => trueSlot < orbit - 1);
  const outwardChoices = [1, 2, 3].filter((orbit) => trueSlot > orbit - 1);
  if (inwardChoices.length === 0) {
    const orbit = outwardChoices[Math.floor(Math.random() * outwardChoices.length)];
    return { text: `The ${labelFor(cat, v)} orbits outward of orbit ${orbit}.`, test: (s) => slotOf(s, cat, v) > orbit - 1, weight: 2 };
  }
  if (outwardChoices.length === 0) {
    const orbit = inwardChoices[Math.floor(Math.random() * inwardChoices.length)];
    return { text: `The ${labelFor(cat, v)} orbits inward of orbit ${orbit}.`, test: (s) => slotOf(s, cat, v) < orbit - 1, weight: 2 };
  }
  if (Math.random() < 0.5) {
    const orbit = inwardChoices[Math.floor(Math.random() * inwardChoices.length)];
    return { text: `The ${labelFor(cat, v)} orbits inward of orbit ${orbit}.`, test: (s) => slotOf(s, cat, v) < orbit - 1, weight: 2 };
  }
  const orbit = outwardChoices[Math.floor(Math.random() * outwardChoices.length)];
  return { text: `The ${labelFor(cat, v)} orbits outward of orbit ${orbit}.`, test: (s) => slotOf(s, cat, v) > orbit - 1, weight: 2 };
}

function cluePairedMoonsParity(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 3)].key;
  const v1 = Math.floor(Math.random() * 4);
  const slot = slotOf(sol, c1, v1);
  const n = sol.moons[slot];
  const parity = n % 2 === 0 ? "even" : "odd";
  return { text: `The ${labelFor(c1, v1)} has an ${parity} number of moons.`, test: (s) => (s.moons[slotOf(s, c1, v1)] % 2 === 0) === (parity === "even"), weight: 2 };
}

function clueMoonsBound(sol) {
  const c1 = CATEGORIES[Math.floor(Math.random() * 3)].key;
  const v1 = Math.floor(Math.random() * 4);
  const slot = slotOf(sol, c1, v1);
  const n = sol.moons[slot];
  if (n === 0) return { text: `The ${labelFor(c1, v1)} has fewer than 2 moons.`, test: (s) => s.moons[slotOf(s, c1, v1)] < 2, weight: 2 };
  if (n === 3) return { text: `The ${labelFor(c1, v1)} has more than 1 moon.`, test: (s) => s.moons[slotOf(s, c1, v1)] > 1, weight: 2 };
  if (Math.random() < 0.5) return { text: `The ${labelFor(c1, v1)} has at least ${n} moon${n === 1 ? "" : "s"}.`, test: (s) => s.moons[slotOf(s, c1, v1)] >= n, weight: 1 };
  return { text: `The ${labelFor(c1, v1)} has at most ${n} moon${n === 1 ? "" : "s"}.`, test: (s) => s.moons[slotOf(s, c1, v1)] <= n, weight: 1 };
}

function clueMoonDifference(sol) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const c1 = CATEGORIES[Math.floor(Math.random() * 3)].key;
    const c2 = CATEGORIES[Math.floor(Math.random() * 3)].key;
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if (s1 === s2) continue;
    const diff = sol.moons[s1] - sol.moons[s2];
    if (Math.abs(diff) < 2) continue;
    if (diff > 0) return { text: `The ${labelFor(c1, v1)} has exactly ${diff} more moons than the ${labelFor(c2, v2)}.`, test: (s) => s.moons[slotOf(s, c1, v1)] - s.moons[slotOf(s, c2, v2)] === diff, weight: 3 };
    return { text: `The ${labelFor(c2, v2)} has exactly ${-diff} more moons than the ${labelFor(c1, v1)}.`, test: (s) => s.moons[slotOf(s, c2, v2)] - s.moons[slotOf(s, c1, v1)] === -diff, weight: 3 };
  }
  return null;
}

function clueHalf(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v = Math.floor(Math.random() * 4);
  const slot = slotOf(sol, cat, v);
  const inner = slot < 2;
  return { text: `The ${labelFor(cat, v)} orbits in the ${inner ? "inner" : "outer"} half of the system.`, test: (s) => { const sl = slotOf(s, cat, v); return inner ? sl < 2 : sl >= 2; }, weight: 1 };
}

function clueExtremesOrMiddle(sol) {
  const cat = CATEGORIES[Math.floor(Math.random() * 4)].key;
  const v = Math.floor(Math.random() * 4);
  const slot = slotOf(sol, cat, v);
  const isExtreme = slot === 0 || slot === 3;
  return {
    text: isExtreme ? `The ${labelFor(cat, v)} occupies one of the system's edge orbits.` : `The ${labelFor(cat, v)} is in one of the middle orbits.`,
    test: (s) => { const sl = slotOf(s, cat, v); return isExtreme ? sl === 0 || sl === 3 : sl === 1 || sl === 2; },
    weight: 1,
  };
}

function clueDisjunction(sol) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const ts1 = slotOf(sol, c1, v1), ts2 = slotOf(sol, c2, v2);
    if (Math.random() < 0.5) {
      const slot2 = [0, 1, 2, 3].filter((x) => x !== ts2)[Math.floor(Math.random() * 3)];
      return { text: `Either the ${labelFor(c1, v1)} is in orbit ${ts1 + 1}, or the ${labelFor(c2, v2)} is in orbit ${slot2 + 1} (or both).`, test: (s) => slotOf(s, c1, v1) === ts1 || slotOf(s, c2, v2) === slot2, weight: 2 };
    } else {
      const slot1 = [0, 1, 2, 3].filter((x) => x !== ts1)[Math.floor(Math.random() * 3)];
      return { text: `Either the ${labelFor(c1, v1)} is in orbit ${slot1 + 1}, or the ${labelFor(c2, v2)} is in orbit ${ts2 + 1} (or both).`, test: (s) => slotOf(s, c1, v1) === slot1 || slotOf(s, c2, v2) === ts2, weight: 2 };
    }
  }
  return null;
}

function clueBetween(sol) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const cX = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const cY = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const cZ = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const vX = Math.floor(Math.random() * 4), vY = Math.floor(Math.random() * 4), vZ = Math.floor(Math.random() * 4);
    if (cX === cY && vX === vY) continue;
    if (cX === cZ && vX === vZ) continue;
    if (cY === cZ && vY === vZ) continue;
    const sX = slotOf(sol, cX, vX), sY = slotOf(sol, cY, vY), sZ = slotOf(sol, cZ, vZ);
    const lo = Math.min(sY, sZ), hi = Math.max(sY, sZ);
    if (sX > lo && sX < hi && Math.abs(sX - sY) === 1 && Math.abs(sX - sZ) === 1) {
      const inner = sY < sZ ? { cat: cY, val: vY } : { cat: cZ, val: vZ };
      const outer = sY < sZ ? { cat: cZ, val: vZ } : { cat: cY, val: vY };
      return {
        text: `The ${labelFor(cX, vX)} orbits directly between the ${labelFor(inner.cat, inner.val)} (inward) and the ${labelFor(outer.cat, outer.val)} (outward).`,
        test: (s) => {
          const a = slotOf(s,cX,vX), b = slotOf(s,cY,vY), c = slotOf(s,cZ,vZ);
          return a > Math.min(b,c) && a < Math.max(b,c) && Math.abs(a - b) === 1 && Math.abs(a - c) === 1;
        },
        weight: 2
      };
    }
  }
  return null;
}

function clueDifferentHalves(sol) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const c1 = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const c2 = CATEGORIES[Math.floor(Math.random() * 4)].key;
    const v1 = Math.floor(Math.random() * 4), v2 = Math.floor(Math.random() * 4);
    if (c1 === c2 && v1 === v2) continue;
    const s1 = slotOf(sol, c1, v1), s2 = slotOf(sol, c2, v2);
    if ((s1 < 2) !== (s2 < 2)) {
      return { text: `The ${labelFor(c1, v1)} and the ${labelFor(c2, v2)} orbit in different halves of the system.`, test: (s) => { const a = slotOf(s,c1,v1), b = slotOf(s,c2,v2); return (a < 2) !== (b < 2); }, weight: 2 };
    }
  }
  return null;
}

const CLUE_FACTORIES = [
  clueAtPosition, clueAtPosition, clueAtPosition, clueAtPosition,
  clueNotAtPosition, clueNotAtPosition, clueNotAtPosition,
  clueOneOfTwoOrbits, clueOneOfTwoOrbits, clueOneOfTwoOrbits,
  clueHalf, clueHalf, clueExtremesOrMiddle, clueInwardOrOutwardOfOrbit,
  clueImmediatelyLeft, clueLeftOf, clueAdjacent, clueOneBetween, clueBetween,
];

// ============================================================
// SOLVER
// ============================================================
function countSolutionsFast(clues, capAt = 2) {
  let count = 0;
  for (const colorPerm of ALL_PERMS_4) {
    for (const planetPerm of ALL_PERMS_4) {
      for (const atmoPerm of ALL_PERMS_4) {
        for (const moonPerm of ALL_PERMS_4) {
          const sol = { color: colorPerm, planet: planetPerm, atmosphere: atmoPerm, moons: moonPerm };
          let ok = true;
          for (const c of clues) { if (!c.test(sol)) { ok = false; break; } }
          if (ok) { count++; if (count >= capAt) return count; }
        }
      }
    }
  }
  return count;
}

// ============================================================
// PUZZLE GENERATOR
// ============================================================
function generatePuzzle() {
  const solution = { color: shuffle([0,1,2,3]), planet: shuffle([0,1,2,3]), atmosphere: shuffle([0,1,2,3]), moons: shuffle([0,1,2,3]) };
  const pool = [];
  const seedClues = shuffle(CATEGORIES)
    .slice(0, 2)
    .map(cat => clueAtSlot(solution, cat.key, Math.floor(Math.random() * 4)));
  pool.push(...seedClues);
  for (let i = 0; i < 160; i++) {
    const factory = CLUE_FACTORIES[Math.floor(Math.random() * CLUE_FACTORIES.length)];
    const clue = factory(solution);
    if (clue && clue.test(solution)) pool.push(clue);
  }
  const seen = new Set();
  const uniquePool = pool.filter(c => { if (seen.has(c.text)) return false; seen.add(c.text); return true; });
  const chosen = seedClues.filter(c => seen.has(c.text));
  const chosenTexts = new Set(chosen.map(c => c.text));
  const remaining = shuffle(uniquePool.filter(c => !chosenTexts.has(c.text)));
  let curCount = countSolutionsFast(chosen, ALL_PERMS_4.length ** 4);
  while (curCount > 1 && chosen.length < 14 && remaining.length > 0) {
    let pickedIdx = -1, pickedCount = curCount;
    const halfTarget = Math.max(1, Math.floor(curCount / 2));
    for (let i = 0; i < Math.min(20, remaining.length); i++) {
      const n = countSolutionsFast([...chosen, remaining[i]], halfTarget + 1);
      if (n <= halfTarget) { pickedIdx = i; pickedCount = n; break; }
    }
    if (pickedIdx === -1) {
      for (let i = 0; i < remaining.length; i++) {
        const n = countSolutionsFast([...chosen, remaining[i]], curCount);
        if (n < curCount) { pickedIdx = i; pickedCount = n; break; }
      }
    }
    if (pickedIdx === -1) break;
    chosen.push(remaining[pickedIdx]);
    remaining.splice(pickedIdx, 1);
    curCount = pickedCount;
  }
  if (countSolutionsFast(chosen, 2) !== 1) return null;
  let minimal = [...chosen], changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < minimal.length; i++) {
      if (minimal[i].anchor && minimal.filter(c => c.anchor).length <= 2) continue;
      const without = minimal.filter((_, j) => j !== i);
      if (countSolutionsFast(without, 2) === 1) { minimal = without; changed = true; break; }
    }
  }
  return { solution, clues: minimal };
}

function generatePuzzleWithRetry(maxAttempts = 8) {
  for (let i = 0; i < maxAttempts; i++) { const p = generatePuzzle(); if (p) return p; }
  return null;
}

function generateDailyPuzzle(puzzleId = utcPuzzleId()) {
  for (let i = 0; i < 8; i++) {
    const puzzleForSeed = withSeed(seedFromString(`${puzzleId}:${i}`), () => generatePuzzleWithRetry(10));
    if (puzzleForSeed) return puzzleForSeed;
  }
  return withSeed(seedFromString(`${puzzleId}:fallback`), () => generatePuzzleWithRetry(30));
}

// ============================================================
// STATE
// ============================================================
let puzzle = null;
let currentPuzzleId = utcPuzzleId();
let loading = true;
let board = emptyBoard();
let strikes = emptyStrikes();
let selected = { cat: null, slot: null, mode: "place" };
let status = "playing"; // playing | won | done
let showHelp = false;
let showInfo = false;
let shareCopied = false;
let shareCopiedTimer = null;
let resultCopied = false;
let resultCopiedTimer = null;
let crossedClues = new Set();
let placementOrder = [];
let placementSeq = 0;
let pointerDrag = null;
let suppressNextClick = null;
let mutedStrikeHoverSlot = null;
let orbitAnimationStarted = false;
let orbitAnimationEpoch = Date.now();
const ORBIT_CENTER = { x: 300, y: 50 };
const ORBIT_SYSTEM_ORBITS = [
  { rx: 64, ry: 10, angle: 0, r: 5.5, phase: 0 },
  { rx: 124, ry: 18, angle: 0, r: 6, phase: 0 },
  { rx: 184, ry: 27, angle: 0, r: 6.6, phase: 0 },
  { rx: 244, ry: 36, angle: 0, r: 7, phase: 0 },
].map(orbit => ({
  ...orbit,
  duration: 8 * Math.pow(orbit.rx / 64, 1.5),
}));
const SHARE_URL = "https://orbitle.app";
const SHARE_COPIED_MS = 1400;
const SOLVED_STORAGE_PREFIX = "orbitle-solved-";
const RESULT_STORAGE_PREFIX = "orbitle-result-";
const GAMES_PLAYED_KEY = "orbitle-games-played";
const TUTORIAL_SEEN_KEY = "orbitle-tutorial-seen";
const PUZZLE_NUMBER_EPOCH = Date.UTC(2026, 0, 1);
const CATEGORY_SHARE_SQUARES = {
  color: "⬜",
  planet: "🟧",
  atmosphere: "🟩",
  moons: "🟪",
};

// ============================================================
// HELPERS
// ============================================================
function emptyBoard() {
  return Object.fromEntries(CATEGORY_KEYS.map(key => [key, [null, null, null, null]]));
}

function emptyStrikes() {
  return Object.fromEntries(CATEGORY_KEYS.map(key => [key, [new Set(), new Set(), new Set(), new Set()]]));
}

function selection(slot = null, mode = "place") {
  return { cat: null, slot, mode };
}

function resetGameState() {
  board = emptyBoard();
  strikes = emptyStrikes();
  selected = selection();
  status = "playing";
  crossedClues = new Set();
  placementOrder = [];
  placementSeq = 0;
  pointerDrag = null;
  suppressNextClick = null;
  orbitAnimationStarted = false;
  orbitAnimationEpoch = Date.now();
  document.body?.classList.remove("dragging-tile");
}

function boardHasPlacedTiles() {
  return CATEGORY_KEYS.some(cat => board[cat].some(v => v !== null));
}

function startOrbitAnimationIfNeeded() {
  if (orbitAnimationStarted || !boardHasPlacedTiles()) return;
  orbitAnimationStarted = true;
  orbitAnimationEpoch = Date.now();
}

function solvedKey(puzzleId = currentPuzzleId) {
  return `${SOLVED_STORAGE_PREFIX}${puzzleId}`;
}

function resultKey(puzzleId = currentPuzzleId) {
  return `${RESULT_STORAGE_PREFIX}${puzzleId}`;
}

function markPuzzleSolved() {
  try {
    const wasSolved = isPuzzleSolved();
    localStorage.setItem(solvedKey(), "1");
    if (!wasSolved) localStorage.setItem(GAMES_PLAYED_KEY, String(gamesPlayed() + 1));
  } catch (_) {}
}

function isPuzzleSolved(puzzleId = currentPuzzleId) {
  try {
    return localStorage.getItem(solvedKey(puzzleId)) === "1";
  } catch (_) {
    return false;
  }
}

function gamesPlayed() {
  try {
    return parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || "0", 10) || 0;
  } catch (_) {
    return 0;
  }
}

function hasSeenTutorial() {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
  } catch (_) {
    return true;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  } catch (_) {}
}

function puzzleNumber(puzzleId = currentPuzzleId) {
  const [year, month, day] = puzzleId.split("-").map(Number);
  const date = Date.UTC(year, month - 1, day);
  return Math.max(1, Math.floor((date - PUZZLE_NUMBER_EPOCH) / 86400000) + 1);
}

function saveShareResult(text) {
  try {
    localStorage.setItem(resultKey(), text);
  } catch (_) {}
}

function storedShareResult() {
  try {
    return localStorage.getItem(resultKey()) || "";
  } catch (_) {
    return "";
  }
}

function loadDailyPuzzle() {
  currentPuzzleId = utcPuzzleId();
  puzzle = generateDailyPuzzle(currentPuzzleId);
  status = isPuzzleSolved() ? "won" : "playing";
  if (status === "won") board = solvedBoard();
  if (status === "won" && !orbitAnimationStarted) {
    orbitAnimationStarted = true;
    orbitAnimationEpoch = Date.now();
  }
}

function solvedBoard() {
  if (!puzzle) return emptyBoard();
  return Object.fromEntries(CATEGORY_KEYS.map(cat => [cat, [...puzzle.solution[cat]]]));
}

function effectiveStrikes(cat, slot) {
  const out = new Set(strikes[cat][slot]);
  for (let i = 0; i < 4; i++) {
    if (i !== slot && board[cat][i] !== null) out.add(board[cat][i]);
  }
  return out;
}

function checkWin(b) {
  if (!puzzle) return;
  if (!Object.values(b).every(arr => arr.every(v => v !== null))) return;
  if (CATEGORY_KEYS.every(c => b[c].every((v, i) => v === puzzle.solution[c][i]))) {
    setWon();
    render();
  }
}

function tileKey(cat, valIdx) {
  return `${cat}:${valIdx}`;
}

function removePlacement(cat, valIdx) {
  const key = tileKey(cat, valIdx);
  placementOrder = placementOrder.filter(item => item.key !== key);
}

function recordPlacement(cat, valIdx, slot) {
  removePlacement(cat, valIdx);
  placementOrder.push({ key: tileKey(cat, valIdx), cat, valIdx, slot, order: ++placementSeq });
}

function finalPlacementOrder() {
  const placedKeys = new Set();
  CATEGORY_KEYS.forEach(cat => {
    board[cat].forEach(valIdx => {
      if (valIdx !== null) placedKeys.add(tileKey(cat, valIdx));
    });
  });

  const ordered = placementOrder.filter(item => placedKeys.has(item.key));
  const orderedKeys = new Set(ordered.map(item => item.key));
  CATEGORY_KEYS.forEach(cat => {
    board[cat].forEach((valIdx, slot) => {
      if (valIdx === null || orderedKeys.has(tileKey(cat, valIdx))) return;
      ordered.push({ key: tileKey(cat, valIdx), cat, valIdx, slot, order: Number.MAX_SAFE_INTEGER });
    });
  });
  return ordered.slice(0, 16);
}

function buildShareResultText() {
  const squares = finalPlacementOrder().map(item => CATEGORY_SHARE_SQUARES[item.cat] || "■");
  while (squares.length < 16) squares.push("□");
  const rows = [0, 4, 8, 12].map(start => squares.slice(start, start + 4).join("")).join("\n");
  return `Orbitle #${puzzleNumber()}\n${rows}\n${SHARE_URL}`;
}

function shareResultText() {
  return storedShareResult() || buildShareResultText();
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateWinFlavorText() {
  const adjectives = [
    "small and luminous",
    "quietly brilliant",
    "beautifully patient",
    "starlit",
    "carefully tended",
    "graceful",
    "bright little",
    "lovely",
    "jubilant",
    "quaint",
  ];
  const nouns = [
    "star chart",
    "orbit mystery",
    "planet layout",
    "stellar system",
    "moonlit arrangement",
    "stellar map",
    "constellation of clues",
    "system map",
    "astronomical object",
    "celestial knot",
  ];
  const verbs = [
    "has settled into place",
    "has been charted",
    "has gently untangled itself",
    "has been gently resolved",
    "has been brought into focus",
    "has opened up",
    "has been brought into alignment",
    "has revealed its shape",
    "has been made clear",
    "has been completed with care",
  ];
  const flourishes = [
    "nicely done",
    "the stars seem pleased",
    "the observatory lights feel a little warmer",
    "a fine bit of noticing",
    "every moon has found a home",
    "the telescope is resting easy",
    "that was lovely thinking",
    "the cosmos feels a little more knowable",
    "your chart is complete",
    "the night sky has opened its hand",
  ];

  return `This ${randomItem(adjectives)} ${randomItem(nouns)} ${randomItem(verbs)}; ${randomItem(flourishes)}.`;
}

function setWon() {
  status = "won";
  if (!orbitAnimationStarted) {
    orbitAnimationStarted = true;
    orbitAnimationEpoch = Date.now();
  }
  saveShareResult(buildShareResultText());
  markPuzzleSolved();
}

// ============================================================
// CLICK HANDLERS
// ============================================================
function handleCellClick(slot) {
  if (status !== "playing") return;
  mutedStrikeHoverSlot = null;
  selected = selection(slot);
  render();
}

function handleStrikeSelect(slot) {
  if (status !== "playing") return;
  if (selected.slot === slot && selected.mode === "strike") {
    selected = selection(slot);
    mutedStrikeHoverSlot = slot;
    render();
    return;
  }
  mutedStrikeHoverSlot = null;
  selected = selection(slot, "strike");
  render();
}

function placeValue(cat, slot, valIdx) {
  const next = { ...board, [cat]: [...board[cat]] };
  if (next[cat][slot] === valIdx) {
    next[cat][slot] = null;
    removePlacement(cat, valIdx);
  } else {
    if (next[cat][slot] !== null) removePlacement(cat, next[cat][slot]);
    for (let i = 0; i < 4; i++) { if (next[cat][i] === valIdx) next[cat][i] = null; }
    next[cat][slot] = valIdx;
    recordPlacement(cat, valIdx, slot);
  }
  board = next;
  startOrbitAnimationIfNeeded();
  const ns = new Set(strikes[cat][slot]);
  ns.delete(valIdx);
  strikes = { ...strikes, [cat]: strikes[cat].map((s, i) => i === slot ? ns : s) };
  checkWin(board);
}

function addStrike(cat, slot, valIdx) {
  if (strikes[cat][slot].has(valIdx)) return;
  const ns = new Set(strikes[cat][slot]);
  ns.add(valIdx);
  strikes = { ...strikes, [cat]: strikes[cat].map((s, i) => i === slot ? ns : s) };
}

function handleValuePick(cat, valIdx) {
  if (status !== "playing") return;
  const slot = selected.slot;
  if (slot === null) return;

  if (selected.mode === "strike") {
    addStrike(cat, slot, valIdx);
    selected = selection(slot);
  } else {
    placeValue(cat, slot, valIdx);
  }
  render();
}

function handleTileDrop(cat, slot, valIdx) {
  if (status !== "playing") return;
  selected = selection(slot);
  placeValue(cat, slot, valIdx);
  render();
}

function handleTileStrikeDrop(cat, slot, valIdx) {
  if (status !== "playing") return;
  selected = selection(slot);
  addStrike(cat, slot, valIdx);
  render();
}

function handleRemoveValue(cat, slot) {
  if (status !== "playing") return;
  if (board[cat][slot] !== null) removePlacement(cat, board[cat][slot]);
  board = { ...board, [cat]: board[cat].map((v, i) => i === slot ? null : v) };
  selected = selection(slot);
  render();
}

function handleClear() {
  resetGameState();
  render();
}

function handleShareLink() {
  if (shareCopiedTimer) clearTimeout(shareCopiedTimer);
  shareCopied = true;
  updateShareButtons();
  navigator.clipboard?.writeText(SHARE_URL);
  shareCopiedTimer = setTimeout(() => {
    shareCopied = false;
    shareCopiedTimer = null;
    updateShareButtons();
  }, SHARE_COPIED_MS);
}

function handleShareResult() {
  const text = shareResultText();
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(intentUrl, "_blank", "noopener,noreferrer");
}

function handleCopyResult() {
  if (resultCopiedTimer) clearTimeout(resultCopiedTimer);
  resultCopied = true;
  navigator.clipboard?.writeText(shareResultText());
  updateResultCopyButton();
  resultCopiedTimer = setTimeout(() => {
    resultCopied = false;
    resultCopiedTimer = null;
    updateResultCopyButton();
  }, 1200);
}

function updateShareButtons() {
  document.querySelectorAll("[data-action='share-link']").forEach(button => {
    button.textContent = shareCopied ? "link copied!" : "Share Orbitle";
    button.classList.toggle("copied", shareCopied);
  });
}

function updateCountdowns() {
  const nextText = countdownText();
  document.querySelectorAll("[data-countdown]").forEach(el => {
    el.textContent = nextText;
  });
}

function checkDailyRollover() {
  if (currentPuzzleId === utcPuzzleId()) return;
  loading = true;
  resetGameState();
  loadDailyPuzzle();
  loading = false;
  render();
}

function tickDailyClock() {
  checkDailyRollover();
  updateCountdowns();
}

function shareButtonHTML(className) {
  return `<button class="${className}${shareCopied ? " copied" : ""}" data-action="share-link">${shareCopied ? "link copied!" : "Share Orbitle"}</button>`;
}

function resultShareButtonHTML(className) {
  return `<button class="${className}" data-action="share-result">Share result</button>`;
}

function updateResultCopyButton() {
  document.querySelectorAll("[data-action='copy-result']").forEach(button => {
    button.classList.toggle("copied", resultCopied);
    button.setAttribute("aria-label", resultCopied ? "Copied" : "Copy result");
  });
}

function helpPopupHTML() {
  return `<div class="orbit-popup orbit-help-content">
    <button class="orbit-popup-close" data-action="close-popup" aria-label="Close popup">×</button>
    <div class="orbit-help-title">How to Play</div>
    <div class="orbit-help-copy">
      Use the observations to deduce each planet's <strong>color</strong>, <strong>type</strong>,
      <strong>atmosphere</strong>, and <strong>moon count</strong>.
    </div>
    <div class="orbit-help-graphic" aria-hidden="true">
      <div class="orbit-help-clue">The Amber-colored planet is immediately inward of the 1-moon planet.</div>
      <div class="orbit-help-demo">
        <div class="orbit-help-board orbit-columns">
          <div class="orbit-column">
            <div class="orbit-header-cell">Orbit 1</div>
            <div class="orbit-column-values">
              <div class="orbit-cell color orbit-help-fill-amber">${cellContentHTML("color", 1)}</div>
              <div class="orbit-cell moons empty">·</div>
            </div>
            <div class="orbit-strike-drop">rule out</div>
          </div>
          <div class="orbit-column">
            <div class="orbit-header-cell">Orbit 2</div>
            <div class="orbit-column-values">
              <div class="orbit-cell color empty">·</div>
              <div class="orbit-cell moons orbit-help-fill-moon">${cellContentHTML("moons", 1)}</div>
            </div>
            <div class="orbit-strike-drop">rule out</div>
          </div>
        </div>
        <div class="orbit-help-picker orbit-picker">
          <div class="orbit-tile-tray">
            <div class="orbit-tile-row color">
              <div class="orbit-options">
                <div class="orbit-option orbit-help-pick">${optionHTML("color", 0)}</div>
                <div class="orbit-option orbit-help-pick">${optionHTML("color", 1)}</div>
              </div>
            </div>
            <div class="orbit-tile-row moons">
              <div class="orbit-options">
                <div class="orbit-option orbit-help-pick">${optionHTML("moons", 0)}</div>
                <div class="orbit-option orbit-help-pick">${optionHTML("moons", 1)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="orbit-help-drag orbit-help-drag-amber">${optionHTML("color", 1)}</div>
        <div class="orbit-help-drag orbit-help-drag-moon">${optionHTML("moons", 1)}</div>
      </div>
    </div>
    <div class="orbit-help-copy">
      Drag or click a tile into an orbit to place it. Use <strong class="orbit-help-ruleout-text">rule out</strong> for combinations you know cannot work.
      Tap an observation to cross it off after you use it.
    </div>
    <button class="orbit-help-start" data-action="start-help">Play</button>
  </div>`;
}

function infoPopupHTML() {
  return `<div class="orbit-popup orbit-info-content">
    <button class="orbit-popup-close" data-action="close-popup" aria-label="Close popup">×</button>
    <div class="orbit-info-title">Orbitle</div>
    <div class="orbit-info-subtitle">A game of celestial deduction</div>
    <div class="orbit-info-stat">
      <span>Games played</span>
      <strong>${gamesPlayed()}</strong>
    </div>
    ${shareButtonHTML("orbit-info-share")}
    <div class="orbit-info-copy">Copyright 2026. All Rights Reserved.</div>
  </div>`;
}

function popupShellHTML() {
  if (!showHelp && !showInfo) return "";
  return `<div class="orbit-popup-shell">${showHelp ? helpPopupHTML() : infoPopupHTML()}</div>`;
}

function updateTopPopups() {
  const helpButton = document.querySelector("[data-action='toggle-help']");
  const infoButton = document.querySelector("[data-action='toggle-info']");
  helpButton?.classList.toggle("active", showHelp);
  infoButton?.classList.toggle("active", showInfo);
  if (helpButton) helpButton.setAttribute("aria-label", showHelp ? "Hide help" : "Show help");
  if (infoButton) infoButton.setAttribute("aria-label", showInfo ? "Hide info" : "Show info");

  const shell = document.querySelector("[data-popup-shell]");
  if (!shell) return;
  shell.innerHTML = popupShellHTML();
}

// ============================================================
// RENDER HELPERS
// ============================================================
function escHTML(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function tileNameFor(cat, valIdx) {
  if (cat === "color") return COLORS[valIdx];
  if (cat === "planet") return PLANETS[valIdx];
  if (cat === "atmosphere") return ATMOSPHERES[valIdx];
  if (cat === "moons") return `${MOONS[valIdx]}-moon`;
  return "?";
}

function escRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TILE_NAMES = CATEGORIES.flatMap(cat => cat.values.map((_, vi) => tileNameFor(cat.key, vi)))
  .sort((a, b) => b.length - a.length);

function clueTextHTML(text) {
  const pattern = TILE_NAMES.map(name => escRegExp(escHTML(name))).join("|");
  return escHTML(text).replace(
    new RegExp(`(^|[^A-Za-z0-9-])(${pattern})(?=[^A-Za-z0-9]|$)`, "g"),
    `$1<strong class="orbit-clue-tile">$2</strong>`
  );
}

function tileIconHTML(cat, valIdx) {
  if (cat === "color") {
    const hex = COLOR_HEX[COLORS[valIdx]];
    return `<span class="orbit-tile-icon color" style="background:${hex};box-shadow:0 0 10px ${hex}"></span>`;
  }
  if (cat === "planet") {
    return `<span class="orbit-tile-icon planet planet-${escHTML(String(PLANETS[valIdx]).toLowerCase())}"></span>`;
  }
  if (cat === "atmosphere") {
    return `<span class="orbit-tile-icon atmosphere atmosphere-${escHTML(String(ATMOSPHERE_SHORT[valIdx]).replace(/[₀-₉]/g, "").toLowerCase())}"></span>`;
  }
  if (cat === "moons") {
    return `<span class="orbit-tile-icon moons moons-${escHTML(String(MOONS[valIdx]))}"></span>`;
  }
  return `<span class="orbit-tile-icon ${escHTML(cat)}"></span>`;
}

function cellContentHTML(cat, v) {
  if (cat === "color") return `<div class="orbit-tile-content">${tileIconHTML(cat, v)}<span>${COLOR_SHORT[v]}</span></div>`;
  if (cat === "atmosphere") return `<div class="orbit-tile-content">${tileIconHTML(cat, v)}<span>${ATMOSPHERE_SHORT[v]}</span></div>`;
  if (cat === "planet") return `<div class="orbit-tile-content">${tileIconHTML(cat, v)}<span>${PLANET_SHORT[v]}</span></div>`;
  if (cat === "moons") return `<div class="orbit-tile-content">${tileIconHTML(cat, v)}<span>${MOONS[v]}</span></div>`;
  return "";
}

function optionHTML(cat, vi) {
  if (cat === "color") return `<div class="orbit-tile-content">${tileIconHTML(cat, vi)}<span>${escHTML(COLORS[vi])}</span></div>`;
  if (cat === "atmosphere") return `<div class="orbit-tile-content">${tileIconHTML(cat, vi)}<span>${escHTML(ATMOSPHERES[vi])}</span></div>`;
  if (cat === "planet") return `<div class="orbit-tile-content">${tileIconHTML(cat, vi)}<span>${escHTML(PLANETS[vi])}</span></div>`;
  if (cat === "moons") {
    return `<div class="orbit-tile-content">${tileIconHTML(cat, vi)}<span>${MOONS[vi]}-moon</span></div>`;
  }
  return "?";
}

function orbitAnimationTime() {
  if (!orbitAnimationStarted) return 0;
  return (Date.now() - orbitAnimationEpoch) / 1000;
}

function orbitProgress(duration, phase = 0) {
  return ((orbitAnimationTime() + phase) % duration) / duration;
}

function ellipsePoint(rx, ry, angleDeg, progress, direction = 1) {
  if (!orbitAnimationStarted) return { x: rx, y: 0 };
  const angle = (angleDeg * Math.PI / 180) + direction * progress * Math.PI * 2;
  return { x: rx * Math.cos(angle), y: ry * Math.sin(angle) };
}

function layerOpacity(layer, progress) {
  const frontHalf = progress < 0.5;
  if (layer === "front-star") return frontHalf ? 1 : 0;
  if (layer === "behind-star") return frontHalf ? 0 : 1;
  if (layer === "front") return frontHalf ? 1 : 0;
  if (layer === "behind") return frontHalf ? 0 : 1;
  return 1;
}

function updateOrbitSystemFrame() {
  if (!document.querySelector(".orbit-system")) return;
  ORBIT_SYSTEM_ORBITS.forEach((orbit, slot) => {
    const progress = orbitProgress(orbit.duration, orbit.phase);
    const point = ellipsePoint(orbit.rx, orbit.ry, orbit.angle, progress);
    document.querySelectorAll(`[data-orbit-slot="${slot}"]`).forEach(el => {
      el.setAttribute("transform", `translate(${(ORBIT_CENTER.x + point.x).toFixed(2)} ${(ORBIT_CENTER.y + point.y).toFixed(2)})`);
      el.style.opacity = layerOpacity(el.dataset.orbitLayer, progress);
      el.dataset.depth = String(point.y);
    });

    const moonDuration = 2.8 + slot * 0.45;
    const moonRx = orbit.r + 5;
    const moonRy = Math.max(3.2, orbit.r * 0.42);
    document.querySelectorAll(`[data-moon-slot="${slot}"]`).forEach(el => {
      const idx = parseInt(el.dataset.moonIndex);
      const moonPhase = (idx / Math.max(1, parseInt(el.dataset.moonCount))) * moonDuration + slot * 0.35;
      const moonProgress = orbitProgress(moonDuration, moonPhase);
      const moonPoint = ellipsePoint(moonRx, moonRy, 0, moonProgress);
      el.setAttribute("transform", `translate(${moonPoint.x.toFixed(2)} ${moonPoint.y.toFixed(2)})`);
      el.style.opacity = layerOpacity(el.dataset.moonLayer, moonProgress);
    });
  });
  sortOrbitPlanetLayer("behind-star");
  sortOrbitPlanetLayer("front-star");
}

function sortOrbitPlanetLayer(layer) {
  document.querySelectorAll(`[data-orbit-layer-container="${layer}"]`).forEach(container => {
    [...container.children]
      .sort((a, b) => parseFloat(a.dataset.depth || "0") - parseFloat(b.dataset.depth || "0"))
      .forEach(el => container.appendChild(el));
  });
}

function animateOrbitSystem() {
  updateOrbitSystemFrame();
  requestAnimationFrame(animateOrbitSystem);
}

function orbitSystemPlanetHTML(slot, orbit, layer) {
  const colorIdx = board.color[slot];
  const planetIdx = board.planet[slot];
  const atmosphereIdx = board.atmosphere[slot];
  const moonsIdx = board.moons[slot];
  const fill = colorIdx === null ? "#5f718d" : COLOR_HEX[COLORS[colorIdx]];
  const planetClass = planetIdx === null ? "unknown" : String(PLANETS[planetIdx]).toLowerCase();
  const atmosphereClass = atmosphereIdx === null ? "none" : String(ATMOSPHERES[atmosphereIdx]).toLowerCase();
  const moonCount = moonsIdx === null ? 0 : MOONS[moonsIdx];
  const moonOrbitRx = orbit.r + 5;
  const moonOrbitRy = Math.max(3.2, orbit.r * 0.42);
  const moonDuration = 2.8 + slot * 0.45;
  const planetProgress = orbitProgress(orbit.duration, orbit.phase);
  const planetPoint = ellipsePoint(orbit.rx, orbit.ry, orbit.angle, planetProgress);
  const planetOpacity = layerOpacity(layer, planetProgress);
  const moonLayerHTML = (moonLayer) => Array.from({ length: moonCount }, (_, i) => {
    const moonPhase = (i / moonCount) * moonDuration + slot * 0.35;
    const moonProgress = orbitProgress(moonDuration, moonPhase);
    const moonPoint = ellipsePoint(moonOrbitRx, moonOrbitRy, 0, moonProgress);
    const moonOpacity = layerOpacity(moonLayer, moonProgress);
    return `<g class="orbit-system-moon-orbit ${moonLayer}" data-moon-slot="${slot}" data-moon-index="${i}" data-moon-count="${moonCount}" data-moon-layer="${moonLayer}" transform="translate(${moonPoint.x.toFixed(2)} ${moonPoint.y.toFixed(2)})" style="opacity:${moonOpacity}">
      <circle class="orbit-system-moon" cx="0" cy="0" r="1.8" />
    </g>`;
  })
    .join("");
  const moonsBehindHTML = moonLayerHTML("behind");
  const moonsFrontHTML = moonLayerHTML("front");

  return `<g class="orbit-system-planet-group ${layer} planet-${planetClass} atmosphere-${atmosphereClass}" data-orbit-slot="${slot}" data-orbit-layer="${layer}" transform="translate(${(ORBIT_CENTER.x + planetPoint.x).toFixed(2)} ${(ORBIT_CENTER.y + planetPoint.y).toFixed(2)})" style="opacity:${planetOpacity}">
    <circle class="orbit-system-glow" cx="0" cy="0" r="${orbit.r + 5.8}" />
    ${moonsBehindHTML}
    <circle class="orbit-system-planet" cx="0" cy="0" r="${orbit.r}" fill="${fill}" />
    <path class="orbit-system-band" d="M${(-orbit.r * 0.9).toFixed(1)} 0 C${(-orbit.r * 0.35).toFixed(1)} ${(-orbit.r * 0.42).toFixed(1)} ${(orbit.r * 0.35).toFixed(1)} ${(-orbit.r * 0.42).toFixed(1)} ${(orbit.r * 0.9).toFixed(1)} 0" />
    ${moonsFrontHTML}
  </g>`;
}

function orbitSystemHTML(showLabels = !orbitAnimationStarted) {
  const ringsHTML = ORBIT_SYSTEM_ORBITS
    .map((orbit, i) => `<ellipse class="orbit-system-ring ring-${i + 1}" cx="300" cy="50" rx="${orbit.rx}" ry="${orbit.ry}" />`)
    .join("");
  const labelsHTML = showLabels ? ORBIT_SYSTEM_ORBITS
    .map((orbit, i) => `<text class="orbit-system-label" x="${ORBIT_CENTER.x + orbit.rx}" y="74">${i + 1}</text>`)
    .join("") : "";
  const planetsBehindHTML = ORBIT_SYSTEM_ORBITS
    .map((orbit, slot) => orbitSystemPlanetHTML(slot, orbit, "behind-star"))
    .join("");
  const planetsFrontHTML = ORBIT_SYSTEM_ORBITS
    .map((orbit, slot) => orbitSystemPlanetHTML(slot, orbit, "front-star"))
    .join("");

  return `<svg class="orbit-system" viewBox="0 0 600 100" aria-hidden="true">
    ${ringsHTML}
    <g class="orbit-system-planet-layer behind-star" data-orbit-layer-container="behind-star">${planetsBehindHTML}</g>
    <circle class="orbit-system-star-glow" cx="300" cy="50" r="18" />
    <circle class="orbit-system-star" cx="300" cy="50" r="8" />
    <g class="orbit-system-planet-layer front-star" data-orbit-layer-container="front-star">${planetsFrontHTML}</g>
    ${labelsHTML}
  </svg>`;
}

function tileIsPlaced(cat, vi) {
  return board[cat].includes(vi);
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const app = document.getElementById("app");
  if (!app) return;
  let h = `<div class="orbit-root">`;
  h += `<div class="orbit-top-buttons left">
    <button class="orbit-top-button${showHelp ? " active" : ""}" data-action="toggle-help" aria-label="${showHelp ? "Hide help" : "Show help"}">?</button>
  </div>
  <div class="orbit-top-buttons right">
    <button class="orbit-top-button${showInfo ? " active" : ""}" data-action="toggle-info" aria-label="${showInfo ? "Hide info" : "Show info"}">i</button>
  </div>`;
  h += `<div data-popup-shell>${popupShellHTML()}</div>`;

  // Header
  h += `<header class="orbit-header">
    <h1 class="orbit-title">Orbitle</h1>
  </header>`;

  if (loading) {
    h += `<div class="orbit-loading">Charting the system...</div>`;
  }

  if (!loading && puzzle) {
    h += `<div class="orbit-game-layout">`;
    h += `<div class="orbit-play-area">`;

    // Board
    h += `<div class="orbit-board">`;
    h += `<button class="orbit-clear-icon" data-action="clear" aria-label="Clear board">
      <svg class="orbit-clear-symbol" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 9a8 8 0 1 1 1.2 8.3" />
        <path d="M4.5 4.5V9h4.5" />
      </svg>
    </button>`;
    h += orbitSystemHTML();
    h += `<div class="orbit-columns">`;
    for (let slot = 0; slot < 4; slot++) {
      h += `<div class="orbit-column${selected.slot === slot ? " selected" : ""}" data-action="select-column" data-slot="${slot}" data-drop-column="true">`;
      h += `<div class="orbit-header-cell">Orbit ${slot + 1}</div>`;
      h += `<div class="orbit-column-values">`;
      CATEGORIES.forEach(cat => {
        const v = board[cat.key][slot];
        const cs = effectiveStrikes(cat.key, slot);
        h += `<div class="orbit-cell ${cat.key}${v === null ? " empty" : ""}" data-cat="${cat.key}" data-slot="${slot}">`;
        h += v !== null ? cellContentHTML(cat.key, v) : `·`;
        if (v !== null) {
          h += `<button class="orbit-cell-remove" data-action="remove-value" data-cat="${cat.key}" data-slot="${slot}" aria-label="Remove ${escHTML(cat.label)} from orbit ${slot + 1}">×</button>`;
        }
        if (cs.size > 0 && v === null) {
          h += `<div class="orbit-cell-strikes">${[...cs].map(vi => `<span>&#x2717;${escHTML(cat.short[vi])}</span>`).join("")}</div>`;
        }
        h += `</div>`;
      });
      h += `</div>`;
      h += `<div class="orbit-strike-drop${selected.slot === slot && selected.mode === "strike" ? " selected" : ""}${mutedStrikeHoverSlot === slot ? " hover-muted" : ""}" data-action="select-strike" data-strike-column="true" data-slot="${slot}">rule out</div>`;
      h += `</div>`;
    }
    h += `</div>`;

    h += `</div>`; // end board

    // Tile tray
    h += `<div class="orbit-picker">`;
    h += `<div class="orbit-tile-tray">`;
    CATEGORIES.forEach(cat => {
      h += `<div class="orbit-tile-row ${cat.key}"><div class="orbit-options">`;
      cat.values.forEach((_, vi) => {
        const canPick = selected.slot !== null;
        const placed = tileIsPlaced(cat.key, vi);
        h += `<button class="orbit-option${placed ? " placed" : ""}${canPick ? "" : " muted"}" data-action="pick-value" data-cat="${cat.key}" data-val="${vi}" draggable="false">${optionHTML(cat.key, vi)}</button>`;
      });
      h += `</div></div>`;
    });
    h += `</div>`;
    h += `</div>`; // end picker

    h += `</div>`; // end play area

    // Clues
    h += `<div class="orbit-clues"><div class="orbit-clues-header">Observations</div>`;
    puzzle.clues.forEach((c, i) => {
      h += `<div class="orbit-clue${crossedClues.has(i) ? " crossed" : ""}" data-action="toggle-clue" data-idx="${i}">${clueTextHTML(c.text)}</div>`;
    });
    h += `</div>`;

    h += `</div>`; // end game layout
  }

  // Won overlay
  if (status === "won") {
    h += `<div class="orbit-reveal">
      <div class="orbit-reveal-card">
        <div class="orbit-reveal-sub">System charted</div>
        <div class="orbit-reveal-system">${orbitSystemHTML(false)}</div>
        <div class="orbit-reveal-title">Solved</div>
        <div class="orbit-reveal-copy">
          ${escHTML(generateWinFlavorText())}
        </div>
        <div class="orbit-countdown-wrap">
          <div class="orbit-countdown-label">Next puzzle in</div>
          <div class="orbit-countdown" data-countdown>${countdownText()}</div>
        </div>
        ${resultShareButtonHTML("orbit-btn share full")}
        <div class="orbit-share-box">
          <button class="orbit-share-copy${resultCopied ? " copied" : ""}" data-action="copy-result" aria-label="${resultCopied ? "Copied" : "Copy result"}">⧉</button>
          <textarea class="orbit-share-preview" readonly rows="7">${escHTML(shareResultText())}</textarea>
        </div>
      </div>
    </div>`;
  }

  h += `</div>`; // end orbit-root
  app.innerHTML = h;
  updateOrbitSystemFrame();
}

// ============================================================
// CLICK DELEGATION
// ============================================================
function shouldSuppressClick(e) {
  if (!suppressNextClick) return false;
  const { x, y, until } = suppressNextClick;
  const closeToDrop = Math.hypot(e.clientX - x, e.clientY - y) < 12;
  suppressNextClick = null;
  return Date.now() < until && closeToDrop;
}

document.addEventListener("click", e => {
  if (shouldSuppressClick(e)) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  const strikeEl = e.target.closest("[data-strike-column='true']");
  if (strikeEl) {
    e.preventDefault();
    e.stopPropagation();
    handleStrikeSelect(parseInt(strikeEl.dataset.slot));
    return;
  }

  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "remove-value") e.stopPropagation();
  const action = el.dataset.action;

  switch (action) {
    case "toggle-help":
      if (showHelp) markTutorialSeen();
      showHelp = !showHelp;
      if (showHelp) {
        showInfo = false;
      }
      updateTopPopups();
      break;
    case "toggle-info":
      if (showHelp) markTutorialSeen();
      showInfo = !showInfo;
      if (showInfo) showHelp = false;
      if (!showInfo) shareCopied = false;
      updateTopPopups();
      break;
    case "start-help":
      markTutorialSeen();
      showHelp = false;
      updateTopPopups();
      break;
    case "close-popup":
      if (showHelp) markTutorialSeen();
      showHelp = false;
      showInfo = false;
      shareCopied = false;
      updateTopPopups();
      break;
    case "share-link":   handleShareLink(); break;
    case "share-result": handleShareResult(); break;
    case "copy-result":  handleCopyResult(); break;
    case "toggle-clue": {
      const idx = parseInt(el.dataset.idx);
      const n = new Set(crossedClues);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      crossedClues = n;
      render();
      break;
    }
    case "select-column": handleCellClick(parseInt(el.dataset.slot)); break;
    case "select-strike": handleStrikeSelect(parseInt(el.dataset.slot)); break;
    case "pick-value": handleValuePick(el.dataset.cat, parseInt(el.dataset.val)); break;
    case "remove-value": handleRemoveValue(el.dataset.cat, parseInt(el.dataset.slot)); break;
    case "clear":      handleClear(); break;
  }
});

document.addEventListener("pointerout", e => {
  const strike = e.target.closest?.("[data-strike-column='true']");
  if (!strike || strike.contains(e.relatedTarget)) return;
  const slot = parseInt(strike.dataset.slot);
  if (mutedStrikeHoverSlot !== slot) return;
  mutedStrikeHoverSlot = null;
  strike.classList.remove("hover-muted");
});

function clearDragHighlights() {
  document.querySelectorAll(".orbit-column.drag-over").forEach(el => el.classList.remove("drag-over"));
  document.querySelectorAll(".orbit-strike-drop.strike-over").forEach(el => el.classList.remove("strike-over"));
}

function clearStrikePreviews() {
  document.querySelectorAll(".orbit-cell.strike-preview").forEach(el => el.classList.remove("strike-preview"));
}

function showStrikePreviews(cat, valIdx) {
  for (let slot = 0; slot < 4; slot++) {
    if (board[cat][slot] !== null) continue;
    if (!effectiveStrikes(cat, slot).has(valIdx)) continue;
    document
      .querySelector(`.orbit-cell[data-cat='${cat}'][data-slot='${slot}']`)
      ?.classList.add("strike-preview");
  }
}

function dragTargetKey(target) {
  return target ? `${target.type}:${target.slot}` : "";
}

function getPointerDropTarget(x, y) {
  const target = document.elementFromPoint(x, y);
  const strike = target?.closest?.("[data-strike-column='true']");
  if (strike) return { type: "strike", slot: parseInt(strike.dataset.slot) };
  const column = target?.closest?.("[data-drop-column='true']");
  if (column) return { type: "column", slot: parseInt(column.dataset.slot) };
  return null;
}

function applyDragHighlight(target) {
  clearDragHighlights();
  if (!target) return;
  if (target.type === "strike") {
    document
      .querySelector(`.orbit-strike-drop[data-slot='${target.slot}']`)
      ?.classList.add("strike-over");
    return;
  }
  document
    .querySelector(`.orbit-column[data-slot='${target.slot}']`)
    ?.classList.add("drag-over");
}

function showDragGhost(x, y, html) {
  const ghost = document.getElementById("drag-ghost");
  if (!ghost) return;
  ghost.innerHTML = html;
  ghost.style.display = "flex";
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function moveDragGhost(x, y) {
  const ghost = document.getElementById("drag-ghost");
  if (!ghost) return;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function hideDragGhost() {
  const ghost = document.getElementById("drag-ghost");
  if (!ghost) return;
  ghost.style.display = "none";
  ghost.innerHTML = "";
}

function startPointerTileDrag(e, tile) {
  pointerDrag = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dragging: false,
    tileHTML: tile.innerHTML,
    targetKey: "",
    data: { cat: tile.dataset.cat, val: parseInt(tile.dataset.val) }
  };
  tile.setPointerCapture?.(e.pointerId);
}

function updatePointerDropTarget(x, y) {
  const target = getPointerDropTarget(x, y);
  const key = dragTargetKey(target);
  if (key === pointerDrag?.targetKey) return;
  pointerDrag.targetKey = key;
  applyDragHighlight(target);
}

function finishPointerTileDrag(x, y) {
  if (!pointerDrag?.dragging) return;
  const data = pointerDrag.data;
  const target = getPointerDropTarget(x, y);
  if (!target) return;
  if (target.type === "strike") {
    handleTileStrikeDrop(data.cat, target.slot, data.val);
    return;
  }
  handleTileDrop(data.cat, target.slot, data.val);
}

function cleanupPointerDrag() {
  pointerDrag = null;
  document.body?.classList.remove("dragging-tile");
  clearDragHighlights();
  clearStrikePreviews();
  hideDragGhost();
}

document.addEventListener("pointerdown", e => {
  const tile = e.target.closest("[data-action='pick-value']");
  if (!tile || status !== "playing") return;
  if (e.button !== undefined && e.button !== 0) return;
  startPointerTileDrag(e, tile);
});

document.addEventListener("pointermove", e => {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  const dx = e.clientX - pointerDrag.startX;
  const dy = e.clientY - pointerDrag.startY;
  if (!pointerDrag.dragging && Math.hypot(dx, dy) < 6) return;
  if (!pointerDrag.dragging) {
    pointerDrag.dragging = true;
    document.body?.classList.add("dragging-tile");
    showStrikePreviews(pointerDrag.data.cat, pointerDrag.data.val);
    showDragGhost(e.clientX, e.clientY, pointerDrag.tileHTML);
  } else {
    moveDragGhost(e.clientX, e.clientY);
  }
  updatePointerDropTarget(e.clientX, e.clientY);
  e.preventDefault();
});

document.addEventListener("pointerup", e => {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  if (pointerDrag.dragging) {
    finishPointerTileDrag(e.clientX, e.clientY);
    suppressNextClick = { x: e.clientX, y: e.clientY, until: Date.now() + 350 };
  }
  cleanupPointerDrag();
});

document.addEventListener("pointercancel", e => {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  cleanupPointerDrag();
});

// ============================================================
// STARFIELD
// ============================================================
function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let stars = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.5 + 0.2,
      twinkle: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2,
    }));
  };
  resize();
  window.addEventListener("resize", resize);
  let t = 0;
  const draw = () => {
    ctx.fillStyle = "#06080f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    t += 0.016;
    stars.forEach(s => {
      const alpha = s.a + Math.sin(t + s.phase) * s.twinkle * 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,230,245,${Math.max(0.05, alpha)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

// ============================================================
// INIT
// ============================================================
initStarfield();
showHelp = !hasSeenTutorial();
render();
animateOrbitSystem();
setInterval(tickDailyClock, 1000);
setTimeout(() => { loadDailyPuzzle(); loading = false; render(); }, 50);
