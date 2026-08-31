import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Herb Library API Endpoints", () => {
  it("GET /api/herbs - should return list of verified herbs with pagination metadata", async () => {
    const response = await request(app).get("/api/herbs");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data.herbs)).toBe(true);
    expect(typeof response.body.data.total).toBe("number");
    expect(response.body.data.herbs.length).toBeGreaterThan(0);
  });

  it("GET /api/herbs?isDohApproved=true - should return only DOH-approved medicinal plants", async () => {
    const response = await request(app).get("/api/herbs?isDohApproved=true");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    const herbs = response.body.data.herbs;
    expect(herbs.length).toBeGreaterThan(0);
    herbs.forEach((herb: { isDohApproved: boolean }) => {
      expect(herb.isDohApproved).toBe(true);
    });
  });

  it("GET /api/herbs?page=1&limit=3 - should respect pagination limits", async () => {
    const response = await request(app).get("/api/herbs?page=1&limit=3");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.herbs.length).toBeLessThanOrEqual(3);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(3);
    expect(response.body.data.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/herbs?search=Lagundi - should return matching search results", async () => {
    const response = await request(app).get("/api/herbs?search=Lagundi");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    const herbs = response.body.data.herbs;
    expect(herbs.length).toBeGreaterThan(0);
    expect(herbs[0].localName.toLowerCase()).toContain("lagundi");
  });

  it("GET /api/herbs/invalid-id-xyz - should return 404 for non-existent herb", async () => {
    const response = await request(app).get("/api/herbs/invalid-id-xyz");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
  });
});
