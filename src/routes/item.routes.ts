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
router.post('/create', itemUpload.single('image'), authToken, createItem);

//mostrar imagen
router.get('/image/:fileName', image);
//CARGAR IMAGEN A UN ITEM
router.put(
  '/upload-image/:itemId',
  itemUpload.single('image'),
  authToken,
  uploadImage
);

//OBTENER ITEMS
router.get('/all', authToken, getItems);

//OBTENER POR ID
router.get('/:itemId', authToken, getItemById);

//EDITAR ITEM
router.put('/:itemId', itemUpload.single('image'), authToken, editItem);

//ELIMINAR ITEM
router.delete('/:itemId', authToken, deleteItem);

export default router;
