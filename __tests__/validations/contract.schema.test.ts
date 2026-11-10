import { contractSchema } from "@/lib/validations/contract.schema";
import { uid } from "../mocks/ids";

const validContract = {
  counterpartyId: uid(1),
  contractNumber: "C001",
  wbsCode: "WBS-001",
  projectName: "Cloud Migration",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  status: "ACTIVE" as const,
  areaId: uid(1),
  managerId: uid(1),
};

describe("contractSchema", () => {
  it("accepts a valid contract", () => {
    const result = contractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
  });

  describe("counterpartyId", () => {
    it("rejects an empty or malformed id", () => {
      expect(
        contractSchema.safeParse({ ...validContract, counterpartyId: "" }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({ ...validContract, counterpartyId: "not-a-uuid" }).success,
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
    it("rejects an empty or malformed id", () => {
      expect(
        contractSchema.safeParse({ ...validContract, areaId: "" }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({ ...validContract, managerId: "not-a-uuid" }).success,
      ).toBe(false);
    });
  });

  describe("financial terms (financialTypeId / annualValue / billingFrequency)", () => {
    it("accepts a contract with none of the three set", () => {
      const result = contractSchema.safeParse(validContract);
      expect(result.success).toBe(true);
    });

    it("accepts a contract with all three set", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        financialTypeId: uid(1),
        annualValue: 36000,
        billingFrequency: "MONTHLY",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a contract with only some of the three set", () => {
      expect(
        contractSchema.safeParse({ ...validContract, financialTypeId: uid(1) }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({ ...validContract, annualValue: 36000 }).success,
      ).toBe(false);
      expect(
        contractSchema.safeParse({
          ...validContract,
          financialTypeId: uid(1),
          annualValue: 36000,
        }).success,
      ).toBe(false);
    });

    it("rejects a negative or zero annualValue", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        financialTypeId: uid(1),
        annualValue: 0,
        billingFrequency: "MONTHLY",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an unknown billingFrequency", () => {
      const result = contractSchema.safeParse({
        ...validContract,
        financialTypeId: uid(1),
        annualValue: 36000,
        billingFrequency: "WEEKLY",
      });
      expect(result.success).toBe(false);
    });
  });
  describe("optional fields (WBS, oggetto)", () => {
    it("accepts a contract without WBS code or oggetto", () => {
      const { wbsCode: _w, projectName: _p, ...minimal } = validContract;
      expect(contractSchema.safeParse(minimal).success).toBe(true);
      expect(contractSchema.safeParse({ ...validContract, wbsCode: "", projectName: "" }).success).toBe(true);
    });

    it("rejects an oggetto of one or two letters", () => {
      const result = contractSchema.safeParse({ ...validContract, projectName: "a" });
      expect(result.success).toBe(false);
    });
  });

  // Specification for the rule Donato writes in contract.schema.ts (TODO there).
  describe("notice deadline", () => {
    const renewing = {
      ...validContract,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      autoRenew: true,
      renewalMonths: 12,
    };
    const noticeError = (input: object) => {
      const result = contractSchema.safeParse(input);
      return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === "noticeDays");
    };

    it("accepts a notice that ends inside the contract", () => {
      expect(noticeError({ ...renewing, noticeDays: 90 })).toBeUndefined();
    });

    it("accepts a deadline falling exactly on the start date", () => {
      // 2026-12-31 minus 364 days is 2026-01-01
      expect(noticeError({ ...renewing, noticeDays: 364 })).toBeUndefined();
    });

    it("rejects a notice longer than the contract", () => {
      expect(noticeError({ ...renewing, noticeDays: 400 })?.message).toBe(
        "Il preavviso è più lungo del contratto: la disdetta cadrebbe prima della data di inizio",
      );
    });

    it("ignores the notice when the contract doesn't renew tacitly", () => {
      expect(noticeError({ ...renewing, autoRenew: false, noticeDays: 400 })).toBeUndefined();
    });

    it("doesn't reject a deadline that has already passed: that is a warning, not an error", () => {
      expect(noticeError({ ...renewing, startDate: "2020-01-01", endDate: "2021-01-01", noticeDays: 30 }))
        .toBeUndefined();
    });
  });
});

describe("contractSchema — notice longer than the contract", () => {
  it("leaves an unreadable date to the date field's own error instead of guessing", () => {
    const result = contractSchema.safeParse({
      ...validContract, startDate: "non-una-data", autoRenew: true, noticeDays: 30, renewalMonths: 12,
    });
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).not.toContain(
      "Il preavviso è più lungo del contratto: la disdetta cadrebbe prima della data di inizio");
  });
});
