import { registerUser, loginUser, refreshAccessToken } from "./auth.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as any;

describe("registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throw error if email is already used", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
    });

    await expect(
      registerUser(prismaMock, {
        mail: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow("Cet email est déjà utilisé.");
  });

  it("creates a new user and returns an access token", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
      role: "user",
    });
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 1,
      token_hash: "hashedToken",
      user_id: 1,
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (jwt.sign as jest.Mock).mockReturnValue("accessToken");
    const result = await registerUser(prismaMock, {
      mail: "test@example.com",
      password: "password123",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
    expect(result.newUser).toEqual({
      id: 1,
      mail: "test@example.com",
      role: "user",
    });
    expect(result.accessToken).toBe("accessToken");
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("throw error if credentials are invalid", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      loginUser(prismaMock, "notgoduser@example.com", "password"),
    ).rejects.toThrow("Invalid credentials");
  });
  it("throw error if password isn't correct", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
      password_hash: "HashedPassword",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      loginUser(prismaMock, "test@example.com", "badpassword"),
    ).rejects.toThrow("Invalid credentials");
  });
  it("returns user information if credentials are valid", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
      password_hash: "HashedPassword",
      role: "user",
    });
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 1,
      token_hash: "hashedToken",
      user_id: 1,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("accessToken");
    const result = await loginUser(
      prismaMock,
      "test@example.com",
      "password123",
    );
    expect(result.id).toBe(1);
    expect(result.email).toBe("test@example.com");
    expect(result.accessToken).toBe("accessToken");
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throw error if refresh token is absent", async () => {
    await expect(refreshAccessToken(prismaMock, "")).rejects.toThrow(
      "Refresh token is required",
    );
  });

  it("throw error if refresh token is invalid", async () => {
    prismaMock.refreshToken.findMany.mockResolvedValue([
      {
        token_hash: "hashedToken",
        expires_at: new Date(Date.now() + 60_000),
        user: { id: 1, role: "user" },
      },
    ]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      refreshAccessToken(prismaMock, "invalid-refresh"),
    ).rejects.toThrow("Invalid or expired refresh token");
  });

  it("returns an access token if refresh token is valid", async () => {
    prismaMock.refreshToken.findMany.mockResolvedValue([
      {
        token_hash: "hashedToken",
        expires_at: new Date(Date.now() + 60_000),
        user: { id: 1, role: "user" },
      },
    ]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("newAccessToken");

    const result = await refreshAccessToken(prismaMock, "valid-refresh");

    expect(result.accessToken).toBe("newAccessToken");
    expect(jwt.sign).toHaveBeenCalled();
  });
});
