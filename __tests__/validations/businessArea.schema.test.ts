import { businessAreaSchema } from "@/lib/validations/businessArea.schema";

const validData = {
  name: "Digital Services",
  description: "Handles all digital transformation projects",
};

describe("businessAreaSchema", () => {
  it("accepts valid business area data", () => {
    expect(businessAreaSchema.safeParse(validData).success).toBe(true);
  });

  describe("name", () => {
    it("rejects names shorter than 2 characters", () => {
      const result = businessAreaSchema.safeParse({ ...validData, name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 100 characters", () => {
      const result = businessAreaSchema.safeParse({ ...validData, name: "A".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("accepts a name exactly at the minimum boundary (2 chars)", () => {
      const result = businessAreaSchema.safeParse({ ...validData, name: "IT" });
      expect(result.success).toBe(true);
    });

    it("accepts a name exactly at the maximum boundary (100 chars)", () => {
      const result = businessAreaSchema.safeParse({ ...validData, name: "A".repeat(100) });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const { name: _, ...withoutName } = validData;
      const result = businessAreaSchema.safeParse(withoutName);
      expect(result.success).toBe(false);
    });
  });

  describe("description", () => {
    it("rejects descriptions shorter than 5 characters", () => {
      const result = businessAreaSchema.safeParse({ ...validData, description: "Hi" });
      expect(result.success).toBe(false);
    });

    it("rejects descriptions longer than 500 characters", () => {
      const result = businessAreaSchema.safeParse({ ...validData, description: "A".repeat(501) });
      expect(result.success).toBe(false);
    });

    it("accepts a description exactly at the minimum boundary (5 chars)", () => {
      const result = businessAreaSchema.safeParse({ ...validData, description: "Hello" });
      expect(result.success).toBe(true);
    });

    it("rejects missing description", () => {
      const { description: _, ...withoutDesc } = validData;
      const result = businessAreaSchema.safeParse(withoutDesc);
      expect(result.success).toBe(false);
    });
  });
});
