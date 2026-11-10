import {
  PASSWORD_TOO_LONG,
  PASSWORD_TOO_SHORT,
  passwordSchema,
  passwordViolation,
  utf8ByteLength,
} from "@/lib/validations/password";
import { userCreateSchema, userUpdateSchema } from "@/lib/validations/user.schema";
import { uid } from "../mocks/ids";

describe("password rule (same as the backend's PasswordPolicy)", () => {
  it("accepts 8 characters and refuses 7", () => {
    expect(passwordViolation("abcdefg")).toBe(PASSWORD_TOO_SHORT);
    expect(passwordViolation("abcdefgh")).toBeNull();
  });

  it("accepts 72 bytes and refuses 73: past that BCrypt won't hash it", () => {
    expect(passwordViolation("x".repeat(72))).toBeNull();
    expect(passwordViolation("x".repeat(73))).toBe(PASSWORD_TOO_LONG);
  });

  it("counts UTF-8 bytes: accented letters 2, the euro sign 3, emoji 4", () => {
    expect(utf8ByteLength("è")).toBe(2);
    expect(utf8ByteLength("€")).toBe(3);
    expect(utf8ByteLength("😀")).toBe(4);
    expect(passwordViolation("è".repeat(37))).toBe(PASSWORD_TOO_LONG);
    expect(passwordViolation("è".repeat(36))).toBeNull();
  });

  it("counts characters for the minimum: 8 emoji are enough, 7 are not", () => {
    expect(passwordViolation("😀".repeat(8))).toBeNull();
    expect(passwordViolation("😀".repeat(7))).toBe(PASSWORD_TOO_SHORT);
  });

  it("passwordSchema reports the broken rule, and its own message when missing", () => {
    expect(passwordSchema().safeParse("short").error?.issues[0].message).toBe(PASSWORD_TOO_SHORT);
    expect(passwordSchema("Serve una password").safeParse(undefined).error?.issues[0].message).toBe(
      "Serve una password"
    );
    expect(passwordSchema().safeParse("long-enough").success).toBe(true);
  });

  it("the user forms use it: creation requires it, an update may leave it empty", () => {
    const base = { username: "mario_rossi", managerId: uid(1), roleId: uid(2), verified: true, canApproveContracts: false };
    expect(userCreateSchema.safeParse({ ...base, password: "x".repeat(100) }).error?.issues[0].message).toBe(
      PASSWORD_TOO_LONG
    );
    expect(userUpdateSchema.safeParse({ ...base, password: "" }).success).toBe(true);
    expect(userUpdateSchema.safeParse({ ...base, password: "short" }).error?.issues[0].message).toBe(
      PASSWORD_TOO_SHORT
    );
  });
});
