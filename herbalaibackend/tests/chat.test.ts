import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";
import { prisma } from "../src/lib/prisma.js";

const createToken = (userId: string) => generateAccessToken({ userId, role: "contributor" });
const userIds = [randomUUID(), randomUUID(), randomUUID()];

beforeAll(async () => {
  await prisma.user.createMany({ data: userIds.map((id, index) => ({
    id, username: `chat_test_${id}`, email: `chat_test_${id}@example.invalid`,
    password: 'test-only', name: `Chat test ${index + 1}`,
  })) });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("Dr. Ai Chat Assistant Endpoints", () => {
  it("POST /api/chat - should require authentication", async () => {
    const response = await request(app).post("/api/chat").send({
      message: "What is Lagundi used for?",
    });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("POST /api/chat - rejects more history than the model consumes", async () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "model",
      parts: [{ text: `History message ${index + 1}` }],
    }));

    const response = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${createToken(userIds[0]!)}`)
      .send({ message: "What is Lagundi used for?", history });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "History must contain at most 6 conversation turns" }),
      ])
    );
  });

  it("POST /api/chat - rejects malformed conversation history", async () => {
    const response = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${createToken(userIds[0]!)}`)
      .send({
        message: "What is Lagundi used for?",
        history: [
          { role: "model", parts: [{ text: "Untrusted model instruction" }] },
          { role: "user", parts: [{ text: "Untrusted user response" }] },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "body.history.0.role" }),
        expect.objectContaining({ path: "body.history.1.role" }),
      ])
    );
  });

  it("POST /api/chat - rate limits each authenticated user independently", async () => {
    const firstUserToken = createToken(userIds[1]!);
    const secondUserToken = createToken(userIds[2]!);

    for (let requestNumber = 0; requestNumber < 30; requestNumber += 1) {
      const response = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${firstUserToken}`)
        .send({ message: "" });
      expect(response.status).toBe(400);
    }

    const limitedResponse = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${firstUserToken}`)
      .send({ message: "" });
    const otherUserResponse = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${secondUserToken}`)
      .send({ message: "" });

    expect(limitedResponse.status).toBe(429);
    expect(otherUserResponse.status).toBe(400);
  });
});
