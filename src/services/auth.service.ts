import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export const registerUser = async (
  prisma: PrismaClient,
  userData: {
    mail: string;
    password: string;
  },
) => {
  const { mail, password } = userData;

  const existingUser = await prisma.user.findUnique({ where: { mail: mail } });
  if (existingUser) {
    //in french but it s use in frontend (for user)
    throw new Error("Cet email est déjà utilisé.");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      mail,
      password_hash: hashedPassword,
    },
  });

  const accessToken = jwt.sign(
    { sub: newUser.id, role: newUser.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" },
  );

  const unhashedRefreshToken = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(unhashedRefreshToken, SALT_ROUNDS);

  await prisma.refreshToken.create({
    data: {
      token_hash: refreshTokenHash,
      user_id: newUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { newUser, accessToken, refreshToken: unhashedRefreshToken };
};

export const loginUser = async (
  prisma: PrismaClient,
  email: string,
  password: string,
) => {
  const user = await prisma.user.findUnique({ where: { mail: email } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" },
  );

  const unhashedRefreshToken = crypto.randomUUID();
  const refreshTokenHash = await bcrypt.hash(unhashedRefreshToken, SALT_ROUNDS);

  await prisma.refreshToken.create({
    data: {
      token_hash: refreshTokenHash,
      user_id: user.id,
      expires_at: new Date(Date.now() + 5000),
    },
  });

  return {
    id: user.id,
    email: user.mail,
    accessToken,
    refreshToken: unhashedRefreshToken,
  };
};
export const refreshAccessToken = async (
  prisma: PrismaClient,
  refreshToken: string,
) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const refreshTokenRecords = await prisma.refreshToken.findMany({
    include: { user: true },
  });

  let validToken = null;
  for (const record of refreshTokenRecords) {
    const isValid = await bcrypt.compare(refreshToken, record.token_hash);
    if (isValid && record.expires_at > new Date()) {
      validToken = record;
      break;
    }
  }

  if (!validToken) {
    throw new Error("Invalid or expired refresh token");
  }

  const accessToken = jwt.sign(
    { sub: validToken.user.id, role: validToken.user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" },
  );

  return { accessToken };
};
