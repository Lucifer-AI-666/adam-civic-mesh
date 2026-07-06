import { describe, expect, it } from "vitest";

describe("Gemini TTS - generateSpeech", () => {
  it("should call Gemini TTS API and return base64 audio data", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Skipping TTS test: GEMINI_API_KEY not set");
      return;
    }

    const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    const ttsPrompt = `Leggi in italiano con voce naturale, calma e professionale: "Ciao, sono ADAM, l'assistente civico di Acqui Terme."`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ttsPrompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Orus",
                },
              },
            },
          },
        }),
      }
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    // Verify audio data exists
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    expect(audioData).toBeDefined();
    expect(typeof audioData).toBe("string");
    expect(audioData.length).toBeGreaterThan(100); // Base64 audio should be substantial
    
    // Verify it's valid base64
    const decoded = Buffer.from(audioData, "base64");
    expect(decoded.length).toBeGreaterThan(0);
    
    console.log(`[TTS Test] Generated ${decoded.length} bytes of PCM audio`);
  }, 30000); // 30s timeout for API call
});
