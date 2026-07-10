import { organizationBankDetailsSchema } from "@/lib/validations/organization.schema";

const validData = {
  iban: "IT60X0542811101000000123456",
  bic: "BCITITMM",
};

describe("organizationBankDetailsSchema", () => {
  it("accepts valid IBAN and BIC", () => {
    expect(organizationBankDetailsSchema.safeParse(validData).success).toBe(true);
  });

  describe("iban", () => {
    it("accepts an empty IBAN (optional field)", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, iban: "" });
      expect(result.success).toBe(true);
    });

    it("strips spaces and uppercases a lowercase IBAN before validating", () => {
      const result = organizationBankDetailsSchema.safeParse({
        ...validData,
        iban: "it 60 x054 2811 1010 0000 0123 456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iban).toBe("IT60X0542811101000000123456");
      }
    });

    it("rejects an IBAN with an invalid format", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, iban: "not-an-iban" });
      expect(result.success).toBe(false);
    });

    it("rejects an IBAN with too few characters after the country/check digits", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, iban: "IT60X0" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing IBAN field", () => {
      const { iban: _, ...rest } = validData;
      expect(organizationBankDetailsSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("bic", () => {
    it.each([
      ["empty BIC (optional field)", ""],
      ["8-character BIC", "BCITITMM"],
      ["11-character BIC", "BCITITMMXXX"],
    ])("accepts an %s", (_description, bic) => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, bic });
      expect(result.success).toBe(true);
    });

    it("strips spaces and uppercases a lowercase BIC before validating", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, bic: "bcit it mm" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bic).toBe("BCITITMM");
      }
    });

    it("rejects a BIC shorter than 8 characters", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, bic: "BCIT" });
      expect(result.success).toBe(false);
    });

    it("rejects a BIC longer than 11 characters", () => {
      const result = organizationBankDetailsSchema.safeParse({ ...validData, bic: "BCITITMMXXXX" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing BIC field", () => {
      const { bic: _, ...rest } = validData;
      expect(organizationBankDetailsSchema.safeParse(rest).success).toBe(false);
    });
  });
});
