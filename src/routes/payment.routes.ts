import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { paymentController } from "../controllers/payment/payment.controller.js";
import { catchAsync } from "../utils/sentry.js";

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Gestion des paiements et transactions
 */

/**
 * @openapi
 * /payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Créer un nouveau paiement
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
 *               - order_id
 *               - amount
 *               - payment_method
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: ID de la commande associée au paiement
 *               amount:
 *                 type: number
 *                 description: Montant du paiement
 *               payment_method:
 *                 type: string
 *                 description: Méthode de paiement utilisée
 *               reference:
 *                 type: string
 *                 description: Référence externe du paiement (optionnel)
 *     responses:
 *       201:
 *         description: Paiement créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Récupérer les détails d'un paiement
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du paiement
 *     responses:
 *       200:
 *         description: Détails du paiement
 *       404:
 *         description: Paiement non trouvé
 *       401:
 *         description: Non authentifié
 *   patch:
 *     tags:
 *       - Payments
 *     summary: Mettre à jour le statut d'un paiement
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du paiement
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
 *                 enum: [pending, completed, failed, refunded]
 *                 description: Nouveau statut du paiement
 *     responses:
 *       200:
 *         description: Statut du paiement mis à jour avec succès
 *       404:
 *         description: Paiement non trouvé
 *       400:
 *         description: Statut invalide
 *       401:
 *         description: Non authentifié
 */

export const createPaymentRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = paymentController(prisma);

  router.post("/", authMiddleware, catchAsync(controller.createPayment));

  router.get("/:id", authMiddleware, catchAsync(controller.getPaymentById));

  router.patch(
    "/:id",
    authMiddleware,
    catchAsync(controller.updatePaymentStatus),
  );

  return router;
};
