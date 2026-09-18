import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Herb Suggestion & Verification Workflow", () => {
  it("POST /api/suggest - should require authentication for submitting suggestions", async () => {
    const response = await request(app).post("/api/suggest").send({
      localName: "Test Herb",
      scientificName: "Testus botanical",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("GET /api/suggest - should require authentication to list suggestions", async () => {
    const response = await request(app).get("/api/suggest");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/suggest/1/approve - should reject unauthenticated approval requests", async () => {
    const response = await request(app).post("/api/suggest/1/approve");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/suggest/1/reject - should reject unauthenticated rejection requests", async () => {
    const response = await request(app).post("/api/suggest/1/reject");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/suggest/1/request-changes - should reject unauthenticated requests", async () => {
    const response = await request(app).post("/api/suggest/1/request-changes").send({
      reviewNotes: "Please provide a stronger research source.",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });
});
