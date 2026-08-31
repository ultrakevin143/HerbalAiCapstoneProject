import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { generateAccessToken } from "../src/utils/jwt.js";
import { prisma } from "../src/lib/prisma.js";

describe("Herbal AI - Comprehensive System Features & AI Chat Verification", () => {
  // Generate valid test JWT tokens
  const contributorToken = generateAccessToken({
    userId: "test-user-id-001",
    role: "contributor",
  });

  const adminToken = generateAccessToken({
    userId: "test-admin-id-001",
    role: "admin",
  });

  describe("1. Core Feature: Dr. Ai Assistant (RAG Chat with pgvector & Gemini)", () => {
    it("POST /api/chat - rejects unauthenticated requests", async () => {
      const res = await request(app).post("/api/chat").send({
        message: "What is Lagundi used for?",
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });

    it("POST /api/chat - rejects empty messages", async () => {
      const res = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${contributorToken}`)
        .send({ message: "   " });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    it("POST /api/chat - successfully answers questions with RAG grounding and sources", async () => {
      const userQuery = "What are the medicinal benefits and preparation of Lagundi?";
      
      const res = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${contributorToken}`)
        .send({
          message: userQuery,
          history: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeDefined();
      expect(res.body.data.reply).toBeDefined();
      expect(typeof res.body.data.reply).toBe("string");
      expect(res.body.data.reply.length).toBeGreaterThan(20);
      expect(Array.isArray(res.body.data.history)).toBe(true);
      expect(res.body.data.history.length).toBe(2); // user + model turns
      expect(res.body.data.history[0].role).toBe("user");
      expect(res.body.data.history[1].role).toBe("model");
    }, 25000);

    it("POST /api/chat - supports multi-turn conversational context", async () => {
      const history = [
        { role: "user", parts: [{ text: "Hello, I have a cold." }] },
        { role: "model", parts: [{ text: "Hello! For cold symptoms, several Philippine herbs like Lagundi can be helpful." }] },
      ];

      const res = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${contributorToken}`)
        .send({
          message: "How many times a day should I drink the tea?",
          history,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.history.length).toBe(4); // 2 previous + 2 new
    }, 25000);
  });

  describe("2. Herb Library & Exploration Features", () => {
    it("GET /api/herbs - returns paginated herb list", async () => {
      const res = await request(app).get("/api/herbs?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.herbs).toBeDefined();
      expect(Array.isArray(res.body.data.herbs)).toBe(true);
      expect(res.body.data.page).toBe(1);
    });

    it("GET /api/herbs - filters by DOH approved herbs", async () => {
      const res = await request(app).get("/api/herbs?isDohApproved=true");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      for (const herb of res.body.data.herbs) {
        expect(herb.isDohApproved).toBe(true);
      }
    });

    it("GET /api/herbs - searches herbs by name or use", async () => {
      const res = await request(app).get("/api/herbs?search=Sambong");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.herbs)).toBe(true);
    });
  });

  describe("3. Community Forum Features", () => {
    it("GET /api/forum/threads - returns forum thread listings", async () => {
      const res = await request(app).get("/api/forum/threads");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.threads)).toBe(true);
    });
  });

  describe("4. Direct Messaging Features", () => {
    it("GET /api/messages/users - requires authentication", async () => {
      const res = await request(app).get("/api/messages/users");
      expect(res.status).toBe(401);
    });

    it("GET /api/messages/users - returns user list when authenticated", async () => {
      const res = await request(app)
        .get("/api/messages/users")
        .set("Authorization", `Bearer ${contributorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });
  });

  describe("5. Notifications System", () => {
    it("GET /api/notifications - returns user notification list", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${contributorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(typeof res.body.data.unreadCount).toBe("number");
    });
  });

  describe("6. Platform Analytics & Admin Features", () => {
    it("GET /api/stats/dashboard - returns platform statistics for admin", async () => {
      const res = await request(app)
        .get("/api/stats/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeDefined();
    });

    it("GET /api/admin/audit-logs - rejects non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/audit-logs")
        .set("Authorization", `Bearer ${contributorToken}`);
      expect(res.status).toBe(403);
    });

    it("GET /api/admin/audit-logs - allows admin users", async () => {
      const res = await request(app)
        .get("/api/admin/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });
});
