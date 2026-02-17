import request from "supertest";
import { app } from "../app.js";
import * as authService from "../services/auth.service.js";
import jwt from "jsonwebtoken";

jest.mock("../../src/services/auth.service");

jest.mock("jsonwebtoken");

it("return 201 and user if registration succeeds", async () => {
  (authService.registerUser as jest.Mock).mockResolvedValue({
    newUser: { id: 1, mail: "test@example.com", role: "user" },
    accessToken: "token",
    refreshToken: "refreshToken",
  });
  const response = await request(app)
    .post("/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  expect(response.status).toBe(201);
  expect(response.body.user).toEqual({
    id: 1,
    mail: "test@example.com",
    role: "user",
  });
  expect(response.body.accessToken).toBe("token");
});
it("return 409 if email is already used", async () => {
  (authService.registerUser as jest.Mock).mockRejectedValue(
    new Error("Cet email est déjà utilisé."),
  );

  const res = await request(app)
    .post("/auth/register")
    .send({ email: "test@mail.com", password: "password123" });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe("Cet email est déjà utilisé.");
});

it("return 200 and user if login succeeds", async () => {
  (authService.loginUser as jest.Mock).mockResolvedValue({
    id: 1,
    mail: "test@example.com",
    role: "user",
  });
  (jwt.sign as jest.Mock).mockReturnValue("token");
  process.env.JWT_ACCESS_SECRET = "secret";

  const response = await request(app)
    .post("/auth/login")
    .send({ email: "test@example.com", password: "password123" });
  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"]).toBeDefined();
});
it("return 400 if login fails", async () => {
  (authService.loginUser as jest.Mock).mockRejectedValue(
    new Error("Invalid credentials"),
  );

  const res = await request(app)
    .post("/auth/login")
    .send({ email: "test@mail.com", password: "wrong" });

  expect(res.status).toBe(400);
});
it("return 200 and user if login succeeds with token", async () => {
  process.env.JWT_ACCESS_SECRET = "test-secret";
  (authService.loginUser as jest.Mock).mockResolvedValue({
    id: 1,
    email: "test@mail.com",
    role: "user",
    accessToken: "token",
    refreshToken: "refreshToken",
  });

  const res = await request(app)
    .post("/auth/login")
    .send({ email: "test@mail.com", password: "password123" });

  expect(res.status).toBe(200);
  expect(res.body.user).toEqual({
    id: 1,
    email: "test@mail.com",
    role: "user",
  });
});
it("return 401 if req.user is absent", async () => {
  const res = await request(app).get("/auth/me");
  expect(res.status).toBe(401);
});

it("return 401 if refresh_token is absent", async () => {
  const res = await request(app).post("/auth/refresh-token");
  expect(res.status).toBe(401);
  expect(res.body.error).toBe("Refresh token not found");
});

it("return 200 and an accessToken if refresh_token is valid", async () => {
  (authService.refreshAccessToken as jest.Mock).mockResolvedValue({
    accessToken: "newAccessToken",
  });

  const res = await request(app)
    .post("/auth/refresh-token")
    .set("Cookie", ["refresh_token=valid-refresh-token"]);

  expect(res.status).toBe(200);
  expect(res.body.accessToken).toBe("newAccessToken");
});

it("return 401 if user is not authenticated", async () => {
  const res = await request(app).patch("/auth/me");

  expect(res.status).toBe(401);
});
