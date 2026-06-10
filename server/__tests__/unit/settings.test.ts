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

  it("keeps finance numbers and clamps them at zero", () => {
    expect(
      cleanSettingsInput({ minDeliveryCost: 25, perKmCharge: -3, freeDeliveryAbove: 499 })
    ).toEqual({ minDeliveryCost: 25, perKmCharge: 0, freeDeliveryAbove: 499 });
  });

  it("allows negative store coordinates (southern/western hemispheres)", () => {
    expect(cleanSettingsInput({ storeLat: -12.5, storeLng: 77.6 })).toEqual({
      storeLat: -12.5,
      storeLng: 77.6,
    });
  });

  it("keeps payment toggles as booleans", () => {
    expect(cleanSettingsInput({ codEnabled: false, onlineEnabled: true })).toEqual({
      codEnabled: false,
      onlineEnabled: true,
    });
  });

  it("expands maintenance flags into dotted paths and drops unknown apps", () => {
    expect(
      cleanSettingsInput({ maintenance: { website: true, delivery: false, bogus: true } })
    ).toEqual({ "maintenance.website": true, "maintenance.delivery": false });
  });

  it("ignores unknown fields and wrong types", () => {
    expect(
      cleanSettingsInput({ hacker: "x", minDeliveryCost: "39" as unknown as number })
    ).toEqual({});
  });
});
