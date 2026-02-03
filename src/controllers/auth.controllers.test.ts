import request from "supertest";
import { app } from "../app";
import * as authService from "../services/auth.service";
import jwt from "jsonwebtoken";

jest.mock("../../src/services/auth.service");

jest.mock("jsonwebtoken");

it("retoune 201 et le user si l'inscription réussit", async () => {
  (authService.registerUser as jest.Mock).mockResolvedValue({
    newUser: { id: 1, mail: "test@example.com" },
    accessToken: "token",
  });
  const response = await request(app)
    .post("/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  expect(response.status).toBe(201);
  expect(response.body).toEqual({
    newUser: { id: 1, mail: "test@example.com" },
    accessToken: "token",
  });
});
it("retourne 400 si le service lève une erreur", async () => {
  (authService.registerUser as jest.Mock).mockRejectedValue(
    new Error("Cet email est déjà utilisé."),
  );

  const res = await request(app)
    .post("/auth/register")
    .send({ email: "test@mail.com", password: "password123" });

  expect(res.status).toBe(400);
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
it("retourne 400 si JWT_ACCESS_SECRET est manquant", async () => {
  delete process.env.JWT_ACCESS_SECRET;

  (authService.loginUser as jest.Mock).mockResolvedValue({
    id: "1",
    mail: "test@mail.com",
  });

  const res = await request(app)
    .post("/auth/login")
    .send({ email: "test@mail.com", password: "password123" });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe("JWT_ACCESS_SECRET is not defined");
});
it("retourne 401 si req.user est absent", async () => {
  const res = await request(app).get("/auth/me");
  expect(res.status).toBe(401);
});
