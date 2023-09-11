import express from 'express';
import {
  activateUser,
  adminEditUser,
  changePassword,
  createUser,
  editUser,
  getUserData,
  getUserRole,
  image,
  loginUser,
  requestChangePassword,
  saveImage,
  saveNewPassword,
} from '../controllers/user.controller';
import { authToken, readToken } from '../middlewares/auth';
import { avatarUpload } from '../services/multerConfig';

const router = express.Router();

//REGISTRO✔✔✔
router.post('/register', createUser);
//ACTIVAR USUARIO✔✔✔
router.post('/activate', activateUser);
//LOGIN✔✔✔
router.post('/login', loginUser);
//CAMBIAR CONTRASEÑA✔✔✔
router.post('/change-password', authToken, changePassword);
//SOLICITAR RECUPERAR CONTRASEÑA✔✔✔
router.post('/request-password', requestChangePassword);
//GUARDAR NUEVA CONTRASEÑA✔✔✔
router.post('/save-new-password', saveNewPassword);
//OBTENER ROL DEL USER LOGUEADO✔✔✔
router.get('/get-user-role', authToken, getUserRole);
//EDITAR EL PERFIL✔✔✔
router.put('/edit-profile', avatarUpload.single('image'), authToken, editUser);
//EDITAR PERFIL ADMIN
router.put('/edit-profile-admin', authToken, adminEditUser);
//OBTENER DATOS DE UN USUARIO EN GENERAL✔✔✔
router.get('/get-user-data/:userId?', readToken, getUserData);
//SUBIR IMAGEN✔✔✔
router.post(
  '/upload-image',
  avatarUpload.single('image'),
  authToken,
  saveImage
);
//OBTENER IMAGEN ENPOINT✔✔✔
router.get('/image/:fileName', image);

export default router;
