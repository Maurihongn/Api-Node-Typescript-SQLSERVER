"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEditUser = exports.getUserData = exports.image = exports.saveImage = exports.editUser = exports.getUserRole = exports.saveNewPassword = exports.requestChangePassword = exports.changePassword = exports.loginUser = exports.activateUser = exports.createUser = void 0;
const dbConfig_1 = require("../database/dbConfig");
const mssql_1 = __importDefault(require("mssql"));
const fs_1 = __importDefault(require("fs"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const mailer_1 = require("../config/mailer");
const generateTokens_1 = require("../services/generateTokens");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
//FUNCION PARA ENERAR CODIGO DE ACTIVACION
function generateActivationCode(c = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < c; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}
//Register user
// export const createUser = async (req: Request, res: Response) => {
//   const { email, password, name, lastname } = req.body;
//   try {
//     if (!email || !password || !name || !lastname) {
//       console.log({ email, password, name, lastname });
//       return res.status(400).json({ message: 'Empty fields' });
//     }
//     // Conectarse a la base de datos
//     const pool = await connectDb();
//     if (!pool) {
//       return res
//         .status(500)
//         .json({ message: 'Error connecting to the database' });
//     }
//     //buscar si existe un usuario ya con ese email
//     const checkUserQuery = `SELECT * FROM Users WHERE email = @email`;
//     const userResult = await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .query(checkUserQuery);
//     if (userResult.recordset.length > 0) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const activationToken = uuidv4();
//     // Insertar el nuevo usuario en la tabla Users
//     const insertUserQuery = `
//   INSERT INTO Users (Email, Password, FirstName, LastName, RoleID, IsActive)
//   VALUES (@email, @password, @name , @lastname, 2, 0)
// `;
//     await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .input('password', sql.NVarChar, hashedPassword)
//       .input('name', sql.NVarChar, name)
//       .input('lastname', sql.NVarChar, lastname)
//       .query(insertUserQuery);
//     //GENERAR CODIGO DE ACTIVACION
//     const activationCode = generateActivationCode(6);
//     // Insertar el código de activación en la tabla ActivationCodes
//     const insertActivationCodeQuery = `
//       INSERT INTO ActivationCodes (UserID, Code, IsUsed)
//       VALUES ((SELECT UserID FROM Users WHERE Email = @email), @activationCode, 0)
//     `;
//     await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .input('activationCode', sql.NVarChar, activationCode)
//       .query(insertActivationCodeQuery);
//     //Send email to confirm use
//     const emailData = {
//       from: process.env.EMAILADMIN,
//       to: email,
//       subject: 'Confirma tu cuenta en MiApp',
//       html: `Bienvenido tu codigo para cormar la cuenta es este ${activationCode}`,
//     };
//     await sendEmail(emailData);
//     // const activationLink = `${process.env.API_BASE_URL}/user/activate/${activationToken}`;
//     // const mailOptions = {
//     //   from: process.env.EMAILADMIN,
//     //   to: newUser.email,
//     //   subject: 'Activa tu cuenta en MiApp',
//     //   html: `¡Bienvenido! Para activar tu cuenta, haz clic en el siguiente enlace: <a href="${activationLink}">${activationLink}</a>`,
//     // };
//     // transporter.sendMail(mailOptions, (error, info) => {
//     //   if (error) {
//     //     console.log(error);
//     //   } else {
//     //     console.log('Email sent: ' + info.response);
//     //   }
//     // });
//     return res.status(201).json({ message: 'User created' });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: 'Server internal error' });
//   }
// };
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, lastname } = req.body;
    try {
        if (!email || !password || !name || !lastname) {
            console.log({ email, password, name, lastname });
            return res.status(400).json({ message: 'Empty fields' });
        }
        // Buscar si existe un usuario ya con ese email
        const existingUser = yield prisma.user.findUnique({
            where: { Email: email },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const activationCode = generateActivationCode(6);
        // Insertar el nuevo usuario en la tabla Users
        const newUser = yield prisma.user.create({
            data: {
                Email: email,
                Password: hashedPassword,
                FirstName: name,
                LastName: lastname,
                Role: {
                    connect: { RoleID: 2 }, // Conectar al rol "CLIENT"
                },
                IsActive: false,
            },
        });
        // Insertar el código de activación en la tabla ActivationCodes
        yield prisma.activationCode.create({
            data: {
                Code: activationCode,
                IsUsed: false,
                User: {
                    connect: { UserID: newUser.UserID }, // Conectar al usuario recién creado
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
        yield (0, mailer_1.sendEmail)(emailData);
        return res.status(201).json({ message: 'User created' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server internal error' });
    }
});
exports.createUser = createUser;
//Activar cuenta con un codigo de activacion
// export const activateUser = async (req: Request, res: Response) => {
//   const { activationCode } = req.body;
//   if (!activationCode) {
//     return res
//       .status(400)
//       .json({ message: 'El codigo de activacion es obligatorio' });
//   }
//   try {
//     //Buscar si hay una activacion con este codigo
//     const pool = await connectDb();
//     if (!pool) {
//       return res
//         .status(500)
//         .json({ message: 'Error connecting to the database' });
//     }
//     const checkActivationCodeQuery = `SELECT * FROM ActivationCodes WHERE Code = @activationCode`;
//     const activationCodeResult = await pool
//       .request()
//       .input('activationCode', sql.NVarChar, activationCode)
//       .query(checkActivationCodeQuery);
//     if (activationCodeResult.recordset.length === 0) {
//       return res
//         .status(400)
//         .json({ message: 'El codigo de activacion es invalido' });
//     }
//     //Si hay una activacion con este codigo, actualizar el estado del usuario
//     const updateUserQuery = `UPDATE Users SET IsActive = 1 WHERE UserID = (SELECT UserID FROM ActivationCodes WHERE Code = @activationCode)`;
//     const updateUserResult = await pool
//       .request()
//       .input('activationCode', sql.NVarChar, activationCode)
//       .query(updateUserQuery);
//     if (updateUserResult.rowsAffected[0] === 0) {
//       return res
//         .status(400)
//         .json({ message: 'Error activando usuario intente nuevamente' });
//     }
//     //cambiar el estado de la activacion
//     const updateActivationCodeQuery = `UPDATE ActivationCodes SET IsUsed = 1 WHERE Code = @activationCode`;
//     const updateActivationCodeResult = await pool
//       .request()
//       .input('activationCode', sql.NVarChar, activationCode)
//       .query(updateActivationCodeQuery);
//     if (updateActivationCodeResult.rowsAffected[0] === 0) {
//       return res
//         .status(400)
//         .json({ message: 'Error activando usuario intente nuevamente' });
//     }
//     return res.status(200).json({ message: 'Usuario activado correctamente' });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: 'Error activando usuario intente nuevamente' });
//   }
// };
const activateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { activationCode } = req.body;
    if (!activationCode) {
        return res
            .status(400)
            .json({ message: 'El código de activación es obligatorio' });
    }
    try {
        // Buscar si hay una activación con este código
        const activation = yield prisma.activationCode.findFirst({
            where: {
                Code: activationCode,
            },
        });
        if (!activation) {
            return res
                .status(400)
                .json({ message: 'El código de activación es inválido' });
        }
        // Si hay una activación con este código, actualizar el estado del usuario
        const updateUser = yield prisma.user.update({
            where: {
                UserID: activation.UserID,
            },
            data: {
                IsActive: true,
            },
        });
        if (!updateUser) {
            return res
                .status(400)
                .json({ message: 'Error activando usuario, inténtelo nuevamente' });
        }
        // Cambiar el estado de la activación
        const updateActivationCode = yield prisma.activationCode.update({
            where: {
                CodeID: activation.CodeID,
            },
            data: {
                IsUsed: true,
            },
        });
        if (!updateActivationCode) {
            return res
                .status(400)
                .json({ message: 'Error activando usuario, inténtelo nuevamente' });
        }
        return res.status(200).json({ message: 'Usuario activado correctamente' });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'Error activando usuario, inténtelo nuevamente' });
    }
    finally {
        yield prisma.$disconnect(); // Cerrar la conexión de Prisma cuando hayas terminado
    }
});
exports.activateUser = activateUser;
//Login User
// export const loginUser = async (req: Request, res: Response) => {
//   const { email, password } = req.body;
//   try {
//     if (!email) {
//       return res.status(400).json({ message: 'Email field empty' });
//     }
//     if (!password) {
//       return res.status(400).json({ message: 'Password field empty' });
//     }
//     //encontrar el usuario
//     const pool = await connectDb();
//     if (!pool) {
//       return res
//         .status(500)
//         .json({ message: 'Error connecting to the database' });
//     }
//     const checkUserQuery = `SELECT UserID, IsActive, Password FROM Users WHERE Email = @email`;
//     const userResult = await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .query(checkUserQuery);
//     console.log(userResult);
//     if (userResult.recordset.length === 0) {
//       return res.status(400).json({ message: 'Usuario no encontrado' });
//     }
//     if (userResult.recordset[0].IsActive === false) {
//       return res.status(400).json({
//         message: 'El usuario no esta activado revisa tu casilla de email',
//       });
//     }
//     const userPassword = userResult.recordset[0].Password;
//     const passwordMatch = await bcrypt.compare(password, userPassword);
//     if (!passwordMatch) {
//       return res
//         .status(400)
//         .json({ status: 'error', message: 'Email o contraseña incorrectos' });
//     }
//     const userId = userResult.recordset[0].UserID;
//     const Token = generateToken(userId);
//     return res.status(200).json({
//       Token,
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ status: 'error', message: 'Something went wrong' });
//   }
// };
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email field empty' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Password field empty' });
        }
        // Encontrar el usuario en la base de datos utilizando Prisma
        const user = yield prisma.user.findUnique({
            where: { Email: email },
            select: { UserID: true, IsActive: true, Password: true },
        });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        if (user.IsActive === false) {
            return res.status(400).json({
                message: 'El usuario no está activado, revisa tu casilla de email',
            });
        }
        const userPassword = user.Password;
        const passwordMatch = yield bcrypt_1.default.compare(password, userPassword);
        if (!passwordMatch) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Email o contraseña incorrectos' });
        }
        const userId = user.UserID;
        const Token = (0, generateTokens_1.generateToken)(userId);
        return res.status(200).json({
            Token,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ status: 'error', message: 'Something went wrong' });
    }
});
exports.loginUser = loginUser;
//CAMBIAR CONTRASEÑA
// export const changePassword = async (req: Request, res: Response) => {
//   const { userId, oldPassword, newPassword } = req.body;
//   if (oldPassword === newPassword) {
//     return res.status(400).json({
//       message: 'La nueva contraseña no puede ser igual a la anterior',
//     });
//   }
//   if (!userId || !oldPassword || !newPassword) {
//     return res.status(400).json({ message: 'Faltan datos' });
//   }
//   try {
//     const pool = await connectDb();
//     if (!pool) {
//       return res
//         .status(500)
//         .json({ message: 'Error connecting to the database' });
//     }
//     //buscar el usuario por id y traer si contraseña
//     const checkUserQuery = `SELECT UserID, Password FROM Users WHERE UserID = @userId`;
//     const userResult = await pool
//       .request()
//       .input('userId', sql.Int, userId)
//       .query(checkUserQuery);
//     if (userResult.recordset.length === 0) {
//       return res.status(400).json({ message: 'Usuario no encontrado' });
//     }
//     //si la contraseña coinciden seguir
//     const userPassword = userResult.recordset[0].Password;
//     const passwordMatch = await bcrypt.compare(oldPassword, userPassword);
//     if (!passwordMatch) {
//       return res
//         .status(400)
//         .json({ status: 'error', message: 'Contraseña antigua incorrecta' });
//     }
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     const updateUserQuery = `UPDATE Users SET Password = @hashedPassword WHERE UserID = @userId`;
//     const updateUserResult = await pool
//       .request()
//       .input('userId', sql.Int, userId)
//       .input('hashedPassword', sql.NVarChar, hashedPassword)
//       .query(updateUserQuery);
//     if (updateUserResult.rowsAffected[0] === 0) {
//       return res
//         .status(400)
//         .json({ message: 'Error al cambiar contraseña intente nuevamente' });
//     }
//     return res
//       .status(200)
//       .json({ message: 'Contraseña cambiada correctamente' });
//     //guardar nueva contraseña
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: 'Error al cambiar contraseña intente nuevamente' });
//   }
// };
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma.user.findUnique({
            where: { UserID: userId },
            select: { UserID: true, Password: true },
        });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        // Comprobar si la contraseña antigua coincide
        const passwordMatch = yield bcrypt_1.default.compare(oldPassword, user.Password);
        if (!passwordMatch) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Contraseña antigua incorrecta' });
        }
        // Generar el hash de la nueva contraseña
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Actualizar la contraseña del usuario utilizando Prisma
        yield prisma.user.update({
            where: { UserID: userId },
            data: { Password: hashedPassword },
        });
        return res
            .status(200)
            .json({ message: 'Contraseña cambiada correctamente' });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Error al cambiar contraseña, inténtelo de nuevo' });
    }
});
exports.changePassword = changePassword;
//SOLICITAR CAMBIAR CONTRASEÑA
// export const requestChangePassword = async (req: Request, res: Response) => {
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ message: 'El email es obligatorio' });
//   }
//   try {
//     const pool = await connectDb();
//     if (!pool) {
//       return res
//         .status(500)
//         .json({ message: 'Error connecting to the database' });
//     }
//     //buscar el usuario por email
//     const checkUserQuery = `SELECT UserID, Email FROM Users WHERE Email = @email`;
//     const userResult = await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .query(checkUserQuery);
//     if (userResult.recordset.length === 0) {
//       return res.status(400).json({ message: 'Usuario no encontrado' });
//     }
//     //Eliminar codigos de activacion anteriores del mismo usuario
//     const deleteActivationTokenQuery = `DELETE FROM ActivationCodes WHERE UserID = (SELECT UserID FROM Users WHERE Email = @email)`;
//     await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .query(deleteActivationTokenQuery);
//     //generar codigo de cambio de contraseña
//     const activationToken = uuidv4();
//     // Insertar el código de activación en la tabla ActivationCodes
//     const insertActivationTokenQuery = `
//       INSERT INTO ActivationCodes (UserID, Code, IsUsed)
//       VALUES ((SELECT UserID FROM Users WHERE Email = @email), @activationToken, 0)
//     `;
//     await pool
//       .request()
//       .input('email', sql.NVarChar, email)
//       .input('activationToken', sql.NVarChar, activationToken)
//       .query(insertActivationTokenQuery);
//     //Send email to confirm use
//     const emailData = {
//       from: process.env.EMAILADMIN,
//       to: email,
//       subject: 'Recuperar contraseña',
//       html: `<span>Hace clic en el siguiente vinculo <a href="${process.env.FRONTEND_URL}/change-password/${activationToken}">Clic aqui</a> para seguir los pasos y recuperar tu contraseña</span>`,
//     };
//     await sendEmail(emailData);
//     return res.status(200).json({ message: 'Correo enviado' });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: 'Error al cambiar contraseña intente nuevamente' });
//   }
// };
const requestChangePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'El email es obligatorio' });
    }
    try {
        // Buscar al usuario por email utilizando Prisma
        const user = yield prisma.user.findUnique({
            where: { Email: email },
            select: { UserID: true, Email: true },
        });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        // Eliminar códigos de activación anteriores del mismo usuario utilizando Prisma
        yield prisma.activationCode.deleteMany({
            where: { UserID: user.UserID },
        });
        // Generar código de cambio de contraseña
        const activationToken = (0, uuid_1.v4)();
        // Insertar el código de activación en la tabla ActivationCodes utilizando Prisma
        yield prisma.activationCode.create({
            data: {
                Code: activationToken,
                IsUsed: false,
                User: { connect: { UserID: user.UserID } },
            },
        });
        // Enviar correo electrónico para recuperar contraseña
        const emailData = {
            from: process.env.EMAILADMIN,
            to: email,
            subject: 'Recuperar contraseña',
            html: `<span>Haz clic en el siguiente vínculo <a href="${process.env.FRONTEND_URL}/change-password/${activationToken}">Clic aquí</a> para seguir los pasos y recuperar tu contraseña</span>`,
        };
        yield (0, mailer_1.sendEmail)(emailData);
        return res.status(200).json({ message: 'Correo enviado' });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Error al cambiar contraseña, inténtelo de nuevo' });
    }
});
exports.requestChangePassword = requestChangePassword;
//GUARDAR NUEVA CONTRASEñA
const saveNewPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { activationToken, newPassword } = req.body;
    if (!activationToken || !newPassword) {
        return res.status(400).json({ message: 'Faltan datos' });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        //buscar el usuario por codigo de activacion
        const checkActivationTokenQuery = `SELECT UserID, Code FROM ActivationCodes WHERE Code = @activationToken`;
        const activationTokenResult = yield pool
            .request()
            .input('activationToken', mssql_1.default.NVarChar, activationToken)
            .query(checkActivationTokenQuery);
        if (activationTokenResult.recordset.length === 0) {
            return res
                .status(400)
                .json({ message: 'CÓDIGO DE ACTIVACIÓN INCORRECTO' });
        }
        //buscar el usuario por id y cambiar su contraseña por la nueva
        const userId = activationTokenResult.recordset[0].UserID;
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        const updateUserQuery = `UPDATE Users SET Password = @hashedPassword WHERE UserID = @userId`;
        const updateUserResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .input('hashedPassword', mssql_1.default.NVarChar, hashedPassword)
            .query(updateUserQuery);
        if (updateUserResult.rowsAffected[0] === 0) {
            return res
                .status(400)
                .json({ message: 'Error al cambiar contraseña intente nuevamente' });
        }
        //eliminar codigo de activacion
        const deleteActivationTokenQuery = `DELETE FROM ActivationCodes WHERE UserID = @userId`;
        yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .query(deleteActivationTokenQuery);
        return res
            .status(200)
            .json({ message: 'Contraseña cambiada correctamente' });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Error al cambiar contraseña intente nuevamente' });
    }
});
exports.saveNewPassword = saveNewPassword;
//OBETENER EL ROL DEL USUARIO LOGUEADO
const getUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    if (!userId) {
        return res.status(401).json({ message: 'EL USUARIO NO ESTA LOGUEADO' });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        const getUserRoleQuery = `SELECT Users.RoleID, Roles.RoleName, Roles.RoleValue FROM Users INNER JOIN Roles ON Users.RoleID = Roles.RoleID WHERE UserID = @userId`;
        const userRoleResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .query(getUserRoleQuery);
        if (userRoleResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        return res.status(200).json({
            roleId: userRoleResult.recordset[0].RoleID,
            roleName: userRoleResult.recordset[0].RoleName,
            roleValue: userRoleResult.recordset[0].RoleValue,
        });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: 'Error al obtener el rol del usuario' });
    }
});
exports.getUserRole = getUserRole;
//EDITAR USUARIO
const editUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name, lastname, address, phone, birthDate, hireDate } = req.body;
        console.log(req.body);
        //conectarse a la base de datos
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        //obtener el datos del usuario por id
        const getUserQuery = `SELECT UserID,FirstName, LastName, Address, Phone, BirthDate, HireDate, ProfileImage FROM Users WHERE UserID = @userId`;
        const userResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .query(getUserQuery);
        if (userResult.recordset.length === 0) {
            console.log(userId);
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        //comparar si hubo cambios en los datos o no vinieron vacios y si hubo cambios en alguno de los datos
        const updatedFields = [];
        const updateParams = {};
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
            const updateUserResult = yield pool
                .request()
                .input('userId', mssql_1.default.Int, userId)
                .input('name', mssql_1.default.NVarChar, updateParams.FirstName)
                .input('lastname', mssql_1.default.NVarChar, updateParams.LastName)
                .input('address', mssql_1.default.NVarChar, updateParams.Address)
                .input('phone', mssql_1.default.NVarChar, updateParams.Phone)
                .input('birthDate', mssql_1.default.Date, updateParams.BirthDate)
                .input('hireDate', mssql_1.default.Date, updateParams.HireDate)
                .query(updateUserQuery);
            if (updateUserResult.rowsAffected[0] === 0) {
                return res.status(400).json({
                    message: 'Error al actualizar el usuario intente nuevamente',
                });
            }
        }
        //procesar la foto de perfil
        return res.status(200).json({ message: 'Usuario actualizado con éxito.' });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: 'Error al actualizar el usuario intente nuevamente' });
    }
});
exports.editUser = editUser;
//GUARDAR AVATAR
const saveImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        //obtener el datos del usuario por id
        const getUserQuery = `SELECT UserID,ProfileImage FROM Users WHERE UserID = @userId`;
        const userResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .query(getUserQuery);
        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        // Ruta de la imagen anterior
        const oldImagePath = userResult.recordset[0].ProfileImage;
        // Eliminar la imagen anterior si existe
        if (oldImagePath) {
            //extrar el nombre del fichero
            const oldFileName = `uploads/avatars/${path_1.default.basename(oldImagePath)}`;
            //eliminarlo
            if (fs_1.default.existsSync(oldFileName)) {
                fs_1.default.unlinkSync(oldFileName);
            }
        }
        const fileName = `avatar-${Date.now()}-${userResult.recordset[0].UserID}.webp`;
        const imagePath = `uploads/avatars/${fileName}`; // Ruta donde guardar la imagen
        // Utiliza Sharp para redimensionar y convertir la foto de perfil a WebP
        (0, sharp_1.default)(req.file.path)
            .resize({ width: 200 }) // Ajusta el tamaño a tus necesidades
            .webp()
            .toFile(imagePath, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Error al procesar la foto de perfil.' });
            }
            // Elimina el archivo temporal de la carga
            fs_1.default.unlinkSync(req.file.path);
            // Actualiza la foto de perfil del usuario
            //preparar el la ruta del endpoint de la imagen
            const imageUrl = `${process.env.BASE_URL}/user/image/${fileName}`;
            const updateImageUrlQuery = `UPDATE Users SET ProfileImage = @profileImage WHERE UserID = @userId`;
            const updateImageUrlResult = yield pool
                .request()
                .input('userId', mssql_1.default.Int, userId)
                .input('profileImage', mssql_1.default.NVarChar, imageUrl)
                .query(updateImageUrlQuery);
            if (updateImageUrlResult.rowsAffected[0] === 0) {
                return res.status(400).json({
                    message: 'Error al actualizar el usuario intente nuevamente',
                });
            }
            // Si llegaste hasta aquí, la actualización y procesamiento de la foto fueron exitosos
        }));
        return res.status(200).json({ message: 'Imagen actualizada con éxito.' });
    }
    catch (error) {
        fs_1.default.unlinkSync(req.file.path);
        return res
            .status(500)
            .json({ message: 'Error al procesar la foto de perfil.' });
    }
});
exports.saveImage = saveImage;
//OBTENER AVATAR
const image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let fileName = req.params.fileName;
    let ruta_fisica = `./uploads/avatars/${fileName}`;
    fs_1.default.stat(ruta_fisica, (error, exist) => {
        if (exist) {
            return res.sendFile(path_1.default.resolve(ruta_fisica));
        }
        else {
            return res.status(404).json({
                status: 'error',
                message: 'La imagen no existe',
            });
        }
    });
});
exports.image = image;
//OBTENER DATOS DEL USUARIO EN GENERAL
const getUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params.userId ? req.params : req.body;
    if (!userId) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        const getUserQuery = `SELECT UserID, FirstName, LastName, Email, Address, Phone, BirthDate, HireDate, ProfileImage, IsActive FROM Users WHERE UserID = @userId`;
        const userResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los datos' });
    }
});
exports.getUserData = getUserData;
//EDITAR USUARIO SIENDO ADMIN
const adminEditUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, userIdToUpdate, name, lastname, email, address, phone, birthDate, hireDate, isActive, roleId, } = req.body;
    if (userId) {
        res
            .status(401)
            .json({ message: 'No tienes permiso para realizar esta acción' });
    }
    if (userIdToUpdate) {
        res.status(400).json({ message: 'NNo hay un usuario para editar' });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res
                .status(500)
                .json({ message: 'Error connecting to the database' });
        }
        //revisar si el usuario que esta haciuendo esto tiene permiso osea es admin
        const getUserRoleQuery = `SELECT Users.RoleID, Roles.RoleValue FROM Users INNER JOIN Roles ON Users.RoleID = Roles.RoleID WHERE UserID = @userId`;
        const userRoleResult = yield pool
            .request()
            .input('userId', mssql_1.default.Int, userId)
            .query(getUserRoleQuery);
        if (userRoleResult.recordset[0].RoleValue !== 'ADMIN') {
            return res
                .status(401)
                .json({ message: 'No tienes permiso para realizar esta acción' });
        }
        //obtener el datos del usuario por id
        const getUserQuery = `SELECT UserID,FirstName, LastName, Address, Phone, BirthDate, HireDate, ProfileImage, IsActive, RoleID FROM Users WHERE UserID = @userIdToUpdate`;
        const userResult = yield pool
            .request()
            .input('userIdToUpdate', mssql_1.default.Int, userIdToUpdate)
            .query(getUserQuery);
        if (userResult.recordset.length === 0) {
            console.log(userId);
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }
        //comparar si hubo cambios en los datos o no vinieron vacios y si hubo cambios en alguno de los datos
        const updatedFields = [];
        const updateParams = {};
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
            const updateUserResult = yield pool
                .request()
                .input('userId', mssql_1.default.Int, userId)
                .input('name', mssql_1.default.NVarChar, updateParams.FirstName)
                .input('lastname', mssql_1.default.NVarChar, updateParams.LastName)
                .input('address', mssql_1.default.NVarChar, updateParams.Address)
                .input('phone', mssql_1.default.NVarChar, updateParams.Phone)
                .input('birthDate', mssql_1.default.Date, updateParams.BirthDate)
                .input('hireDate', mssql_1.default.Date, updateParams.HireDate)
                .input('isActive', mssql_1.default.Bit, updateParams.IsActive)
                .input('roleId', mssql_1.default.Int, updateParams.RoleID)
                .input('email', mssql_1.default.NVarChar, updateParams.Email)
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
});
exports.adminEditUser = adminEditUser;
