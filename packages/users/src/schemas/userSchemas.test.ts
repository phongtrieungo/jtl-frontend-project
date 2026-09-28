import { describe, expect, it } from "vitest";
import { createUserSchema } from "./userSchemas";

describe("createUserSchema", () => {
  it("trims and accepts a valid user name", () => {
    expect(createUserSchema.parse({ username: "  Grace Hopper  " })).toEqual({
      username: "Grace Hopper",
    });
  });

  it.each([
    ["", "Name must be at least 3 characters."],
    ["Al", "Name must be at least 3 characters."],
    ["A".repeat(41), "Name must be 40 characters or fewer."],
  ])("rejects invalid input %#", (username, message) => {
    const result = createUserSchema.safeParse({ username });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(message);
    }
  });
});
