import { managerSchema } from "@/lib/validations/manager.schema";

const validData = {
  firstName: "Marco",
  lastName: "Rossi",
  email: "marco.rossi@example.com",
  phoneNumber: "+39 02 1234567",
  department: "Engineering",
};

describe("managerSchema", () => {
  it("accepts valid manager data", () => {
    expect(managerSchema.safeParse(validData).success).toBe(true);
  });

  describe("firstName", () => {
    it("rejects first names shorter than 2 characters", () => {
      const result = managerSchema.safeParse({ ...validData, firstName: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects first names longer than 50 characters", () => {
      const result = managerSchema.safeParse({ ...validData, firstName: "A".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects missing first name", () => {
      const { firstName: _, ...rest } = validData;
      expect(managerSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("lastName", () => {
    it("rejects last names shorter than 2 characters", () => {
      const result = managerSchema.safeParse({ ...validData, lastName: "B" });
      expect(result.success).toBe(false);
    });

    it("rejects last names longer than 50 characters", () => {
      const result = managerSchema.safeParse({ ...validData, lastName: "B".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects missing last name", () => {
      const { lastName: _, ...rest } = validData;
      expect(managerSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("email", () => {
    it("rejects emails without @ symbol", () => {
      const result = managerSchema.safeParse({ ...validData, email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("rejects emails without domain extension", () => {
      const result = managerSchema.safeParse({ ...validData, email: "user@nodomain" });
      expect(result.success).toBe(false);
    });

    it("rejects emails longer than 100 characters", () => {
      const long = `${"a".repeat(90)}@example.com`;
      const result = managerSchema.safeParse({ ...validData, email: long });
      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const { email: _, ...rest } = validData;
      expect(managerSchema.safeParse(rest).success).toBe(false);
    });
  });

  describe("phoneNumber", () => {
    it("rejects phone numbers shorter than 7 characters", () => {
      const result = managerSchema.safeParse({ ...validData, phoneNumber: "123" });
      expect(result.success).toBe(false);
    });

    it("rejects phone numbers with invalid characters", () => {
      const result = managerSchema.safeParse({ ...validData, phoneNumber: "abc-defg" });
      expect(result.success).toBe(false);
    });

    it("accepts phone numbers with +, spaces, dashes and parentheses", () => {
      const result = managerSchema.safeParse({ ...validData, phoneNumber: "+1 (800) 555-1234" });
      expect(result.success).toBe(true);
    });

    it("rejects phone numbers longer than 20 characters", () => {
      const result = managerSchema.safeParse({ ...validData, phoneNumber: "1".repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe("department", () => {
    it("rejects department names shorter than 2 characters", () => {
      const result = managerSchema.safeParse({ ...validData, department: "X" });
      expect(result.success).toBe(false);
    });

    it("rejects department names longer than 100 characters", () => {
      const result = managerSchema.safeParse({ ...validData, department: "D".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("rejects missing department", () => {
      const { department: _, ...rest } = validData;
      expect(managerSchema.safeParse(rest).success).toBe(false);
    });
  });
});
