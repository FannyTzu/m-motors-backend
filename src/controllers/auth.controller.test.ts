import request from "supertest";
import { app } from "../app";
import * as authService from "../services/auth.service";
import jwt from "jsonwebtoken";

jest.mock("../../src/services/auth.service");

jest.mock("jsonwebtoken");

it("retoune 201 et le user si l'inscription réussit", async () => {
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
it("retourne 500 si le service lève une erreur", async () => {
  (authService.registerUser as jest.Mock).mockRejectedValue(
    new Error("Cet email est déjà utilisé."),
  );

  const res = await request(app)
    .post("/auth/register")
    .send({ email: "test@mail.com", password: "password123" });

  expect(res.status).toBe(500);
  expect(res.body.error).toBe("Cet email est déjà utilisé.");
});

it("retoune 200 et le user si la connexion réussit", async () => {
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
it("retourne 400 si le login échoue", async () => {
  (authService.loginUser as jest.Mock).mockRejectedValue(
    new Error("Invalid credentials"),
  );

  const res = await request(app)
    .post("/auth/login")
    .send({ email: "test@mail.com", password: "wrong" });

  expect(res.status).toBe(400);
});
it("retourne 200 et le user si la connexion réussit avec token", async () => {
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
it("retourne 401 si req.user est absent", async () => {
  const res = await request(app).get("/auth/me");
  expect(res.status).toBe(401);
});

it("retourne 401 si refresh_token est absent", async () => {
  const res = await request(app).post("/auth/refresh-token");
  expect(res.status).toBe(401);
  expect(res.body.error).toBe("Refresh token not found");
});

it("retourne 200 et un accessToken si refresh_token est valide", async () => {
  (authService.refreshAccessToken as jest.Mock).mockResolvedValue({
    accessToken: "newAccessToken",
  });

  const res = await request(app)
    .post("/auth/refresh-token")
    .set("Cookie", ["refresh_token=valid-refresh-token"]);

  expect(res.status).toBe(200);
  expect(res.body.accessToken).toBe("newAccessToken");
});
