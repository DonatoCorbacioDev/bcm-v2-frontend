import { counterpartySchema } from "@/lib/validations/counterparty.schema";

const validData = {
  name: "Alfa Srl",
  type: "CUSTOMER" as const,
};

describe("counterpartySchema", () => {
  it("accepts valid minimal counterparty data", () => {
    expect(counterpartySchema.safeParse(validData).success).toBe(true);
  });

  it("accepts all optional fields filled in", () => {
    const result = counterpartySchema.safeParse({
      ...validData,
      vatNumber: "IT01234567890",
      taxCode: "ALFSRL80A01H501X",
      address: "Via Roma 1, Milano",
      contactName: "Mario Rossi",
      contactEmail: "mario.rossi@alfa.it",
      contactPhone: "+39 02 1234567",
      notes: "Cliente storico",
    });
    expect(result.success).toBe(true);
  });

  describe("name", () => {
    it("rejects names shorter than 2 characters", () => {
      expect(counterpartySchema.safeParse({ ...validData, name: "A" }).success).toBe(false);
    });

    it("rejects names longer than 255 characters", () => {
      expect(counterpartySchema.safeParse({ ...validData, name: "A".repeat(256) }).success).toBe(false);
    });

    it("rejects missing name", () => {
      const { name: _, ...withoutName } = validData;
      expect(counterpartySchema.safeParse(withoutName).success).toBe(false);
    });
  });

  describe("type", () => {
    it("accepts CUSTOMER, SUPPLIER and BOTH", () => {
      for (const type of ["CUSTOMER", "SUPPLIER", "BOTH"] as const) {
        expect(counterpartySchema.safeParse({ ...validData, type }).success).toBe(true);
      }
    });

    it("rejects an unknown type", () => {
      expect(counterpartySchema.safeParse({ ...validData, type: "PARTNER" }).success).toBe(false);
    });

    it("rejects a missing type", () => {
      const { type: _, ...withoutType } = validData;
      expect(counterpartySchema.safeParse(withoutType).success).toBe(false);
    });
  });

  describe("contactEmail", () => {
    it("rejects an invalid email", () => {
      expect(counterpartySchema.safeParse({ ...validData, contactEmail: "not-an-email" }).success).toBe(false);
    });

    it("accepts an empty string (optional field)", () => {
      expect(counterpartySchema.safeParse({ ...validData, contactEmail: "" }).success).toBe(true);
    });

    it("accepts a valid email", () => {
      expect(counterpartySchema.safeParse({ ...validData, contactEmail: "info@alfa.it" }).success).toBe(true);
    });
  });
});
