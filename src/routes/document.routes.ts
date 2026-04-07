import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  documentController,
  upload,
} from "../controllers/document/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

/**
 * @openapi
 * tags:
 *   - name: Documents
 *     description: Gestion des documents ajoutés par les clients
 */

/**
 * @openapi
 * /documents:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Uploader un nouveau document
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - folderId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Le fichier à uploader
 *               folderId:
 *                 type: integer
 *                 description: ID du dossier contenant le document
 *               name:
 *                 type: string
 *                 description: Nom du document
 *               type:
 *                 type: string
 *                 description: "Type du document (ex: 'carte d'identité', 'permis', etc.)"
 *     responses:
 *       201:
 *         description: Document uploadé avec succès
 *       400:
 *         description: Données invalides ou fichier manquant
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /documents/folder/{folderId}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Récupérer tous les documents d'un dossier
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: folderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du dossier
 *     responses:
 *       200:
 *         description: Liste des documents du dossier
 *       404:
 *         description: Dossier non trouvé
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /documents/{id}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Récupérer un document
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document
 *     responses:
 *       200:
 *         description: Document récupéré avec succès
 *       404:
 *         description: Document non trouvé
 *       401:
 *         description: Non authentifié
 *   patch:
 *     tags:
 *       - Documents
 *     summary: Mettre à jour un document
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document mis à jour avec succès
 *       404:
 *         description: Document non trouvé
 *       401:
 *         description: Non authentifié
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Supprimer un document
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du document
 *     responses:
 *       200:
 *         description: Document supprimé avec succès
 *       404:
 *         description: Document non trouvé
 *       401:
 *         description: Non authentifié
 */

export const documentRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = documentController(prisma);

  router.use(authMiddleware);

  router.post("/", upload.single("file"), controller.uploadDocument);

  router.get("/folder/:folderId", controller.getDocumentsByFolder);

  router.get("/:id", controller.getDocumentById);

  router.patch("/:id", controller.updateDocument);

  router.delete("/:id", controller.deleteDocument);

  return router;
};
