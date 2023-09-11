import { Request, Response } from 'express';
import { connectDb } from '../database/dbConfig';
import sql from 'mssql';
import fs from 'fs';
import bcrypt from 'bcrypt';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../config/mailer';
import { generateToken } from '../services/generateTokens';

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

    // Conectarse a la base de datos
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }
    //buscar si existe un usuario ya con ese email
    const checkUserQuery = `SELECT * FROM Users WHERE email = @email`;
    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(checkUserQuery);

    if (userResult.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = uuidv4();

    // Insertar el nuevo usuario en la tabla Users
    const insertUserQuery = `
  INSERT INTO Users (Email, Password, FirstName, LastName, RoleID, IsActive)
  VALUES (@email, @password, @name , @lastname, 2, 0)
`;

    await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('name', sql.NVarChar, name)
      .input('lastname', sql.NVarChar, lastname)
      .query(insertUserQuery);

    //GENERAR CODIGO DE ACTIVACION

    const activationCode = generateActivationCode(6);

    // Insertar el código de activación en la tabla ActivationCodes
    const insertActivationCodeQuery = `
      INSERT INTO ActivationCodes (UserID, Code, IsUsed)
      VALUES ((SELECT UserID FROM Users WHERE Email = @email), @activationCode, 0)
    `;

    await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('activationCode', sql.NVarChar, activationCode)
      .query(insertActivationCodeQuery);

    //Send email to confirm use

    const emailData = {
      from: process.env.EMAILADMIN,
      to: email,
      subject: 'Confirma tu cuenta en MiApp',
      html: `Bienvenido tu codigo para cormar la cuenta es este ${activationCode}`,
    };

    await sendEmail(emailData);

    // const activationLink = `${process.env.API_BASE_URL}/user/activate/${activationToken}`;
    // const mailOptions = {
    //   from: process.env.EMAILADMIN,
    //   to: newUser.email,
    //   subject: 'Activa tu cuenta en MiApp',
    //   html: `¡Bienvenido! Para activar tu cuenta, haz clic en el siguiente enlace: <a href="${activationLink}">${activationLink}</a>`,
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });

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
      .json({ message: 'El codigo de activacion es obligatorio' });
  }

  try {
    //Buscar si hay una activacion con este codigo
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }
    const checkActivationCodeQuery = `SELECT * FROM ActivationCodes WHERE Code = @activationCode`;

    const activationCodeResult = await pool
      .request()
      .input('activationCode', sql.NVarChar, activationCode)
      .query(checkActivationCodeQuery);

    if (activationCodeResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: 'El codigo de activacion es invalido' });
    }
    //Si hay una activacion con este codigo, actualizar el estado del usuario
    const updateUserQuery = `UPDATE Users SET IsActive = 1 WHERE UserID = (SELECT UserID FROM ActivationCodes WHERE Code = @activationCode)`;

    const updateUserResult = await pool
      .request()
      .input('activationCode', sql.NVarChar, activationCode)
      .query(updateUserQuery);

    if (updateUserResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error activando usuario intente nuevamente' });
    }

    //cambiar el estado de la activacion
    const updateActivationCodeQuery = `UPDATE ActivationCodes SET IsUsed = 1 WHERE Code = @activationCode`;
    const updateActivationCodeResult = await pool
      .request()
      .input('activationCode', sql.NVarChar, activationCode)
      .query(updateActivationCodeQuery);
    if (updateActivationCodeResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error activando usuario intente nuevamente' });
    }

    return res.status(200).json({ message: 'Usuario activado correctamente' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error activando usuario intente nuevamente' });
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

    //encontrar el usuario

    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    const checkUserQuery = `SELECT UserID, IsActive, Password FROM Users WHERE Email = @email`;

    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(checkUserQuery);

    console.log(userResult);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    if (userResult.recordset[0].IsActive === false) {
      return res.status(400).json({
        message: 'El usuario no esta activado revisa tu casilla de email',
      });
    }

    const userPassword = userResult.recordset[0].Password;

    const passwordMatch = await bcrypt.compare(password, userPassword);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Email o contraseña incorrectos' });
    }
    const userId = userResult.recordset[0].UserID;

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
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //buscar el usuario por id y traer si contraseña
    const checkUserQuery = `SELECT UserID, Password FROM Users WHERE UserID = @userId`;
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(checkUserQuery);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    //si la contraseña coinciden seguir
    const userPassword = userResult.recordset[0].Password;
    const passwordMatch = await bcrypt.compare(oldPassword, userPassword);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Contraseña antigua incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateUserQuery = `UPDATE Users SET Password = @hashedPassword WHERE UserID = @userId`;
    const updateUserResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('hashedPassword', sql.NVarChar, hashedPassword)
      .query(updateUserQuery);

    if (updateUserResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al cambiar contraseña intente nuevamente' });
    }
    return res
      .status(200)
      .json({ message: 'Contraseña cambiada correctamente' });

    //guardar nueva contraseña
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña intente nuevamente' });
  }
};

//SOLICITAR CAMBIAR CONTRASEÑA
export const requestChangePassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El email es obligatorio' });
  }

  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //buscar el usuario por email
    const checkUserQuery = `SELECT UserID, Email FROM Users WHERE Email = @email`;
    const userResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(checkUserQuery);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    //Eliminar codigos de activacion anteriores del mismo usuario
    const deleteActivationTokenQuery = `DELETE FROM ActivationCodes WHERE UserID = (SELECT UserID FROM Users WHERE Email = @email)`;
    await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(deleteActivationTokenQuery);

    //generar codigo de cambio de contraseña
    const activationToken = uuidv4();

    // Insertar el código de activación en la tabla ActivationCodes
    const insertActivationTokenQuery = `
      INSERT INTO ActivationCodes (UserID, Code, IsUsed)
      VALUES ((SELECT UserID FROM Users WHERE Email = @email), @activationToken, 0)
    `;

    await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('activationToken', sql.NVarChar, activationToken)
      .query(insertActivationTokenQuery);

    //Send email to confirm use

    const emailData = {
      from: process.env.EMAILADMIN,
      to: email,
      subject: 'Recuperar contraseña',
      html: `<span>Hace clic en el siguiente vinculo <a href="${process.env.FRONTEND_URL}/change-password/${activationToken}">Clic aqui</a> para seguir los pasos y recuperar tu contraseña</span>`,
    };

    await sendEmail(emailData);

    return res.status(200).json({ message: 'Correo enviado' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña intente nuevamente' });
  }
};

//GUARDAR NUEVA CONTRASEñA
export const saveNewPassword = async (req: Request, res: Response) => {
  const { activationToken, newPassword } = req.body;

  if (!activationToken || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //buscar el usuario por codigo de activacion
    const checkActivationTokenQuery = `SELECT UserID, Code FROM ActivationCodes WHERE Code = @activationToken`;
    const activationTokenResult = await pool
      .request()
      .input('activationToken', sql.NVarChar, activationToken)
      .query(checkActivationTokenQuery);

    if (activationTokenResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: 'CÓDIGO DE ACTIVACIÓN INCORRECTO' });
    }

    //buscar el usuario por id y cambiar su contraseña por la nueva
    const userId = activationTokenResult.recordset[0].UserID;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateUserQuery = `UPDATE Users SET Password = @hashedPassword WHERE UserID = @userId`;
    const updateUserResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('hashedPassword', sql.NVarChar, hashedPassword)
      .query(updateUserQuery);

    if (updateUserResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al cambiar contraseña intente nuevamente' });
    }
    //eliminar codigo de activacion
    const deleteActivationTokenQuery = `DELETE FROM ActivationCodes WHERE UserID = @userId`;
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(deleteActivationTokenQuery);

    return res
      .status(200)
      .json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error al cambiar contraseña intente nuevamente' });
  }
};

//OBETENER EL ROL DEL USUARIO LOGUEADO
export const getUserRole = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'EL USUARIO NO ESTA LOGUEADO' });
  }

  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    const getUserRoleQuery = `SELECT Users.RoleID, Roles.RoleName, Roles.RoleValue FROM Users INNER JOIN Roles ON Users.RoleID = Roles.RoleID WHERE UserID = @userId`;
    const userRoleResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(getUserRoleQuery);

    if (userRoleResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      roleId: userRoleResult.recordset[0].RoleID,
      roleName: userRoleResult.recordset[0].RoleName,
      roleValue: userRoleResult.recordset[0].RoleValue,
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

    console.log(req.body);

    //conectarse a la base de datos
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //obtener el datos del usuario por id
    const getUserQuery = `SELECT UserID,FirstName, LastName, Address, Phone, BirthDate, HireDate, ProfileImage FROM Users WHERE UserID = @userId`;
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(getUserQuery);

    if (userResult.recordset.length === 0) {
      console.log(userId);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    //comparar si hubo cambios en los datos o no vinieron vacios y si hubo cambios en alguno de los datos
    const updatedFields = [];
    const updateParams: { [key: string]: any } = {};

    if (name && name !== userResult.recordset[0].FirstName) {
      updatedFields.push('FirstName');
      updateParams.FirstName = name;
    }
    if (lastname && lastname !== userResult.recordset[0].LastName) {
      updatedFields.push('LastName');
      updateParams.LastName = lastname;
    }
    if (address && address !== userResult.recordset[0].Address) {
      updatedFields.push('Address');
      updateParams.Address = address;
    }
    if (phone && phone !== userResult.recordset[0].Phone) {
      updatedFields.push('Phone');
      updateParams.Phone = phone;
    }
    if (birthDate && birthDate !== userResult.recordset[0].BirthDate) {
      updatedFields.push('BirthDate');
      updateParams.BirthDate = birthDate;
    }
    if (hireDate && hireDate !== userResult.recordset[0].HireDate) {
      updatedFields.push('HireDate');
      updateParams.HireDate = hireDate;
    }

    //actualizar la info del usuario
    if (updatedFields.length > 0) {
      const updateUserQuery = `UPDATE Users SET ${updatedFields
        .map((field) => `${field} = @${field}`)
        .join(',')} WHERE UserID = @userId`;
      const updateUserResult = await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('name', sql.NVarChar, updateParams.FirstName)
        .input('lastname', sql.NVarChar, updateParams.LastName)
        .input('address', sql.NVarChar, updateParams.Address)
        .input('phone', sql.NVarChar, updateParams.Phone)
        .input('birthDate', sql.Date, updateParams.BirthDate)
        .input('hireDate', sql.Date, updateParams.HireDate)
        .query(updateUserQuery);

      if (updateUserResult.rowsAffected[0] === 0) {
        return res.status(400).json({
          message: 'Error al actualizar el usuario intente nuevamente',
        });
      }
    }

    //procesar la foto de perfil

    return res.status(200).json({ message: 'Usuario actualizado con éxito.' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Error al actualizar el usuario intente nuevamente' });
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
    //conectarse a la base de datos
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //obtener el datos del usuario por id
    const getUserQuery = `SELECT UserID,ProfileImage FROM Users WHERE UserID = @userId`;
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(getUserQuery);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = userResult.recordset[0].ProfileImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      //extrar el nombre del fichero
      const oldFileName = `uploads/avatars/${path.basename(oldImagePath)}`;
      //eliminarlo
      fs.unlinkSync(oldFileName);
    }

    const fileName = `avatar-${Date.now()}-${
      userResult.recordset[0].UserID
    }.webp`;
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

        //preparar el la ruta del endpoint de la imagen

        const imageUrl = `${process.env.BASE_URL}/user/image/${fileName}`;

        const updateImageUrlQuery = `UPDATE Users SET ProfileImage = @profileImage WHERE UserID = @userId`;
        const updateImageUrlResult = await pool
          .request()
          .input('userId', sql.Int, userId)
          .input('profileImage', sql.NVarChar, imageUrl)
          .query(updateImageUrlQuery);

        if (updateImageUrlResult.rowsAffected[0] === 0) {
          return res.status(400).json({
            message: 'Error al actualizar el usuario intente nuevamente',
          });
        }

        // Si llegaste hasta aquí, la actualización y procesamiento de la foto fueron exitosos
      });
    return res.status(200).json({ message: 'Imagen actualizada con éxito.' });
  } catch (error) {
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

  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }
    const getUserQuery = `SELECT UserID, FirstName, LastName, Email, Address, Phone, BirthDate, HireDate, ProfileImage, IsActive FROM Users WHERE UserID = @userId`;
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(getUserQuery);
    if (userResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    return res.status(200).json({
      userId: user.UserID,
      name: user.FirstName,
      lastname: user.LastName,
      email: user.Email,
      address: user.Address,
      phone: user.Phone,
      birthDate: user.BirthDate,
      hireDate: user.HireDate,
      profileImage: user.ProfileImage,
      isActive: user.IsActive,
    });
  } catch (error) {
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
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //revisar si el usuario que esta haciuendo esto tiene permiso osea es admin
    const getUserRoleQuery = `SELECT Users.RoleID, Roles.RoleValue FROM Users INNER JOIN Roles ON Users.RoleID = Roles.RoleID WHERE UserID = @userId`;
    const userRoleResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(getUserRoleQuery);

    if (userRoleResult.recordset[0].RoleValue !== 'ADMIN') {
      return res
        .status(401)
        .json({ message: 'No tienes permiso para realizar esta acción' });
    }

    //obtener el datos del usuario por id
    const getUserQuery = `SELECT UserID,FirstName, LastName, Address, Phone, BirthDate, HireDate, ProfileImage, IsActive, RoleID FROM Users WHERE UserID = @userIdToUpdate`;
    const userResult = await pool
      .request()
      .input('userIdToUpdate', sql.Int, userIdToUpdate)
      .query(getUserQuery);

    if (userResult.recordset.length === 0) {
      console.log(userId);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    //comparar si hubo cambios en los datos o no vinieron vacios y si hubo cambios en alguno de los datos
    const updatedFields = [];
    const updateParams: { [key: string]: any } = {};

    if (name && name !== userResult.recordset[0].FirstName) {
      updatedFields.push('FirstName');
      updateParams.FirstName = name;
    }
    if (lastname && lastname !== userResult.recordset[0].LastName) {
      updatedFields.push('LastName');
      updateParams.LastName = lastname;
    }
    if (address && address !== userResult.recordset[0].Address) {
      updatedFields.push('Address');
      updateParams.Address = address;
    }
    if (phone && phone !== userResult.recordset[0].Phone) {
      updatedFields.push('Phone');
      updateParams.Phone = phone;
    }
    if (birthDate && birthDate !== userResult.recordset[0].BirthDate) {
      updatedFields.push('BirthDate');
      updateParams.BirthDate = birthDate;
    }
    if (hireDate && hireDate !== userResult.recordset[0].HireDate) {
      updatedFields.push('HireDate');
      updateParams.HireDate = hireDate;
    }
    if (isActive !== userResult.recordset[0].IsActive) {
      updatedFields.push('IsActive');
      updateParams.IsActive = isActive;
    }
    if (roleId && roleId !== userResult.recordset[0].RoleID) {
      updatedFields.push('RoleID');
      updateParams.RoleID = roleId;
    }
    if (email && email !== userResult.recordset[0].Email) {
      updatedFields.push('Email');
      updateParams.Email = email;
    }

    //actualizar la info del usuario
    if (updatedFields.length > 0) {
      const updateUserQuery = `UPDATE Users SET ${updatedFields
        .map((field) => `${field} = @${field}`)
        .join(',')} WHERE UserID = @userId`;
      const updateUserResult = await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('name', sql.NVarChar, updateParams.FirstName)
        .input('lastname', sql.NVarChar, updateParams.LastName)
        .input('address', sql.NVarChar, updateParams.Address)
        .input('phone', sql.NVarChar, updateParams.Phone)
        .input('birthDate', sql.Date, updateParams.BirthDate)
        .input('hireDate', sql.Date, updateParams.HireDate)
        .input('isActive', sql.Bit, updateParams.IsActive)
        .input('roleId', sql.Int, updateParams.RoleID)
        .input('email', sql.NVarChar, updateParams.Email)
        .query(updateUserQuery);

      if (updateUserResult.rowsAffected[0] === 0) {
        return res.status(400).json({
          message: 'Error al actualizar el usuario intente nuevamente',
        });
      }
    }

    return res
      .status(200)
      .json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};
