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

  it("l email est déjà utilisé", async () => {
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
});
