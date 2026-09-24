import { buildAppUrl } from "@/lib/emailLinks";

describe("email link builder", () => {
  it("builds an absolute verification URL from a domain", () => {
    expect(buildAppUrl("/verify-email", { token: "abc123" }, "https://app.example.com")).toBe(
      "https://app.example.com/verify-email?token=abc123"
    );
  });

  it("normalizes bare domains and encodes special characters", () => {
    expect(buildAppUrl("/verify-email", { token: "abc/123+xyz" }, "app.example.com")).toBe(
      "https://app.example.com/verify-email?token=abc%2F123%2Bxyz"
    );
  });

  it("handles Vercel-style base URLs without duplicating the protocol", () => {
    expect(buildAppUrl("/verify-email", { token: "abc123" }, "https://task-flow-liard-five.vercel.app")).toBe(
      "https://task-flow-liard-five.vercel.app/verify-email?token=abc123"
    );
  });
});
