import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("User Authentication & Session Management", () => {
  it("POST /api/auth/signup - should reject signup with missing required fields", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      email: "invalid-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/auth/signup - should reject password under 8 characters", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser_short",
      email: "shortpass@example.com",
      password: "123",
      name: "Short Pass User",
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/auth/login - should reject invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent_user_98765@example.com",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("GET /api/auth/me - should reject unauthorized session verification", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });
});
