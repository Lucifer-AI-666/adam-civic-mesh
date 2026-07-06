import { describe, expect, it } from "vitest";

describe("Gemini API Key Validation", () => {
  it("should have GEMINI_API_KEY env variable set", () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should be able to reach Gemini API endpoint", async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY not set");
    }

    // Lightweight call to list models - validates the key works
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { method: "GET" }
    );

    // If key is valid, we get 200. If invalid, we get 400/403
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.models).toBeDefined();
    expect(data.models.length).toBeGreaterThan(0);
  });
});
