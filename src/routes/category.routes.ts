import express from 'express';
import {
  deleteCategory,
  editCategory,
  getCategories,
  getCategory,
  saveCategory,
} from '../controllers/category.controller';
import { authToken } from '../middlewares/auth';

const router = express.Router();

//OBTENER TODAS LAS CATEGORIAS✔✔✔
/**
 * @swagger
 * /api/category/all:
 *   get:
 *     summary: Obtener todas las categorías.
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Categorías obtenidas con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       204:
 *         description: No hay categorías disponibles.
 *       500:
 *         description: Error interno del servidor al obtener las categorías.
 */
router.get('/all', getCategories);

//OBTENER UNA CATEGORIA✔✔✔
/**
 * @swagger
 * /api/category/{categoryId}:
 *   get:
 *     summary: Obtener una categoría por su categoryId
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría a obtener
 *     responses:
 *       '200':
 *         description: Categoría obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Faltan datos
 *       '404':
 *         description: No existe la categoría
 *       '500':
 *         description: Error al obtener la categoría
 */

// Ruta para obtener una categoría por su categoryId
router.get('/:categoryId', getCategory);

//GUARDAR UNA CATEGORIA✔✔✔
/**
 * @swagger
 * /api/category/save:
 *   post:
 *     summary: Guardar una nueva categoría
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la categoría
 *               description:
 *                 type: string
 *                 description: Descripción de la categoría
 *             required:
 *               - name
 *               - description
 *     responses:
 *       '200':
 *         description: Categoría creada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Faltan datos o ya existe una categoría con ese nombre
 *       '401':
 *         description: No estás autorizado
 *       '500':
 *         description: Error al crear la categoría, intente nuevamente
 */
router.post('/save', authToken, saveCategory);

//EDITAR UNA CATEGORIA✔✔✔
/**
 * @swagger
 * /api/category/edit/{categoryId}:
 *   put:
 *     summary: Editar una categoría existente
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         description: ID de la categoría a editar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuevo nombre de la categoría
 *               description:
 *                 type: string
 *                 description: Nueva descripción de la categoría
 *               isActive:
 *                 type: boolean
 *                 description: Nuevo estado de activación de la categoría
 *             required:
 *               - name
 *               - description
 *     responses:
 *       '200':
 *         description: Categoría editada con éxito
 *       '400':
 *         description: Faltan datos o error al editar la categoría
 *       '401':
 *         description: No estás autorizado
 *       '500':
 *         description: Error interno del servidor
 */
router.put('/edit/:categoryId', authToken, editCategory);

//ELIMINAR UNA CATEGORIA✔✔✔
/**
 * @swagger
 * /api/category/delete/{categoryId}:
 *   delete:
 *     summary: Eliminar una categoría existente
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         description: ID de la categoría a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Categoría eliminada con éxito
 *       '400':
 *         description: Faltan datos o error al eliminar la categoría
 *       '401':
 *         description: No estás autorizado
 *       '500':
 *         description: Error interno del servidor
 */
router.delete('/delete/:categoryId', authToken, deleteCategory);

export default router;
