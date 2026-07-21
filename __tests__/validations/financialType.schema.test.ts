import { financialTypeSchema } from "@/lib/validations/financialType.schema";

const validData = {
  name: "Revenue",
  description: "Tracks all incoming revenue streams",
  category: "REVENUE" as const,
};

describe("financialTypeSchema", () => {
  it("accepts valid financial type data", () => {
    expect(financialTypeSchema.safeParse(validData).success).toBe(true);
  });

  describe("name", () => {
    it("rejects names shorter than 2 characters", () => {
      const result = financialTypeSchema.safeParse({ ...validData, name: "X" });
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 100 characters", () => {
      const result = financialTypeSchema.safeParse({ ...validData, name: "A".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("accepts a name at the minimum boundary (2 chars)", () => {
      const result = financialTypeSchema.safeParse({ ...validData, name: "Op" });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const { name: _, ...withoutName } = validData;
      const result = financialTypeSchema.safeParse(withoutName);
      expect(result.success).toBe(false);
    });
  });

  describe("description", () => {
    it("rejects descriptions shorter than 5 characters", () => {
      const result = financialTypeSchema.safeParse({ ...validData, description: "abc" });
      expect(result.success).toBe(false);
    });

    it("rejects descriptions longer than 500 characters", () => {
      const result = financialTypeSchema.safeParse({ ...validData, description: "A".repeat(501) });
      expect(result.success).toBe(false);
    });

    it("accepts a description at the minimum boundary (5 chars)", () => {
      const result = financialTypeSchema.safeParse({ ...validData, description: "Costs" });
      expect(result.success).toBe(true);
    });

    it("rejects missing description", () => {
      const { description: _, ...withoutDesc } = validData;
      const result = financialTypeSchema.safeParse(withoutDesc);
      expect(result.success).toBe(false);
    });
  });

  describe("category", () => {
    it("accepts COST", () => {
      const result = financialTypeSchema.safeParse({ ...validData, category: "COST" });
      expect(result.success).toBe(true);
    });

    it("rejects an unknown category value", () => {
      const result = financialTypeSchema.safeParse({ ...validData, category: "OTHER" });
      expect(result.success).toBe(false);
    });

    it("rejects missing category", () => {
      const { category: _, ...withoutCategory } = validData;
      const result = financialTypeSchema.safeParse(withoutCategory);
      expect(result.success).toBe(false);
    });
  });
});
