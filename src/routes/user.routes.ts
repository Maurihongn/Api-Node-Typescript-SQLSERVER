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
/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Crea un nuevo usuario.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Datos del nuevo usuario.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario.
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *               name:
 *                 type: string
 *                 description: Nombre del usuario.
 *               lastname:
 *                 type: string
 *                 description: Apellido del usuario.
 *             required:
 *               - email
 *               - password
 *               - name
 *               - lastname
 *     responses:
 *       201:
 *         description: Usuario creado con éxito.
 *       400:
 *         description: Campos vacíos , usuario ya existe o el mail no es valido.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/register', createUser);
//ACTIVAR USUARIO✔✔✔
/**
 * @swagger
 * /api/user/activate:
 *   post:
 *     summary: Activa un usuario utilizando un código de activación.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Datos para activar el usuario.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activationCode:
 *                 type: string
 *                 description: Código de activación del usuario.
 *             required:
 *               - activationCode
 *     responses:
 *       200:
 *         description: Usuario activado con éxito.
 *       400:
 *         description: Código de activación inválido o error al activar el usuario.
 *       500:
 *         description: Error interno del servidor.
 */

router.post('/activate', activateUser);
//LOGIN✔✔✔
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Inicia sesión con las credenciales del usuario.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Datos para iniciar sesión.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario.
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso. Retorna el token de acceso.
 *       400:
 *         description: Email o contraseña incorrectos, o usuario no activado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/login', loginUser);

//CAMBIAR CONTRASEÑA✔✔✔
/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Cambia la contraseña del usuario.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Datos para cambiar la contraseña.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Contraseña antigua del usuario.
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña del usuario.
 *             required:
 *               - oldPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Contraseña cambiada con éxito.
 *       400:
 *         description: Faltan datos, la nueva contraseña no puede ser igual a la anterior o contraseña antigua incorrecta.
 *       401:
 *         description: No se proporcionó un token de autenticación válido en el encabezado 'Authorization'.
 *       500:
 *         description: Error interno del servidor.
 */

router.post('/change-password', authToken, changePassword);
//SOLICITAR RECUPERAR CONTRASEÑA✔✔✔
/**
 * @swagger
 * /api/user/request-password:
 *   post:
 *     summary: Solicitar cambio de contraseña.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Datos para solicitar cambio de contraseña.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario.
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Correo electrónico de cambio de contraseña enviado con éxito.
 *       400:
 *         description: Campo de correo electrónico vacío o usuario no encontrado.
 *       500:
 *         description: Error interno del servidor al solicitar cambio de contraseña.
 */
router.post('/request-password', requestChangePassword);
//GUARDAR NUEVA CONTRASEÑA✔✔✔
/**
 * @swagger
 * /api/user/save-new-password:
 *   post:
 *     summary: Guardar una nueva contraseña después de la solicitud de cambio.
 *     tags:
 *       - Users
 *     requestBody:
 *       description: Datos para guardar una nueva contraseña.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activationToken:
 *                 type: string
 *                 description: Código de activación para confirmar la solicitud de cambio de contraseña.
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña del usuario.
 *             required:
 *               - activationToken
 *               - newPassword
 *     responses:
 *       200:
 *         description: Contraseña cambiada con éxito.
 *       400:
 *         description: Faltan datos o código de activación incorrecto.
 *       500:
 *         description: Error interno del servidor al cambiar la contraseña.
 */
router.post('/save-new-password', saveNewPassword);
//OBTENER ROL DEL USER LOGUEADO✔✔✔
/**
 * @swagger
 * /api/user/get-user-role:
 *   get:
 *     summary: Obtener el rol del usuario autenticado.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []  # Utiliza la autenticación Bearer Token
 *     responses:
 *       200:
 *         description: Rol del usuario obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roleId:
 *                   type: number
 *                   description: ID del rol del usuario.
 *                 roleName:
 *                   type: string
 *                   description: Nombre del rol del usuario.
 *                 roleValue:
 *                   type: string
 *                   description: Valor del rol del usuario.
 *       401:
 *         description: El usuario no está autenticado.
 *       400:
 *         description: Usuario no encontrado o el usuario no tiene un rol asignado.
 *       500:
 *         description: Error interno del servidor al obtener el rol del usuario.
 */

router.get('/get-user-role', authToken, getUserRole);
//EDITAR EL PERFIL✔✔✔
/**
 * @swagger
 * /api/user/edit-profile:
 *   put:
 *     summary: Editar el perfil de usuario.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []  # Utiliza la autenticación Bearer Token
 *     requestBody:
 *       description: Datos del perfil de usuario a editar.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuevo nombre del usuario.
 *               lastname:
 *                 type: string
 *                 description: Nuevo apellido del usuario.
 *               address:
 *                 type: string
 *                 description: Nueva dirección del usuario.
 *               phone:
 *                 type: string
 *                 description: Nuevo número de teléfono del usuario.
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de nacimiento del usuario (en formato YYYY-MM-DD).
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de contratación del usuario (en formato YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Usuario actualizado con éxito.
 *       400:
 *         description: Usuario no encontrado o no se realizaron cambios.
 *       500:
 *         description: Error interno del servidor al actualizar el usuario.
 */
router.put('/edit-profile', authToken, editUser);
//EDITAR PERFIL ADMIN
/**
 * @swagger
 * /api/user/edit-profile-admin:
 *   put:
 *     summary: Editar el perfil de un usuario (admin).
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []  # Utiliza la autenticación Bearer Token
 *     requestBody:
 *       description: Datos necesarios para editar el perfil del usuario.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIdToUpdate:
 *                 type: number
 *                 description: ID del usuario que se va a editar.
 *               name:
 *                 type: string
 *                 description: Nuevo nombre del usuario.
 *               lastname:
 *                 type: string
 *                 description: Nuevo apellido del usuario.
 *               email:
 *                 type: string
 *                 description: Nuevo correo electrónico del usuario.
 *               address:
 *                 type: string
 *                 description: Nueva dirección del usuario.
 *               phone:
 *                 type: string
 *                 description: Nuevo número de teléfono del usuario.
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de nacimiento del usuario.
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de contratación del usuario.
 *               isActive:
 *                 type: boolean
 *                 description: Nuevo estado de activación del usuario.
 *               roleId:
 *                 type: number
 *                 description: Nuevo ID de rol del usuario.
 *             required:
 *               - userIdToUpdate
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente.
 *       400:
 *         description: Usuario no encontrado o error al actualizar el usuario.
 *       401:
 *         description: No estás autorizado para realizar esta acción.
 *       500:
 *         description: Error interno del servidor al actualizar el usuario.
 */
router.put('/edit-profile-admin', authToken, adminEditUser);
//OBTENER DATOS DE UN USUARIO EN GENERAL✔✔✔

/**
 * @swagger
 * /api/user/get-user-data/{userId}:
 *   get:
 *     summary: Obtener los datos de un usuario.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []  # Utiliza la autenticación Bearer Token
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID del usuario a consultar (opcional, si no se proporciona, se utiliza el token de autenticación del usuario logueado).
 *     responses:
 *       200:
 *         description: Datos del usuario obtenidos con éxito.
 *       400:
 *         description: Usuario no encontrado o error en la solicitud.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/get-user-data/:userId?', authToken, getUserData);
//SUBIR IMAGEN✔✔✔

/**
 * @swagger
 * /api/user/upload-image:
 *   post:
 *     summary: Subir una imagen de perfil.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []  # Utiliza la autenticación Bearer Token
 *     requestBody:
 *       description: Datos necesarios para subir la imagen.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen para subir.
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Imagen de perfil actualizada con éxito.
 *       400:
 *         description: Usuario no encontrado, archivo de imagen no encontrado o error al procesar la imagen.
 *       401:
 *         description: No estás autorizado para realizar esta acción.
 *       500:
 *         description: Error interno del servidor al procesar la imagen de perfil.
 */
router.post(
  '/upload-image',
  avatarUpload.single('image'),
  authToken,
  saveImage
);
//OBTENER IMAGEN ENPOINT✔✔✔
/**
 * @swagger
 * /api/user/image/{fileName}:
 *   get:
 *     summary: Obtener una imagen de perfil de usuario.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del archivo de la imagen de perfil.
 *     responses:
 *       200:
 *         description: Imagen de perfil obtenida con éxito.
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: La imagen no existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/image/:fileName', image);

export default router;
