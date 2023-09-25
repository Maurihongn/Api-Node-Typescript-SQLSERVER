import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../config/mailer';
import { checkAdminPermission } from '../services/authService';
import { generateToken } from '../services/generateTokens';

const prisma = new PrismaClient();

//FUNCION PARA ENERAR CODIGO DE ACTIVACION
function generateActivationCode(c: number = 6) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < c; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}

//Register user

export const createUser = async (req: Request, res: Response) => {
  const { email, password, name, lastname } = req.body;

  try {
    if (!email || !password || !name || !lastname) {
      console.log({ email, password, name, lastname });
      return res.status(400).json({ message: 'Empty fields' });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'El mail no es valido' });
    }

    // Buscar si existe un usuario ya con ese email
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationCode = generateActivationCode(6);

    // Insertar el nuevo usuario en la tabla Users
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: name,
        lastName: lastname,
        role: {
          connect: { roleId: 2 }, // Conectar al rol "CLIENT"
        },
        isActive: false,
      },
    });

    // Insertar el código de activación en la tabla ActivationCodes
    await prisma.activationCode.create({
      data: {
        code: activationCode,
        isUsed: false,
        user: {
          connect: { userId: newUser.userId }, // Conectar al usuario recién creado
        },
      },
    });

    // Enviar un correo electrónico para confirmar el usuario (código de activación)
    const emailData = {
      from: process.env.EMAILADMIN,
      to: email,
      subject: 'Confirma tu cuenta en MiApp',
      html: `Bienvenido, tu código para confirmar la cuenta es: ${activationCode}`,
    };

    await sendEmail(emailData);

    return res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server internal error' });
  }
};

//Activar cuenta con un codigo de activacion

export const activateUser = async (req: Request, res: Response) => {
  const { activationCode } = req.body;

  if (!activationCode) {
    return res
      .status(400)
      .json({ message: 'El código de activación es obligatorio' });
  }

  try {
    // Buscar si hay una activación con este código
    const activation = await prisma.activationCode.findFirst({
      where: {
        code: activationCode,
      },
    });

    if (!activation) {
      return res
        .status(400)
        .json({ message: 'El código de activación es inválido' });
    }

    // Si hay una activación con este código, actualizar el estado del usuario
    const updateUser = await prisma.user.update({
      where: {
        userId: activation.userId,
      },
      data: {
        isActive: true,
      },
    });

    if (!updateUser) {
      return res
        .status(400)
        .json({ message: 'Error activando usuario, inténtelo nuevamente' });
    }

    // Cambiar el estado de la activación
    const updateActivationCode = await prisma.activationCode.update({
      where: {
        codeId: activation.codeId,
      },
      data: {
        isUsed: true,
      },
    });

    if (!updateActivationCode) {
      return res
        .status(400)
        .json({ message: 'Error activando usuario, inténtelo nuevamente' });
    }

    return res.status(200).json({ message: 'Usuario activado correctamente' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Error activando usuario, inténtelo nuevamente' });
  } finally {
    await prisma.$disconnect(); // Cerrar la conexión de Prisma cuando hayas terminado
  }
};
//Login User

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email field empty' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password field empty' });
    }

    // Encontrar el usuario en la base de datos utilizando Prisma
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { userId: true, isActive: true, password: true },
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    if (user.isActive === false) {
      return res.status(400).json({
        message: 'El usuario no está activado, revisa tu casilla de email',
      });
    }

    const userPassword = user.password;

    const passwordMatch = await bcrypt.compare(password, userPassword);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Email o contraseña incorrectos' });
    }

    const userId = user.userId;

    const Token = generateToken(userId);

    return res.status(200).json({
      Token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Something went wrong' });
  }
};

//CAMBIAR CONTRASEÑA

export const changePassword = async (req: Request, res: Response) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (oldPassword === newPassword) {
    return res.status(400).json({
      message: 'La nueva contraseña no puede ser igual a la anterior',
    });
  }

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Buscar al usuario por ID y traer su contraseña actual utilizando Prisma
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: { userId: true, password: true },
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Comprobar si la contraseña antigua coincide
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Contraseña antigua incorrecta' });
    }

    // Generar el hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña del usuario utilizando Prisma
    await prisma.user.update({
      where: { userId: userId },
      data: { password: hashedPassword },
    });

    return res
      .status(200)
      .json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña, inténtelo de nuevo' });
  }
};

//SOLICITAR CAMBIAR CONTRASEÑA

export const requestChangePassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El email es obligatorio' });
  }

  try {
    // Buscar al usuario por email utilizando Prisma
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { userId: true, email: true },
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar códigos de activación anteriores del mismo usuario utilizando Prisma
    await prisma.activationCode.deleteMany({
      where: { userId: user.userId },
    });

    // Generar código de cambio de contraseña
    const activationToken = uuidv4();

    // Insertar el código de activación en la tabla ActivationCodes utilizando Prisma
    await prisma.activationCode.create({
      data: {
        code: activationToken,
        isUsed: false,
        user: { connect: { userId: user.userId } },
      },
    });

    // Enviar correo electrónico para recuperar contraseña
    const emailData = {
      from: process.env.EMAILADMIN,
      to: email,
      subject: 'Recuperar contraseña',
      html: `<span>Haz clic en el siguiente vínculo <a href="${process.env.FRONTEND_URL}/change-password/${activationToken}">Clic aquí</a> para seguir los pasos y recuperar tu contraseña</span>`,
    };

    await sendEmail(emailData);

    return res.status(200).json({ message: 'Correo enviado' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña, inténtelo de nuevo' });
  }
};

//GUARDAR NUEVA CONTRASEñA
export const saveNewPassword = async (req: Request, res: Response) => {
  const { activationToken, newPassword } = req.body;

  if (!activationToken || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Buscar el código de activación utilizando Prisma
    const activationCode = await prisma.activationCode.findFirst({
      where: { code: activationToken },
      select: { userId: true },
    });

    if (!activationCode) {
      return res
        .status(400)
        .json({ message: 'CÓDIGO DE ACTIVACIÓN INCORRECTO' });
    }

    const userId = activationCode.userId;

    // Cambiar la contraseña del usuario por la nueva utilizando Prisma
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { userId: userId },
      data: { password: hashedPassword },
    });

    // Eliminar el código de activación utilizando Prisma
    await prisma.activationCode.deleteMany({
      where: { userId: userId },
    });

    return res
      .status(200)
      .json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña, inténtelo de nuevo' });
  }
};

//OBETENER EL ROL DEL USUARIO LOGUEADO
export const getUserRole = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'EL USUARIO NO ESTA LOGUEADO' });
  }

  try {
    // Buscar el rol del usuario utilizando Prisma
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: {
        role: { select: { roleId: true, roleName: true, roleValue: true } },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    if (!user.role) {
      return res
        .status(400)
        .json({ message: 'El usuario no tiene un rol asignado' });
    }

    const userRole = user.role;

    return res.status(200).json({
      roleId: userRole.roleId,
      roleName: userRole.roleName,
      roleValue: userRole.roleValue,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Error al obtener el rol del usuario' });
  }
};

//EDITAR USUARIO

export const editUser = async (req: Request, res: Response) => {
  try {
    const { userId, name, lastname, address, phone, birthDate, hireDate } =
      req.body;

    // Buscar el usuario por su ID
    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar los campos si han cambiado
    const updateData: {
      firstName?: string;
      lastName?: string;
      address?: string;
      phone?: string;
      birthDate?: Date;
      hireDate?: Date;
    } = {};
    if (name && name !== user.firstName) {
      updateData.firstName = name;
    }
    if (lastname && lastname !== user.lastName) {
      updateData.lastName = lastname;
    }
    if (address && address !== user.address) {
      updateData.address = address;
    }
    if (phone && phone !== user.phone) {
      updateData.phone = phone;
    }
    if (birthDate && birthDate !== user.birthDate) {
      updateData.birthDate = new Date(birthDate);
    }
    if (hireDate && hireDate !== user.hireDate) {
      updateData.hireDate = new Date(hireDate);
    }

    // Actualizar los datos del usuario si hay cambios
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { userId: userId },
        data: updateData,
      });
    }

    return res.status(200).json({ message: 'Usuario actualizado con éxito.' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Error al actualizar el usuario, intente nuevamente' });
  }
};
//GUARDAR AVATAR
export const saveImage = async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha encontrado la imagen' });
  }

  try {
    // Obtener el usuario por ID usando Prisma
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: { profileImage: true }, // Selecciona la propiedad ProfileImage
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = user.profileImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      // Extraer el nombre del archivo
      const oldFileName = `uploads/avatars/${path.basename(oldImagePath)}`;
      // Eliminarlo
      if (fs.existsSync(oldFileName)) {
        fs.unlinkSync(oldFileName);
      }
    }

    const fileName = `avatar-${Date.now()}-${userId}.webp`;
    const imagePath = `uploads/avatars/${fileName}`; // Ruta donde guardar la imagen

    // Utiliza Sharp para redimensionar y convertir la foto de perfil a WebP
    sharp(req.file.path)
      .resize({ width: 200 }) // Ajusta el tamaño a tus necesidades
      .webp()
      .toFile(imagePath, async (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: 'Error al procesar la foto de perfil.' });
        }

        // Elimina el archivo temporal de la carga
        fs.unlinkSync(req.file!.path);

        // Actualiza la foto de perfil del usuario

        // Preparar la ruta del endpoint de la imagen
        const imageUrl = `${process.env.BASE_URL}/user/image/${fileName}`;

        // Actualiza la propiedad ProfileImage del usuario usando Prisma
        const updatedUser = await prisma.user.update({
          where: { userId: userId },
          data: { profileImage: imageUrl },
        });

        if (!updatedUser) {
          return res.status(400).json({
            message: 'Error al actualizar el usuario intente nuevamente',
          });
        }

        // Si llegaste hasta aquí, la actualización y procesamiento de la foto fueron exitosos
        return res
          .status(200)
          .json({ message: 'Imagen actualizada con éxito.' });
      });
  } catch (error) {
    fs.unlinkSync(req.file!.path);
    return res
      .status(500)
      .json({ message: 'Error al procesar la foto de perfil.' });
  }
};

//OBTENER AVATAR
export const image = async (req: Request, res: Response) => {
  let fileName = req.params.fileName;
  let ruta_fisica = `./uploads/avatars/${fileName}`;

  fs.stat(ruta_fisica, (error, exist) => {
    if (exist) {
      return res.sendFile(path.resolve(ruta_fisica));
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'La imagen no existe',
      });
    }
  });
};

//OBTENER DATOS DEL USUARIO EN GENERAL
export const getUserData = async (req: Request, res: Response) => {
  const { userId } = req.params.userId ? req.params : req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Usuario no encontrado' });
  }

  const userIdNumber = req.params.userId ? parseInt(userId, 10) : userId;

  try {
    // Buscar al usuario por ID utilizando Prisma
    const user = await prisma.user.findUnique({
      where: { userId: userIdNumber },
      select: {
        userId: true,
        email: true,
        profileImage: true,
        firstName: true,
        lastName: true,
        address: true,
        phone: true,
        birthDate: true,
        hireDate: true,
        salary: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error al obtener los datos' });
  }
};

//EDITAR USUARIO SIENDO ADMIN
export const adminEditUser = async (req: Request, res: Response) => {
  const {
    userId,
    userIdToUpdate,
    name,
    lastname,
    email,
    address,
    phone,
    birthDate,
    hireDate,
    isActive,
    roleId,
  } = req.body;

  try {
    // Verificar si el usuario que está haciendo esto tiene permiso (es admin)
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(401).json({ message: 'No estas autorizado' });
    }

    // Obtener los datos del usuario por ID
    const userToUpdate = await prisma.user.findUnique({
      where: { userId: userIdToUpdate },
    });

    if (!userToUpdate) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar los campos del usuario
    const updatedUser = await prisma.user.update({
      where: { userId: userIdToUpdate },
      data: {
        firstName: name || userToUpdate.firstName,
        lastName: lastname || userToUpdate.lastName,
        email: email || userToUpdate.email,
        address: address || userToUpdate.address,
        phone: phone || userToUpdate.phone,
        birthDate: birthDate || userToUpdate.birthDate,
        hireDate: hireDate || userToUpdate.hireDate,
        isActive: isActive !== undefined ? isActive : userToUpdate.isActive,
        roleId: roleId || userToUpdate.roleId,
      },
    });

    return res
      .status(200)
      .json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    return res.status(500).json({ message: 'Error al actualizar el usuario' });
  } finally {
    await prisma.$disconnect();
  }
};
