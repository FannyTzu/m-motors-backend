import { registerUser, loginUser } from "./auth.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
} as any;

describe("registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throw une erreur si l'email est déjà utilisé", async () => {
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

  it("crée un nouvel utilisateur et retourne un token d'accès", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
      role: "user",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (jwt.sign as jest.Mock).mockReturnValue("accessToken");
    const result = await registerUser(prismaMock, {
      mail: "test@example.com",
      password: "password123",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
    expect(result).toEqual({
      newUser: {
        id: 1,
        mail: "test@example.com",
        role: "user",
      },
      accessToken: "accessToken",
    });
  });
  it;
});

describe("loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("throw une erreur si les identifiants sont invalides", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      loginUser(prismaMock, "notgoduser@example.com", "password"),
    ).rejects.toThrow("Invalid credentials");
  });
  it("throw une erreur si le mot de passe est incorrect", async () => {
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
  it("retourne les informations de l'utilisateur si les identifiants sont valides", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      mail: "test@example.com",
      password_hash: "HashedPassword",
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await loginUser(
      prismaMock,
      "test@example.com",
      "HashedPassword",
    );
    expect(result).toEqual({
      id: 1,
      email: "test@example.com",
    });
  });
});
