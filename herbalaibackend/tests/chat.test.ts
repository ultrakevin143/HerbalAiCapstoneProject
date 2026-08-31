import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Dr. Ai Chat Assistant Endpoints", () => {
  it("POST /api/chat - should require authentication", async () => {
    const response = await request(app).post("/api/chat").send({
      message: "What is Lagundi used for?",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });
});
