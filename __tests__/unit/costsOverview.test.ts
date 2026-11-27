import { buildCostsOverview, costsCsv } from "@/lib/costsOverview";
import type { Budget, FinancialValue } from "@/types";

const value = (month: number, amount: number, extra: Partial<FinancialValue> = {}): FinancialValue => ({
  id: `v${month}-${amount}`, month, year: 2026, financialAmount: amount, financialTypeId: "t", businessAreaId: "a",
  contractId: "c1", category: "COST", areaName: "IT", customerName: "Ferri", ...extra,
});
const budget = (target: number): Budget => ({
  id: "b", businessAreaId: "a", areaName: "IT", category: "COST", year: 2026, targetAmount: target, actualAmount: 0, percentUsed: 0,
});
// 30 June 2026: half a year gone by, six months lived.
const june30 = new Date(2026, 5, 30, 23, 59);

describe("buildCostsOverview", () => {
  const values = Array.from({ length: 12 }, (_, i) => value(i + 1, 1000));

  it("adds up the months lived, and the whole year as the forecast", () => {
    const o = buildCostsOverview(values, [budget(12000)], 2026, "COST", june30);
    expect(o.toDate).toBe(6000);
    expect(o.yearForecast).toBe(12000);
    expect(o.budget).toBe(12000);
    // About half the budget: the share of the year gone by on 30 June.
    expect(o.paceToday).toBeGreaterThan(5900);
    expect(o.paceToday).toBeLessThan(6000);
  });

  it("draws the actual line up to today and the forecast from today on, joined", () => {
    const o = buildCostsOverview(values, [budget(12000)], 2026, "COST", june30);
    expect(o.months[5]).toMatchObject({ actual: 6000, forecast: 6000, pace: 6000 });
    expect(o.months[6]).toMatchObject({ actual: null, forecast: 7000 });
    expect(o.months[0].forecast).toBeNull();
  });

  it("keeps costs and revenues apart, and lists the costliest contracts first", () => {
    const mixed = [...values, value(1, 99999, { category: "REVENUE" }), value(2, 5000, { contractId: "c2", customerName: "Rossi" })];
    const o = buildCostsOverview(mixed, [], 2026, "COST", june30);
    expect(o.yearForecast).toBe(17000);
    expect(o.topContracts.map((c) => c.name)).toEqual(["Ferri", "Rossi"]);
    expect(o.budget).toBe(0);
    expect(o.months[0].pace).toBeNull();
  });
});

describe("costsCsv", () => {
  it("writes an Italian CSV: semicolons and decimal commas", () => {
    const csv = costsCsv([value(3, 1234.5)], 2026, "COST");
    expect(csv.split("\r\n")[1]).toBe('03/2026;"Ferri";"IT";"";1234,50');
  });
});
