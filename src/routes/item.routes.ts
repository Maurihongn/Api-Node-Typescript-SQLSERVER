import express from 'express';
import { authToken } from '../middlewares/auth';
import { itemUpload } from '../services/multerConfig';
import {
  createItem,
  deleteItem,
  editItem,
  getItemById,
  getItems,
  image,
  uploadImage,
} from '../controllers/item.controller';

const router = express.Router();

//CREAR UN ITEM✔✔✔
/**
 * @swagger
 * /api/item/create:
 *   post:
 *     summary: Crear un nuevo ítem
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Ítem creado correctamente
 *       '400':
 *         description: Faltan datos o error al crear el ítem
 *       '401':
 *         description: No estás autorizado
 *       '500':
 *         description: Error interno del servidor
 */
router.post('/create', itemUpload.single('image'), authToken, createItem);

//mostrar imagen
/**
 * @swagger
 * /api/item/image/{fileName}:
 *   get:
 *     summary: Mostrar imagen de un ítem
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         description: Nombre del archivo de imagen del ítem
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Imagen del ítem
 *       '404':
 *         description: La imagen no existe
 */
router.get('/image/:fileName', image);
//CARGAR IMAGEN A UN ITEM
/**
 * @swagger
 * /api/item/upload-image/{itemId}:
 *   put:
 *     summary: Subir imagen para un ítem existente
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         description: ID del ítem para el cual se va a subir la imagen
 *         schema:
 *           type: integer
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Archivo de imagen a subir (formato WebP recomendado)
 *     responses:
 *       '200':
 *         description: Imagen subida con éxito
 *       '400':
 *         description: Faltan datos o el ítem no existe
 *       '401':
 *         description: No estás autorizado para hacer esta acción
 *       '500':
 *         description: Error al procesar la imagen del ítem
 */

router.put(
  '/upload-image/:itemId',
  itemUpload.single('image'),
  authToken,
  uploadImage
);

//OBTENER ITEMS
/**
 * @swagger
 * /api/item/all:
 *   get:
 *     summary: Obtener una lista de ítems
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         type: string
 *         description: Búsqueda opcional por nombre de categoría
 *       - in: query
 *         name: page
 *         type: integer
 *         description: Número de página (predeterminado 1)
 *       - in: query
 *         name: limit
 *         type: integer
 *         description: Cantidad de ítems por página (predeterminado 10)
 *     responses:
 *       '200':
 *         description: Lista de ítems obtenida con éxito
 *       '401':
 *         description: No estás autorizado para hacer esta acción
 *       '500':
 *         description: Error al obtener los ítems
 */
router.get('/all', authToken, getItems);

//OBTENER POR ID
/**
 * @swagger
 * /api/item/{itemId}:
 *   get:
 *     summary: Obtener un ítem por su ID.
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         description: ID del ítem a obtener.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ítem encontrado exitosamente.
 *       400:
 *         description: Error en la solicitud o ítem no encontrado.
 *       401:
 *         description: No estás autorizado para hacer esta acción.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/:itemId', authToken, getItemById);

//EDITAR ITEM
/**
 * @swagger
 * /api/item/{itemId}:
 *   put:
 *     summary: Editar un ítem por su ID.
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         description: ID del ítem a editar.
 *         schema:
 *           type: integer
 *       - name: name
 *         in: formData
 *         required: true
 *         description: Nuevo nombre del ítem.
 *         schema:
 *           type: string
 *       - name: price
 *         in: formData
 *         required: true
 *         description: Nuevo precio del ítem.
 *         schema:
 *           type: number
 *       - name: isActive
 *         in: formData
 *         required: true
 *         description: Indica si el ítem está activo o no (true o false).
 *         schema:
 *           type: boolean
 *       - name: description
 *         in: formData
 *         required: true
 *         description: Nueva descripción del ítem.
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: formData
 *         required: true
 *         description: ID de la categoría a la que pertenece el ítem.
 *         schema:
 *           type: integer
 *       - name: image
 *         in: formData
 *         description: Nueva imagen del ítem (opcional).
 *         type: file
 *     responses:
 *       200:
 *         description: Ítem editado correctamente.
 *       400:
 *         description: Error en la solicitud o ítem no encontrado.
 *       401:
 *         description: No estás autorizado para hacer esta acción.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/:itemId', itemUpload.single('image'), authToken, editItem);

//ELIMINAR ITEM
/**
 * @swagger
 * /api/item/{itemId}:
 *   delete:
 *     summary: Eliminar un ítem por su ID.
 *     tags:
 *       - Items
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         description: ID del ítem a eliminar.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ítem eliminado correctamente.
 *       400:
 *         description: Error en la solicitud o ítem no encontrado.
 *       401:
 *         description: No estás autorizado para hacer esta acción.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/:itemId', authToken, deleteItem);

export default router;
