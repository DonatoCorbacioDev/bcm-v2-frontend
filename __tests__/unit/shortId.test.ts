import { shortId } from "@/lib/shortId";

describe("shortId", () => {
  it("keeps the first 8 hex digits of a UUID", () => {
    expect(shortId("0d4704b8-2b40-4101-8cea-b897d01dedf7")).toBe("0d4704b8");
  });

  it("leaves a shorter value as it is", () => {
    expect(shortId("abc")).toBe("abc");
  });
});
