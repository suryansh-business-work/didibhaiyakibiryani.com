import { describe, it, expect } from "vitest";
import {
  ratingShell,
  ratingFormHtml,
  ratingThanksHtml,
  ratingErrorHtml,
} from "../../src/routes/ratingPage";

describe("rating survey pages", () => {
  it("renders the branded shell with the brand color", () => {
    const html = ratingShell("Didi Bhaiya", "#e4b65c", "<p>x</p>");
    expect(html).toContain("Didi Bhaiya");
    expect(html).toContain("--gold: #e4b65c");
    expect(html).toContain('name="robots" content="noindex"');
  });

  it("renders both star groups and the comment box in the form", () => {
    const html = ratingFormHtml("DDB-1001");
    expect(html).toContain("DDB-1001");
    expect((html.match(/name="food"/g) ?? []).length).toBe(5);
    expect((html.match(/name="delivery"/g) ?? []).length).toBe(5);
    expect(html).toContain('name="comment"');
    expect(html).toContain('method="POST"');
  });

  it("renders thanks and error states", () => {
    expect(ratingThanksHtml()).toContain("Thank you");
    expect(ratingErrorHtml("Bad link")).toContain("Bad link");
  });
});
