import { contractSchema } from "@/lib/validations/contract.schema";

const validContract = {
  counterpartyId: 1,
  contractNumber: "C001",
  wbsCode: "WBS-001",
  projectName: "Cloud Migration",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  status: "ACTIVE" as const,
  areaId: 1,
  managerId: 1,
};

describe("contractSchema", () => {
  it("accepts a valid contract", () => {
    const result = contractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
  });

  describe("counterpartyId", () => {
    it("rejects zero or negative IDs", () => {
      expect(
        contractSchema.safeParse({ ...validContract, counterpartyId: 0 }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({ ...validContract, counterpartyId: -1 }).success,
      ).toBe(false);
    });

    it("rejects non-integer IDs", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        counterpartyId: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a missing counterpartyId", () => {
      const { counterpartyId: _omit, ...withoutCounterparty } = validContract;
      const result = contractSchema.safeParse(withoutCounterparty);
      expect(result.success).toBe(false);
    });
  });

  describe("contractNumber", () => {
    it("accepts uppercase letters, numbers and hyphens", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        contractNumber: "ABC-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects lowercase letters", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        contractNumber: "c001",
      });
      expect(result.success).toBe(false);
    });

    it("rejects spaces", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        contractNumber: "C 001",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("dates", () => {
    it("rejects dates not in YYYY-MM-DD format", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        startDate: "01/01/2024",
      });
      expect(result.success).toBe(false);
    });

    it("rejects endDate before startDate", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        startDate: "2024-12-31",
        endDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("accepts endDate equal to startDate", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        startDate: "2024-06-01",
        endDate: "2024-06-01",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("status", () => {
    it("accepts ACTIVE, EXPIRED, CANCELLED", () => {
      for (const status of ["ACTIVE", "EXPIRED", "CANCELLED"] as const) {
        const result = contractSchema.safeParse({ ...validContract, status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects unknown status values", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        status: "PENDING",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("areaId / managerId", () => {
    it("rejects zero or negative IDs", () => {
      expect(
        contractSchema.safeParse({ ...validContract, areaId: 0 }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({ ...validContract, managerId: -1 }).success,
      ).toBe(false);
    });
  });
});
