import { userCreateSchema, userUpdateSchema } from "@/lib/validations/user.schema";
import { uid } from "../mocks/ids";

const validCreateData = {
  username: "john_doe",
  password: "securePass1",
  managerId: uid(1),
  roleId: uid(2),
  verified: false,
  canApproveContracts: false,
};

describe("userCreateSchema", () => {
  it("accepts valid user data", () => {
    expect(userCreateSchema.safeParse(validCreateData).success).toBe(true);
  });

  describe("username", () => {
    it("rejects usernames shorter than 3 characters", () => {
      const result = userCreateSchema.safeParse({ ...validCreateData, username: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects usernames with spaces or special characters", () => {
      const result = userCreateSchema.safeParse({ ...validCreateData, username: "john doe" });
      expect(result.success).toBe(false);
    });

    it("accepts underscores and hyphens", () => {
      const result = userCreateSchema.safeParse({ ...validCreateData, username: "john-doe_99" });
      expect(result.success).toBe(true);
    });
  });

  describe("password", () => {
    it("rejects passwords shorter than 8 characters", () => {
      const result = userCreateSchema.safeParse({ ...validCreateData, password: "short" });
      expect(result.success).toBe(false);
    });

    it("requires password for creation", () => {
      const { password: _, ...withoutPassword } = validCreateData;
      const result = userCreateSchema.safeParse(withoutPassword);
      expect(result.success).toBe(false);
    });
  });

  describe("managerId / roleId", () => {
    it("rejects an empty or malformed id", () => {
      expect(userCreateSchema.safeParse({ ...validCreateData, managerId: "" }).success).toBe(false);
      expect(userCreateSchema.safeParse({ ...validCreateData, roleId: "not-a-uuid" }).success).toBe(false);
    });
  });
});

describe("userUpdateSchema", () => {
  const validUpdateData = {
    username: "john_doe",
    managerId: uid(1),
    roleId: uid(2),
    verified: true,
    canApproveContracts: false,
  };

  it("accepts data without password (password is optional on update)", () => {
    expect(userUpdateSchema.safeParse(validUpdateData).success).toBe(true);
  });

  it("accepts an empty string as password (means: do not change)", () => {
    const result = userUpdateSchema.safeParse({ ...validUpdateData, password: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-empty password shorter than 8 characters", () => {
    const result = userUpdateSchema.safeParse({ ...validUpdateData, password: "short" });
    expect(result.success).toBe(false);
  });
});
