import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role?: string;
        sub?: number;
      };
    }
  }
}
