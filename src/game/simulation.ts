import { CityPolicy, CityStats, TileData } from '../types/city';
import { BUILDING_DEFS, CITY_TIERS } from './buildingDefs';

export function calculateCityStats(
  grid: TileData[][],
  currentStats: CityStats,
  policies: CityPolicy[]
): CityStats {
  let pop = 0;
  let jobs = 0;
  let powerProd = 0;
  let powerCons = 0;
  let waterProd = 0;
  let waterCons = 0;
  let grossIncome = 0;
  let totalUpkeep = 0;
  let happinessBonusTotal = 0;

  for (let x = 0; x < grid.length; x++) {
    for (let z = 0; z < grid[0].length; z++) {
      const b = grid[x][z].building;
      if (!b) continue;
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;

      const lvl = b.level || 1;
      const lvlMultiplier = 1 + (lvl - 1) * 0.5;

      pop += Math.round(def.populationProvided * lvlMultiplier);
      jobs += Math.round(def.jobsProvided * lvlMultiplier);

      if (def.powerDelta > 0) {
        powerProd += Math.round(def.powerDelta * lvlMultiplier);
      } else {
        powerCons += Math.round(Math.abs(def.powerDelta) * lvlMultiplier);
      }

      if (def.waterDelta > 0) {
        waterProd += Math.round(def.waterDelta * lvlMultiplier);
      } else {
        waterCons += Math.round(Math.abs(def.waterDelta) * lvlMultiplier);
      }

      grossIncome += Math.round(def.income * lvlMultiplier);
      totalUpkeep += Math.round(def.upkeep * lvlMultiplier);
      happinessBonusTotal += def.happinessBonus;
    }
  }

  // Active policies effect
  let policyCosts = 0;
  let policyHappiness = 0;
  for (const pol of policies) {
    if (pol.active) {
      policyCosts += pol.costPerSec;
      policyHappiness += pol.happinessEffect;
    }
  }

  // Residential tax revenue
  const taxMultiplier = currentStats.taxRate / 0.09;
  const resTaxRevenue = Math.round(pop * 1.8 * taxMultiplier);

  // Net income per second
  const netIncome = Math.round(resTaxRevenue + grossIncome - totalUpkeep - policyCosts);

  // Happiness computation
  let happiness = 75 + policyHappiness + Math.min(20, Math.floor(happinessBonusTotal * 0.8));

  // Power shortage penalty
  if (powerCons > 0 && powerProd < powerCons) {
    const deficitRatio = (powerCons - powerProd) / powerCons;
    happiness -= Math.round(deficitRatio * 25);
  }

  // Water shortage penalty
  if (waterCons > 0 && waterProd < waterCons) {
    const deficitRatio = (waterCons - waterProd) / waterCons;
    happiness -= Math.round(deficitRatio * 25);
  }

  // High tax penalty
  if (currentStats.taxRate > 0.12) {
    happiness -= Math.round((currentStats.taxRate - 0.12) * 200);
  } else if (currentStats.taxRate < 0.07) {
    happiness += 5;
  }

  // Job balance
  if (pop > 0 && jobs < pop * 0.4) {
    happiness -= 10;
  }

  happiness = Math.max(5, Math.min(100, happiness));

  // Demand calculations (-1 to 1)
  let demandR = 0.2;
  let demandC = 0.1;
  let demandI = 0.1;

  if (jobs > pop * 1.2) demandR += 0.4;
  if (pop > jobs * 1.5) demandI += 0.4;
  if (pop > 30) demandC += 0.3;
  if (happiness < 40) {
    demandR -= 0.3;
    demandC -= 0.2;
  }

  demandR = Math.max(-1, Math.min(1, demandR));
  demandC = Math.max(-1, Math.min(1, demandC));
  demandI = Math.max(-1, Math.min(1, demandI));

  // Determine city tier
  let tier = 0;
  for (let i = CITY_TIERS.length - 1; i >= 0; i--) {
    if (pop >= CITY_TIERS[i].minPop) {
      tier = i;
      break;
    }
  }

  return {
    ...currentStats,
    population: pop,
    jobs,
    powerProduced: powerProd,
    powerConsumed: powerCons,
    waterProduced: waterProd,
    waterConsumed: waterCons,
    incomePerSec: netIncome,
    happiness,
    tier,
    demandR,
    demandC,
    demandI,
  };
}
