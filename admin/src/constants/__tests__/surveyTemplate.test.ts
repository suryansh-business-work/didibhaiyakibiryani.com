import { describe, it, expect } from "vitest";
import {
  SURVEY_PLACEHOLDERS,
  DEFAULT_SURVEY_TEMPLATE,
  fillSurveyTemplate,
  type SurveyVars,
} from "../surveyTemplate";

describe("SURVEY_PLACEHOLDERS", () => {
  it("lists every token the template understands with a description", () => {
    expect(SURVEY_PLACEHOLDERS).toHaveLength(5);
    const tokens = SURVEY_PLACEHOLDERS.map((p) => p.token);
    expect(tokens).toEqual([
      "{{name}}",
      "{{surveyLink}}",
      "{{orderNumber}}",
      "{{brandName}}",
      "{{website}}",
    ]);
    for (const p of SURVEY_PLACEHOLDERS) {
      expect(typeof p.desc).toBe("string");
      expect(p.desc.length).toBeGreaterThan(0);
    }
  });
});

describe("DEFAULT_SURVEY_TEMPLATE", () => {
  it("is a non-empty string that references the dynamic tokens", () => {
    expect(typeof DEFAULT_SURVEY_TEMPLATE).toBe("string");
    expect(DEFAULT_SURVEY_TEMPLATE).toContain("{{name}}");
    expect(DEFAULT_SURVEY_TEMPLATE).toContain("{{surveyLink}}");
    expect(DEFAULT_SURVEY_TEMPLATE).toContain("{{brandName}}");
    expect(DEFAULT_SURVEY_TEMPLATE).toContain("{{website}}");
    expect(DEFAULT_SURVEY_TEMPLATE).toContain("{{orderNumber}}");
  });
});

describe("fillSurveyTemplate", () => {
  const vars: SurveyVars = {
    name: "Asha",
    surveyLink: "https://s.example/abc",
    orderNumber: "DDB-42",
    brandName: "Didi Bhaiya",
    website: "https://didibhaiyakibiryani.com",
  };

  it("replaces every token (including repeated tokens) with its dynamic value", () => {
    const out = fillSurveyTemplate(DEFAULT_SURVEY_TEMPLATE, vars);
    // No raw tokens remain.
    expect(out).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
    expect(out).toContain("Asha");
    expect(out).toContain("https://s.example/abc");
    expect(out).toContain("DDB-42");
    expect(out).toContain("https://didibhaiyakibiryani.com");
    // brandName appears multiple times in the default template -> replaceAll.
    expect(out.match(/Didi Bhaiya/g)?.length).toBeGreaterThan(1);
  });

  it("replaces all occurrences of a single token", () => {
    const out = fillSurveyTemplate("{{name}} & {{name}} ate at {{brandName}}", vars);
    expect(out).toBe("Asha & Asha ate at Didi Bhaiya");
  });

  it("leaves text without tokens untouched", () => {
    expect(fillSurveyTemplate("plain text", vars)).toBe("plain text");
  });
});
