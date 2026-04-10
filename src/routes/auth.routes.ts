import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authController } from "../controllers/auth/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  loginSchema,
  registerSchema,
  updateMeSchema,
} from "../schemas/auth.schema.js";
import { catchAsync } from "../utils/sentry.js";

/**
 * @openapi
 * tags:
 *   - name: Authentication
 *     description: Endpoints d'authentification et gestion du profil
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Créer un nouveau compte (uniquement pour les clients)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password must contain at least one uppercase letter, one number, and one special character
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       409:
 *         description: Email déjà utilisé
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Se connecter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Récupérer le profil utilisateur
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non authentifié
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Mettre à jour le profil
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Se déconnecter
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Renouveler le token d'accès
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nouveau token généré
 *       401:
 *         description: Refresh token invalide
 */

/**
 * @openapi
 * /auth/me:
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Supprimer le compte (uniquement pour les clients)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Administrateur ne peut pas supprimer son compte
 */

export const createAuthRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = authController(prisma);

  router.post("/register", validateSchema(registerSchema), controller.register);

  router.post("/login", validateSchema(loginSchema), controller.login);

  router.get("/me", authMiddleware, catchAsync(controller.me));

  router.patch(
    "/me",
    authMiddleware,
    validateSchema(updateMeSchema),
    catchAsync(controller.updateMe),
  );

  router.post("/logout", authMiddleware, catchAsync(controller.logout));

  router.post("/refresh-token", controller.refreshToken);

  router.delete("/me", authMiddleware, catchAsync(controller.deleteAccount));

  return router;
};
