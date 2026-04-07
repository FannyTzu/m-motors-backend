import { PrismaClient, Role } from "@prisma/client";
import { Router } from "express";
import { folderController } from "../controllers/folder/folder.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";

/**
 * @openapi
 * tags:
 *   - name: Folders
 *     description: Gestion des dossiers client
 */

/**
 * @openapi
 * /folder:
 *   get:
 *     tags:
 *       - Folders
 *     summary: Récupérer tous les dossiers (Admin uniquement)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les dossiers
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */

/**
 * @openapi
 * /folder/create:
 *   post:
 *     tags:
 *       - Folders
 *     summary: Créer un nouveau dossier client
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du dossier
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur propriétaire du dossier
 *               description:
 *                 type: string
 *                 description: Description optionnelle du dossier
 *     responses:
 *       201:
 *         description: Dossier créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /folder/user/{userId}:
 *   get:
 *     tags:
 *       - Folders
 *     summary: Récupérer tous les dossiers d'un utilisateur
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des dossiers de l'utilisateur
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /folder/{id}:
 *   get:
 *     tags:
 *       - Folders
 *     summary: Récupérer les détails d'un dossier
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du dossier
 *     responses:
 *       200:
 *         description: Détails du dossier
 *       404:
 *         description: Dossier non trouvé
 *       401:
 *         description: Non authentifié
 *   delete:
 *     tags:
 *       - Folders
 *     summary: Supprimer un dossier
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du dossier
 *     responses:
 *       204:
 *         description: Dossier supprimé avec succès
 *       404:
 *         description: Dossier non trouvé
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /folder/{id}/status:
 *   put:
 *     tags:
 *       - Folders
 *     summary: Mettre à jour le statut d'un dossier
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du dossier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED, DELETED]
 *                 description: Nouveau statut du dossier
 *     responses:
 *       200:
 *         description: Statut du dossier mis à jour avec succès
 *       404:
 *         description: Dossier non trouvé
 *       400:
 *         description: Statut invalide
 *       401:
 *         description: Non authentifié
 */

export const createFolderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = folderController(prisma);

  router.use(authMiddleware);

  router.get("/", roleMiddleware(Role.admin), controller.getAllFolders);

  router.post("/create", controller.createFolder);

  router.get("/user/:userId", controller.getFoldersByUser);

  router.get("/:id", controller.getFolderById);

  router.put("/:id/status", controller.updateFolderStatus);

  router.delete("/:id", controller.deleteFolder);

  return router;
};
