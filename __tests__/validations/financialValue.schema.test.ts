import { financialValueSchema } from "@/lib/validations/financialValue.schema";

const validData = {
  month: 6,
  year: 2025,
  financialAmount: 15000.5,
  financialTypeId: 1,
  businessAreaId: 2,
  contractId: 3,
};

describe("financialValueSchema", () => {
  it("accepts valid financial value data", () => {
    expect(financialValueSchema.safeParse(validData).success).toBe(true);
  });

  describe("month", () => {
    it.each([
      ["below minimum", 0],
      ["above maximum", 13],
      ["non-integer", 6.5],
    ])("rejects invalid month (%s: %p)", (_label, month) => {
      const result = financialValueSchema.safeParse({ ...validData, month });
      expect(result.success).toBe(false);
    });

    it("accepts boundary months 1 and 12", () => {
      expect(financialValueSchema.safeParse({ ...validData, month: 1 }).success).toBe(true);
      expect(financialValueSchema.safeParse({ ...validData, month: 12 }).success).toBe(true);
    });
  });

  describe("year", () => {
    it.each([
      ["before 2000", 1999],
      ["after 2100", 2101],
      ["non-integer", 2025.5],
    ])("rejects invalid year (%s: %p)", (_label, year) => {
      const result = financialValueSchema.safeParse({ ...validData, year });
      expect(result.success).toBe(false);
    });

    it("accepts boundary years 2000 and 2100", () => {
      expect(financialValueSchema.safeParse({ ...validData, year: 2000 }).success).toBe(true);
      expect(financialValueSchema.safeParse({ ...validData, year: 2100 }).success).toBe(true);
    });
  });

  describe("financialAmount", () => {
    it("rejects zero amount", () => {
      const result = financialValueSchema.safeParse({ ...validData, financialAmount: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = financialValueSchema.safeParse({ ...validData, financialAmount: -100 });
      expect(result.success).toBe(false);
    });

    it("accepts decimal amounts", () => {
      const result = financialValueSchema.safeParse({ ...validData, financialAmount: 0.01 });
      expect(result.success).toBe(true);
    });
  });

  describe("financialTypeId / businessAreaId / contractId", () => {
    it("rejects non-positive financialTypeId", () => {
      expect(financialValueSchema.safeParse({ ...validData, financialTypeId: 0 }).success).toBe(false);
      expect(financialValueSchema.safeParse({ ...validData, financialTypeId: -1 }).success).toBe(false);
    });

    it("rejects non-positive businessAreaId", () => {
      expect(financialValueSchema.safeParse({ ...validData, businessAreaId: 0 }).success).toBe(false);
    });

    it("rejects non-positive contractId", () => {
      expect(financialValueSchema.safeParse({ ...validData, contractId: 0 }).success).toBe(false);
    });

    it("rejects non-integer IDs", () => {
      expect(financialValueSchema.safeParse({ ...validData, financialTypeId: 1.5 }).success).toBe(false);
      expect(financialValueSchema.safeParse({ ...validData, businessAreaId: 2.3 }).success).toBe(false);
      expect(financialValueSchema.safeParse({ ...validData, contractId: 3.7 }).success).toBe(false);
    });
  });
});
