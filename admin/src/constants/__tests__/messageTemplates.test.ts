import { describe, it, expect } from "vitest";
import {
  MESSAGE_CONFIGS,
  messageConfig,
  placeholdersFor,
  fillMessageTemplate,
  type MessageKind,
  type MessageVars,
} from "../messageTemplates";

describe("MESSAGE_CONFIGS", () => {
  it("defines tracking, survey and receipt in order", () => {
    expect(MESSAGE_CONFIGS.map((c) => c.kind)).toEqual(["tracking", "survey", "receipt"]);
  });

  it("each config carries a settings key, link token and a default template that uses it", () => {
    for (const cfg of MESSAGE_CONFIGS) {
      expect(cfg.settingsKey).toMatch(/MessageTemplate$/);
      expect(cfg.linkToken).toMatch(/^\{\{\w+\}\}$/);
      expect(cfg.defaultTemplate).toContain(cfg.linkToken);
      expect(cfg.defaultTemplate).toContain("{{name}}");
      expect(cfg.defaultTemplate).toContain("{{brandName}}");
      expect(cfg.defaultTemplate).toContain("{{orderNumber}}");
      expect(cfg.defaultTemplate).toContain("{{website}}");
    }
  });
});

describe("messageConfig", () => {
  it("returns the matching config for each kind", () => {
    expect(messageConfig("tracking").linkToken).toBe("{{trackingLink}}");
    expect(messageConfig("survey").linkToken).toBe("{{surveyLink}}");
    expect(messageConfig("receipt").linkToken).toBe("{{receiptLink}}");
  });

  it("falls back to the first config for an unknown kind", () => {
    expect(messageConfig("bogus" as MessageKind)).toBe(MESSAGE_CONFIGS[0]);
  });
});

describe("placeholdersFor", () => {
  it("lists the shared tokens plus the kind's own link token", () => {
    const tokens = placeholdersFor(messageConfig("receipt")).map((p) => p.token);
    expect(tokens).toEqual([
      "{{name}}",
      "{{receiptLink}}",
      "{{orderNumber}}",
      "{{brandName}}",
      "{{website}}",
    ]);
    for (const p of placeholdersFor(messageConfig("tracking"))) {
      expect(p.desc.length).toBeGreaterThan(0);
    }
  });
});

describe("fillMessageTemplate", () => {
  const vars: MessageVars = {
    name: "Asha",
    link: "https://t.example/abc",
    orderNumber: "DDB-42",
    brandName: "Didi Bhaiya",
    website: "https://didibhaiyakibiryani.com",
  };

  it("replaces every token (including the link token) for each kind's default", () => {
    for (const cfg of MESSAGE_CONFIGS) {
      const out = fillMessageTemplate(cfg.defaultTemplate, cfg, vars);
      expect(out).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
      expect(out).toContain("Asha");
      expect(out).toContain("https://t.example/abc");
      expect(out).toContain("DDB-42");
    }
  });

  it("replaces all occurrences of a single token", () => {
    const cfg = messageConfig("survey");
    const out = fillMessageTemplate("{{name}} & {{name}} → {{surveyLink}}", cfg, vars);
    expect(out).toBe("Asha & Asha → https://t.example/abc");
  });

  it("leaves text without tokens untouched", () => {
    expect(fillMessageTemplate("plain text", messageConfig("tracking"), vars)).toBe("plain text");
  });
});
