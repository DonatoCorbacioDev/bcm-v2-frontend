import { contractTemplateSchema, instantiateTemplateSchema } from "@/lib/validations/contractTemplate.schema";

const validTemplate = {
  name: "NDA Standard",
  autoRenew: false,
};

describe("contractTemplateSchema", () => {
  it("accepts minimal valid data (name + autoRenew)", () => {
    expect(contractTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  it("accepts full valid data with all optional fields", () => {
    const result = contractTemplateSchema.safeParse({
      ...validTemplate,
      description: "Descrizione del template",
      defaultStatus: "ACTIVE",
      defaultDurationDays: 365,
      businessAreaId: 1,
      defaultManagerId: 2,
      notificationDays: 30,
    });
    expect(result.success).toBe(true);
  });

  describe("name", () => {
    it("rejects names shorter than 2 characters", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, name: "A" }).success).toBe(false);
    });

    it("rejects names longer than 255 characters", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, name: "A".repeat(256) }).success).toBe(false);
    });

    it("accepts name at minimum boundary (2 chars)", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, name: "AB" }).success).toBe(true);
    });

    it("rejects missing name", () => {
      const { name: _, ...withoutName } = validTemplate;
      expect(contractTemplateSchema.safeParse(withoutName).success).toBe(false);
    });
  });

  describe("autoRenew", () => {
    it("rejects missing autoRenew", () => {
      const { autoRenew: _, ...withoutAutoRenew } = validTemplate;
      expect(contractTemplateSchema.safeParse(withoutAutoRenew).success).toBe(false);
    });

    it("accepts autoRenew true", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, autoRenew: true }).success).toBe(true);
    });
  });

  describe("defaultStatus", () => {
    it("rejects invalid status value", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, defaultStatus: "INVALID" }).success).toBe(false);
    });

    it("accepts null defaultStatus", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, defaultStatus: null }).success).toBe(true);
    });
  });

  describe("defaultDurationDays", () => {
    it("rejects non-positive duration", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, defaultDurationDays: 0 }).success).toBe(false);
    });

    it("accepts null duration", () => {
      expect(contractTemplateSchema.safeParse({ ...validTemplate, defaultDurationDays: null }).success).toBe(true);
    });
  });
});

const validInstantiate = {
  customerName: "Acme Corp",
  contractNumber: "CTR-2024-001",
  startDate: "2024-01-01",
};

describe("instantiateTemplateSchema", () => {
  it("accepts minimal valid data", () => {
    expect(instantiateTemplateSchema.safeParse(validInstantiate).success).toBe(true);
  });

  describe("contractNumber", () => {
    it("rejects numbers with lowercase letters", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, contractNumber: "ctr-001" }).success).toBe(false);
    });

    it("accepts uppercase letters, digits and hyphens", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, contractNumber: "ABC-123" }).success).toBe(true);
    });
  });

  describe("startDate", () => {
    it("rejects malformed date", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, startDate: "01/01/2024" }).success).toBe(false);
    });

    it("accepts YYYY-MM-DD format", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, startDate: "2024-06-15" }).success).toBe(true);
    });
  });

  describe("endDate", () => {
    it("accepts an empty endDate", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, endDate: "" }).success).toBe(true);
    });

    it("accepts a valid YYYY-MM-DD endDate", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, endDate: "2024-12-31" }).success).toBe(true);
    });

    it("rejects a malformed endDate", () => {
      expect(instantiateTemplateSchema.safeParse({ ...validInstantiate, endDate: "31/12/2024" }).success).toBe(false);
    });
  });
});
