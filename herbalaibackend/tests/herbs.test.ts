import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { invalidateHerbCache } from "../src/repositories/herb.repository.js";

describe("Herb Library API Endpoints", () => {
  const fixtureId = `herb-api-test-${randomUUID()}`;

  beforeAll(async () => {
    const builtInLagundi = await prisma.herb.findFirst({
      where: { localName: "Lagundi", provenance: "BUILT_IN", isVerified: true, publicationStatus: "PUBLISHED" },
    });
    if (!builtInLagundi) {
      await prisma.herb.create({
        data: {
          id: fixtureId,
          localName: "Lagundi",
          scientificName: "Vitex negundo",
          category: "Test fixture",
          medicinalUses: "Test fixture only",
          preparationMethod: "Test fixture only",
          dosage: "Not applicable",
          isDohApproved: true,
          isVerified: true,
          publicationStatus: "PUBLISHED",
        },
      });
    }
    invalidateHerbCache();
  });

  afterAll(async () => {
    await prisma.herb.deleteMany({ where: { id: fixtureId } });
    invalidateHerbCache();
  });

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

  it('normalizes invalid pages and caps excessive page sizes', async () => {
    const response = await request(app).get('/api/herbs?page=-1&limit=1000');

    expect(response.status).toBe(200);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(100);
    expect(response.body.data.herbs.length).toBeLessThanOrEqual(100);
    expect(response.body.data.totalPages).toBe(Math.ceil(response.body.data.total / 100));
  });

  it("GET /api/herbs/categories - lists categories across the full published catalog", async () => {
    const [categoriesResponse, herbsResponse] = await Promise.all([
      request(app).get("/api/herbs/categories"),
      request(app).get("/api/herbs?page=1&limit=3"),
    ]);
    expect(categoriesResponse.status).toBe(200);
    const categories: string[] = categoriesResponse.body.data.categories;
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain(herbsResponse.body.data.herbs[0].category);
  });

  it("GET /api/herbs/catalog - returns names for links without detailed herb content", async () => {
    const response = await request(app).get("/api/herbs/catalog");
    expect(response.status).toBe(200);
    expect(response.body.data.herbs.length).toBeGreaterThan(0);
    expect(response.body.data.herbs[0]).toEqual(expect.objectContaining({ id: expect.any(String), localName: expect.any(String) }));
    expect(response.body.data.herbs[0]).not.toHaveProperty('medicinalUses');
    expect(response.body.data.herbs[0]).not.toHaveProperty('sources');
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
