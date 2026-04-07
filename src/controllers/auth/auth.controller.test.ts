import request from "supertest";
import * as authService from "../../services/auth/auth.service.js";
import jwt from "jsonwebtoken";

jest.mock("../../services/auth/auth.service.js");

jest.mock("jsonwebtoken");

const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockPrismaUser,
  })),
  Role: {
    admin: "admin",
    user: "user",
  },
}));

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(),
}));

jest.mock("pg", () => ({
  Pool: jest.fn(),
}));

import { app } from "../../app.js";

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
it("return 401 if req.user is missing", async () => {
  const res = await request(app).get("/auth/me");
  expect(res.status).toBe(401);
});

it("return 401 if refresh_token is missing", async () => {
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

describe("GET /auth/me", () => {
  it("return 200 and user data if user is authenticated", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 1, role: "user" });
    process.env.JWT_ACCESS_SECRET = "test-secret";

    const mockUser = {
      id: 1,
      mail: "test@mail.com",
      role: "user",
      first_name: "John",
      last_name: "Doe",
      phone_number: "0123456789",
      address: "123 Test St",
    };

    mockPrismaUser.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", ["access_token=valid-access-token"]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      mail: "test@mail.com",
      role: "user",
      firstName: "John",
      lastName: "Doe",
      phone: "0123456789",
      address: "123 Test St",
    });
  });
});

describe("PATCH /auth/me", () => {
  it("return 200 and updated user data when update succeeds", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 1, role: "user" });
    process.env.JWT_ACCESS_SECRET = "test-secret";

    const mockUpdatedUser = {
      id: 1,
      mail: "test@mail.com",
      role: "user",
      first_name: "Jane",
      last_name: "Smith",
      phone_number: "0676543210",
      address: "456 rue du soleil levant",
    };

    mockPrismaUser.update.mockResolvedValue(mockUpdatedUser);

    const res = await request(app)
      .patch("/auth/me")
      .set("Cookie", ["access_token=valid-access-token"])
      .send({
        firstName: "Jane",
        lastName: "Smith",
        phone: "9876543210",
        address: "456 New St",
      });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Jane");
    expect(res.body.lastName).toBe("Smith");
  });
});

describe("POST /auth/logout", () => {
  it("return 200 and clear cookies on logout", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 1, role: "user" });
    process.env.JWT_ACCESS_SECRET = "test-secret";

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", ["access_token=valid-access-token"]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });
});

describe("POST /auth/refresh-token", () => {
  it("return 401 if refresh token is invalid or expired", async () => {
    (authService.refreshAccessToken as jest.Mock).mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    const res = await request(app)
      .post("/auth/refresh-token")
      .set("Cookie", ["refresh_token=invalid-refresh-token"]);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired refresh token");
  });
});

describe("DELETE /auth/me", () => {
  it("return 401 if user is not authenticated", async () => {
    const res = await request(app).delete("/auth/me");

    expect(res.status).toBe(401);
  });

  it("return 403 if user is admin", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 1, role: "admin" });
    process.env.JWT_ACCESS_SECRET = "test-secret";

    const res = await request(app)
      .delete("/auth/me")
      .set("Cookie", ["access_token=valid-access-token"]);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Admin accounts cannot be deleted.");
  });

  it("return 200 and clear cookies when account is deleted successfully", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 1, role: "user" });
    (authService.deleteUserAccount as jest.Mock).mockResolvedValue(undefined);
    process.env.JWT_ACCESS_SECRET = "test-secret";

    const res = await request(app)
      .delete("/auth/me")
      .set("Cookie", ["access_token=valid-access-token"]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account deleted successfully");
  });
});
