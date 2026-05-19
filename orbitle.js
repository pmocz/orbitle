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

// ============================================================
// STATE
// ============================================================
let puzzle = null;
let loading = true;
let board = emptyBoard();
let strikes = emptyStrikes();
let selected = { cat: null, slot: null, mode: "place" };
let status = "playing"; // playing | won | done
let showHelp = false;
let crossedClues = new Set();
let pointerDrag = null;
let suppressNextClick = null;

// ============================================================
// HELPERS
// ============================================================
function emptyBoard() {
  return Object.fromEntries(CATEGORY_KEYS.map(key => [key, [null, null, null, null]]));
}

function emptyStrikes() {
  return Object.fromEntries(CATEGORY_KEYS.map(key => [key, [new Set(), new Set(), new Set(), new Set()]]));
}

function resetGameState() {
  board = emptyBoard();
  strikes = emptyStrikes();
  selected = { cat: null, slot: null, mode: "place" };
  status = "playing";
  crossedClues = new Set();
  pointerDrag = null;
  suppressNextClick = null;
  document.body?.classList.remove("dragging-tile");
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
    status = "won";
    render();
  }
}

// ============================================================
// CLICK HANDLERS
// ============================================================
function handleCellClick(slot) {
  if (status !== "playing") return;
  selected = { cat: null, slot, mode: "place" };
  render();
}

function handleStrikeSelect(slot) {
  if (status !== "playing") return;
  selected = { cat: null, slot, mode: "strike" };
  render();
}

function placeValue(cat, slot, valIdx) {
  const next = { ...board, [cat]: [...board[cat]] };
  if (next[cat][slot] === valIdx) {
    next[cat][slot] = null;
  } else {
    for (let i = 0; i < 4; i++) { if (next[cat][i] === valIdx) next[cat][i] = null; }
    next[cat][slot] = valIdx;
  }
  board = next;
  const ns = new Set(strikes[cat][slot]);
  ns.delete(valIdx);
  strikes = { ...strikes, [cat]: strikes[cat].map((s, i) => i === slot ? ns : s) };
  checkWin(board);
}

function toggleStrike(cat, slot, valIdx) {
  const ns = new Set(strikes[cat][slot]);
  ns.has(valIdx) ? ns.delete(valIdx) : ns.add(valIdx);
  strikes = { ...strikes, [cat]: strikes[cat].map((s, i) => i === slot ? ns : s) };
}

function handleValuePick(cat, valIdx) {
  if (status !== "playing") return;
  const slot = selected.slot;
  if (slot === null) return;

  if (selected.mode === "strike") {
    toggleStrike(cat, slot, valIdx);
    selected = { cat: null, slot, mode: "place" };
  } else {
    placeValue(cat, slot, valIdx);
  }
  render();
}

function handleTileDrop(cat, slot, valIdx) {
  if (status !== "playing") return;
  selected = { cat: null, slot, mode: "place" };
  placeValue(cat, slot, valIdx);
  render();
}

function handleTileStrikeDrop(cat, slot, valIdx) {
  if (status !== "playing") return;
  selected = { cat: null, slot, mode: "strike" };
  toggleStrike(cat, slot, valIdx);
  render();
}

function handleRemoveValue(cat, slot) {
  if (status !== "playing") return;
  board = { ...board, [cat]: board[cat].map((v, i) => i === slot ? null : v) };
  selected = { cat: null, slot, mode: "place" };
  render();
}

function handleClear() {
  resetGameState();
  render();
}

function handleNew() {
  loading = true;
  resetGameState();
  render();
  setTimeout(() => { puzzle = generatePuzzleWithRetry(); loading = false; render(); }, 50);
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
    new RegExp(`(^|[^A-Za-z0-9-])(${pattern})(?=[^A-Za-z0-9-]|$)`, "g"),
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

  // Header
  h += `<header class="orbit-header">
    <h1 class="orbit-title">Orbitle</h1>
    <div class="orbit-subtitle">A game of celestial deduction</div>
    <div class="orbit-divider"></div>
    <button class="orbit-help-link" data-action="toggle-help">${showHelp ? "Hide" : "How to play"}</button>
  </header>`;

  if (showHelp) {
    h += `<div class="orbit-help-content">
      Four planets orbit a star. Each orbit holds a unique planet <strong>color</strong>, <strong>type</strong>,
      <strong>atmosphere</strong>, and <strong>moon count</strong>. Use the clues to deduce which attributes
      belong to which orbit. Every puzzle has exactly one solution reachable by pure logic.
      Drag or click tiles to an 'orbit', or 'rule out' a combination.
      Tap a clue to cross it off once you've used it.
    </div>`;
  }

  if (loading) {
    h += `<div class="orbit-loading">Charting the system...</div>`;
  }

  if (!loading && puzzle) {
    h += `<div class="orbit-game-layout">`;
    h += `<div class="orbit-play-area">`;

    // Board
    h += `<div class="orbit-board">`;
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
      h += `<div class="orbit-strike-drop${selected.slot === slot && selected.mode === "strike" ? " selected" : ""}" data-action="select-strike" data-strike-column="true" data-slot="${slot}">rule out</div>`;
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

    // Actions
    h += `<div class="orbit-actions">
      <button class="orbit-btn secondary" data-action="clear">Clear</button>
      <button class="orbit-btn gold" data-action="new-puzzle">New Puzzle</button>
    </div>`;

    h += `</div>`; // end game layout
  }

  // Won overlay
  if (status === "won") {
    h += `<div class="orbit-reveal" data-action="dismiss-won">
      <div class="orbit-reveal-card">
        <div class="orbit-reveal-sub">System charted</div>
        <div class="orbit-reveal-title">Solved</div>
        <div class="orbit-reveal-copy">
          All observations reconciled. The star system stands revealed.
        </div>
        <button class="orbit-btn gold full" data-action="new-puzzle">Chart Another</button>
      </div>
    </div>`;
  }

  h += `</div>`; // end orbit-root
  app.innerHTML = h;
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

  if (status === "won") {
    if (!e.target.closest(".orbit-reveal-card")) { status = "done"; render(); return; }
  }

  const el = e.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "remove-value") e.stopPropagation();
  const action = el.dataset.action;

  switch (action) {
    case "toggle-help":  showHelp = !showHelp; render(); break;
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
    case "new-puzzle": handleNew(); break;
    case "dismiss-won":
      if (!e.target.closest(".orbit-reveal-card")) { status = "done"; render(); }
      break;
  }
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
render();
setTimeout(() => { puzzle = generatePuzzleWithRetry(); loading = false; render(); }, 50);
