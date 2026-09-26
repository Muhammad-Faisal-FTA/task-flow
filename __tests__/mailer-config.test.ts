import { describe, expect, it } from "@jest/globals";
import { resolveMailerConfig } from "@/lib/mailer";

describe("mailer config", () => {
  it("returns null when required SMTP variables are missing", () => {
    expect(
      resolveMailerConfig({
        APP_URL: "http://localhost:3000",
      })
    ).toBeNull();
  });

  it("returns config when all required values are present", () => {
    const config = resolveMailerConfig({
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "465",
      SMTP_USER: "test@example.com",
      SMTP_PASS: "secretpass",
      SMTP_FROM: "noreply@example.com",
      APP_URL: "http://localhost:3000",
    });

    expect(config).toEqual(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        user: "test@example.com",
        pass: "secretpass",
        from: "noreply@example.com",
      })
    );
  });
});
