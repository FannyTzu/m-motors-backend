import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import * as Sentry from "@sentry/node";

export const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    req.user = decoded;

    Sentry.setUser({
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access forbidden: insufficient permissions" });
    }

    next();
  };
};
