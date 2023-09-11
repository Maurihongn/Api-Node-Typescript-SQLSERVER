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
router.get('/all', getCategories);

//OBTENER UNA CATEGORIA✔✔✔
router.get('/:categoryId', getCategory);

//GUARDAR UNA CATEGORIA✔✔✔
router.post('/save', authToken, saveCategory);

//EDITAR UNA CATEGORIA✔✔✔
router.put('/edit/:categoryId', authToken, editCategory);

//ELIMINAR UNA CATEGORIA✔✔✔
router.delete('/delete/:categoryId', authToken, deleteCategory);

export default router;
