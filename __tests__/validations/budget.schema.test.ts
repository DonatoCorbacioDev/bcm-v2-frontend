import { budgetSchema } from "@/lib/validations/budget.schema";

const validData = {
  businessAreaId: 1,
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

    it("rejects a non-positive businessAreaId", () => {
      const result = budgetSchema.safeParse({ ...validData, businessAreaId: 0 });
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
    it("rejects a year before 2000", () => {
      const result = budgetSchema.safeParse({ ...validData, year: 1999 });
      expect(result.success).toBe(false);
    });

    it("rejects a year after 2100", () => {
      const result = budgetSchema.safeParse({ ...validData, year: 2101 });
      expect(result.success).toBe(false);
    });

    it("rejects a non-integer year", () => {
      const result = budgetSchema.safeParse({ ...validData, year: 2025.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("targetAmount", () => {
    it("rejects a non-positive targetAmount", () => {
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
