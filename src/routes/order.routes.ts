import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { orderController } from "../controllers/order/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import { catchAsync } from "../utils/sentry.js";

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Gestion des commandes client
 */

/**
 * @openapi
 * /orders/create:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Créer une nouvelle commande
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
 *               - folder_id
 *               - vehicle_id
 *             properties:
 *               folder_id:
 *                 type: integer
 *                 description: ID du dossier contenant la commande
 *               vehicle_id:
 *                 type: integer
 *                 description: ID du véhicule commandé
 *               options:
 *                 type: array
 *                 description: Options supplémentaires optionnelles
 *                 items:
 *                   type: object
 *                   properties:
 *                     option_id:
 *                       type: integer
 *                       description: ID de l'option
 *     responses:
 *       201:
 *         description: Commande créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Récupérer les détails d'une commande
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande
 *       404:
 *         description: Commande non trouvée
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /orders/folder/{folder_id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Récupérer toutes les commandes d'un dossier
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: folder_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du dossier
 *     responses:
 *       200:
 *         description: Liste des commandes du dossier
 *       404:
 *         description: Dossier non trouvé
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Mettre à jour le statut d'une commande
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
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
 *                 enum: [draft, confirmed, cancelled]
 *                 description: Nouveau statut de la commande
 *     responses:
 *       200:
 *         description: Statut de la commande mis à jour avec succès
 *       404:
 *         description: Commande non trouvée
 *       400:
 *         description: Statut invalide
 *       401:
 *         description: Non authentifié
 */

export const createOrderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = orderController(prisma);

  router.post(
    "/create",
    validateSchema(createOrderSchema),
    authMiddleware,
    catchAsync(controller.createOrder),
  );

  router.get("/:id", authMiddleware, catchAsync(controller.getOrder));

  router.get(
    "/folder/:folder_id",
    authMiddleware,
    catchAsync(controller.getOrdersByFolder),
  );

  router.patch(
    "/:id/status",
    validateSchema(updateOrderStatusSchema),
    authMiddleware,
    catchAsync(controller.updateOrderStatus),
  );

  return router;
};
