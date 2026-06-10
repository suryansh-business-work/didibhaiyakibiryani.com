import { describe, it, expect } from "vitest";
import { cleanSettingsInput } from "../../src/graphql/resolvers/settings";

describe("cleanSettingsInput", () => {
  it("keeps provided string fields and trims them", () => {
    const update = cleanSettingsInput({
      brandName: "  Didi Bhaiya ki Biryani  ",
      primaryColor: "#e4b65c",
    });
    expect(update).toEqual({
      brandName: "Didi Bhaiya ki Biryani",
      primaryColor: "#e4b65c",
    });
  });

  it("drops undefined fields so a partial update never blanks existing values", () => {
    const update = cleanSettingsInput({ tagline: undefined, companyPhone: "+91 90000" });
    expect(Object.keys(update)).toEqual(["companyPhone"]);
  });

  it("allows explicitly clearing a field with an empty string", () => {
    expect(cleanSettingsInput({ logoUrl: "" })).toEqual({ logoUrl: "" });
  });

  it("returns an empty object for an empty input", () => {
    expect(cleanSettingsInput({})).toEqual({});
  });
});
