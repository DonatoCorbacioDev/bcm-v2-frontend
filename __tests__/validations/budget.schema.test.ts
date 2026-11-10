import { budgetSchema } from "@/lib/validations/budget.schema";
import { uid } from "../mocks/ids";

const validData = {
  businessAreaId: uid(1),
  category: "COST" as const,
  year: 2025,
  targetAmount: 50000,
};

describe("budgetSchema", () => {
  it("accepts valid budget data", () => {
    expect(budgetSchema.safeParse(validData).success).toBe(true);
  });

  describe("businessAreaId", () => {
    it("rejects missing businessAreaId", () => {
      const { businessAreaId: _, ...withoutArea } = validData;
      const result = budgetSchema.safeParse(withoutArea);
      expect(result.success).toBe(false);
    });

    it("rejects an empty or malformed businessAreaId", () => {
      const result = budgetSchema.safeParse({ ...validData, businessAreaId: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("category", () => {
    it("accepts REVENUE", () => {
      const result = budgetSchema.safeParse({ ...validData, category: "REVENUE" });
      expect(result.success).toBe(true);
    });

    it("rejects an unknown category value", () => {
      const result = budgetSchema.safeParse({ ...validData, category: "OTHER" });
      expect(result.success).toBe(false);
    });

    it("rejects missing category", () => {
      const { category: _, ...withoutCategory } = validData;
      const result = budgetSchema.safeParse(withoutCategory);
      expect(result.success).toBe(false);
    });
  });

  describe("year", () => {
    it.each([
      ["before 2000", 1999],
      ["after 2100", 2101],
      ["non-integer", 2025.5],
    ])("rejects invalid year (%s: %p)", (_label, year) => {
      const result = budgetSchema.safeParse({ ...validData, year });
      expect(result.success).toBe(false);
    });
  });

  describe("targetAmount", () => {
    it("rejects an empty or malformed targetAmount", () => {
      const result = budgetSchema.safeParse({ ...validData, targetAmount: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects missing targetAmount", () => {
      const { targetAmount: _, ...withoutTarget } = validData;
      const result = budgetSchema.safeParse(withoutTarget);
      expect(result.success).toBe(false);
    });
  });
});
