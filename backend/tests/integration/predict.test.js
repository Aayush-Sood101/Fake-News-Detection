import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const mlServer = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/predict" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        label: "REAL",
        confidence: 0.91,
        explanation: "Mock prediction from integration test",
        modality: "text_only",
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

await new Promise((resolve) => mlServer.listen(8000, resolve));

const { default: app } = await import("../../src/server.js");
const { default: db } = await import("../../src/models/index.js");

let authToken = "";

test.before(async () => {
  await db.sequelize.sync({ force: true });
  const signupRes = await request(app).post("/api/auth/signup").send({
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    role: "user",
  });

  authToken = signupRes.body.token;
});

test.after(async () => {
  await db.sequelize.close();
  await new Promise((resolve) => mlServer.close(resolve));
});

test("POST /api/predict returns prediction for text-only input", async () => {
  const res = await request(app)
    .post("/api/predict")
    .set("Authorization", `Bearer ${authToken}`)
    .field("title", "Test headline for analysis")
    .field("body", "Test article body content");

  assert.equal(res.status, 200);
  assert.ok(res.body.id);
  assert.match(res.body.label, /^(REAL|FAKE)$/);
  assert.ok(res.body.confidence >= 0 && res.body.confidence <= 1);
});

test("POST /api/predict rejects request without authentication", async () => {
  const res = await request(app).post("/api/predict").field("title", "Test headline");
  assert.equal(res.status, 401);
});

test("POST /api/predict rejects request without title", async () => {
  const res = await request(app)
    .post("/api/predict")
    .set("Authorization", `Bearer ${authToken}`)
    .field("body", "Only body, no title");

  assert.equal(res.status, 400);
});

test("POST /api/predict accepts image upload", async () => {
  const fixture = path.resolve("tests/fixtures/test_image.jpg");
  const res = await request(app)
    .post("/api/predict")
    .set("Authorization", `Bearer ${authToken}`)
    .field("title", "Image headline")
    .attach("image", fixture);

  assert.equal(res.status, 200);
});

test("GET /api/history returns user predictions with pagination", async () => {
  const res = await request(app)
    .get("/api/history")
    .set("Authorization", `Bearer ${authToken}`)
    .query({ page: 1, limit: 10 });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.predictions));
  assert.ok(res.body.pagination);
});
