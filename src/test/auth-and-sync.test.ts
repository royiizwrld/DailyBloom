import { describe, expect, it } from "vitest";
import { validateSignup } from "@/lib/auth-validation";
import { todayInZone } from "@/lib/cloud-data";
import { safeRedirect } from "@/routes/login";

const ok = { firstName: "Ann", lastName: "", email: "ann@example.com", password: "longenough", confirm: "longenough" };

describe("signup validation", () => {
  it("accepts a valid form with no last name", () => expect(validateSignup(ok)).toEqual({}));
  it("requires a first name", () => expect(validateSignup({ ...ok, firstName: " " }).firstName).toBeDefined());
  it("rejects an invalid email", () => expect(validateSignup({ ...ok, email: "ann@" }).email).toBeDefined());
  it("requires at least 8 password characters", () => {
    expect(validateSignup({ ...ok, password: "1234567", confirm: "1234567" }).password).toBeDefined();
    expect(validateSignup({ ...ok, password: "12345678", confirm: "12345678" }).password).toBeUndefined();
  });
  it("requires matching passwords", () => expect(validateSignup({ ...ok, confirm: "different1" }).confirm).toBeDefined());
});

describe("check-in day uses the user's timezone", () => {
  const instant = new Date("2026-11-04T22:30:00Z");
  it("is already the 5th in Nairobi", () => expect(todayInZone("Africa/Nairobi", instant).getDate()).toBe(5));
  it("is still the 4th in New York", () => expect(todayInZone("America/New_York", instant).getDate()).toBe(4));
});

describe("post-login redirect", () => {
  it("returns to the page the user wanted", () => expect(safeRedirect("/stats?x=1")).toBe("/stats?x=1"));
  it("never leaves the site", () => expect(safeRedirect("https://evil.example/x")).toBe("/today"));
  it("defaults to today", () => expect(safeRedirect(undefined)).toBe("/today"));
});
