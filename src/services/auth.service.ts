import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

export const registerUser = async (
  prisma: PrismaClient,
  userData: {
    mail: string;
    password: string;
  },
) => {
  const { mail, password } = userData;

  const existingUser = await prisma.user.findUnique({ where: { mail } });
  if (existingUser) {
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

  return { newUser, accessToken };
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
  return {
    id: user.id,
    email: user.mail,
  };
};
