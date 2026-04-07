import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import {
  vehicleController,
  uploadVehicleImage,
} from "../controllers/vehicle/vehicle.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema.js";
import { catchAsync } from "../utils/sentry.js";

/**
 * @openapi
 * tags:
 *   - name: Vehicles
 *     description: Gestion du catalogue de véhicules
 */

/**
 * @openapi
 * /vehicle:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Récupérer tous les véhicules
 *     responses:
 *       200:
 *         description: Liste de tous les véhicules disponibles
 */

/**
 * @openapi
 * /vehicle/create:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Créer un nouveau véhicule (Admin uniquement)
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
 *               - brand
 *               - model
 *               - year
 *               - energy
 *               - km
 *               - color
 *               - place
 *               - door
 *               - type
 *               - transmission
 *               - status
 *               - price
 *             properties:
 *               brand:
 *                 type: string
 *                 description: Marque du véhicule
 *               model:
 *                 type: string
 *                 description: Modèle du véhicule
 *               year:
 *                 type: integer
 *                 description: Année du véhicule (min 1950)
 *               energy:
 *                 type: string
 *                 description: Type d'énergie (essence, diesel, électrique, hybride)
 *               km:
 *                 type: integer
 *                 description: Kilométrage du véhicule
 *               color:
 *                 type: string
 *                 description: Couleur du véhicule
 *               place:
 *                 type: integer
 *                 description: Nombre de places (1-9)
 *               door:
 *                 type: integer
 *                 description: Nombre de portes (1-5)
 *               type:
 *                 type: string
 *                 enum: [sale, rental]
 *                 description: Type de vente ou location
 *               transmission:
 *                 type: string
 *                 enum: [automatic, manual]
 *                 description: Type de transmission
 *               status:
 *                 type: string
 *                 enum: [available, reserved, sold]
 *                 description: Statut du véhicule
 *               price:
 *                 type: number
 *                 description: Prix du véhicule
 *               image:
 *                 type: string
 *                 description: URL de l'image du véhicule (optionnel)
 *               description:
 *                 type: string
 *                 description: Description additionnelle (optionnel)
 *     responses:
 *       201:
 *         description: Véhicule créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */

/**
 * @openapi
 * /vehicle/type/{type}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Récupérer les véhicules par type (sale ou rental)
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sale, rental]
 *         description: Type de véhicule (sale ou rental)
 *     responses:
 *       200:
 *         description: Liste des véhicules du type spécifié
 *       404:
 *         description: Type de véhicule non valide
 */

/**
 * @openapi
 * /vehicle/{id}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Récupérer les détails d'un véhicule
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du véhicule
 *     responses:
 *       200:
 *         description: Détails du véhicule
 *       404:
 *         description: Véhicule non trouvé
 *   put:
 *     tags:
 *       - Vehicles
 *     summary: Mettre à jour un véhicule (Admin uniquement)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du véhicule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               energy:
 *                 type: string
 *               km:
 *                 type: integer
 *               color:
 *                 type: string
 *               place:
 *                 type: integer
 *               door:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [sale, rental]
 *               transmission:
 *                 type: string
 *                 enum: [automatic, manual]
 *               status:
 *                 type: string
 *                 enum: [available, reserved, sold]
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Véhicule mis à jour avec succès
 *       404:
 *         description: Véhicule non trouvé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 *   delete:
 *     tags:
 *       - Vehicles
 *     summary: Supprimer un véhicule (Admin uniquement)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du véhicule
 *     responses:
 *       204:
 *         description: Véhicule supprimé avec succès
 *       404:
 *         description: Véhicule non trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */

/**
 * @openapi
 * /vehicle/{id}/image:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Uploader une image pour un véhicule (Admin uniquement)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du véhicule
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image du véhicule
 *     responses:
 *       200:
 *         description: Image uploadée avec succès
 *       404:
 *         description: Véhicule non trouvé
 *       400:
 *         description: Fichier invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */

export const createVehicleRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = vehicleController(prisma);

  router.post(
    "/create",
    validateSchema(createVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.createVehicle),
  );

  router.get("/", catchAsync(controller.getAllVehicles));

  router.get("/type/:type", catchAsync(controller.getVehiclesByType));

  router.get("/:id", catchAsync(controller.getVehicleById));

  router.put(
    "/:id",
    validateSchema(updateVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.updateVehicle),
  );

  router.post(
    "/:id/image",
    authMiddleware,
    roleMiddleware(Role.admin),
    uploadVehicleImage.single("image"),
    catchAsync(controller.uploadImage),
  );

  router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.deleteVehicleById),
  );

  return router;
};
