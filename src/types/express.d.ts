import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub?: number;
        userId?: number;
        role?: string;
      };
    }
  }
}
