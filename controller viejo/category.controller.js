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
exports.deleteCategory = exports.editCategory = exports.saveCategory = exports.getCategory = exports.getCategories = void 0;
const dbConfig_1 = require("../database/dbConfig");
const mssql_1 = __importDefault(require("mssql"));
//OBTENER TODAS LAS CATEGORIAS
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res.status(500).json({
                message: 'Error al conectar con la base de datos',
            });
        }
        const getCategoriesQuery = `SELECT * FROM Categories`;
        const categoriesResult = yield pool.request().query(getCategoriesQuery);
        if (categoriesResult.recordset.length === 0) {
            return res.status(204).json({
                message: 'No hay categorias',
            });
        }
        const categories = categoriesResult.recordset;
        return res.status(200).json(categories);
    }
    catch (error) {
        return res.status(500).json({
            message: 'Error al obtener las categorias',
        });
    }
});
exports.getCategories = getCategories;
//OBTENER UNA CATEGORIA
const getCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    if (!categoryId) {
        return res.status(400).json({
            message: 'Faltan datos',
        });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res.status(500).json({
                message: 'Error al conectar con la base de datos',
            });
        }
        const getCategoryQuery = `SELECT * FROM Categories WHERE CategoryID = @categoryId`;
        const categoryResult = yield pool
            .request()
            .input('categoryId', mssql_1.default.Int, categoryId)
            .query(getCategoryQuery);
        if (categoryResult.recordset.length === 0) {
            return res.status(400).json({
                message: 'No existe la categoria',
            });
        }
        const categorie = categoryResult.recordset[0];
        return res.status(200).json(categorie);
    }
    catch (error) {
        return res.status(500).json({
            message: 'Error al obtener la categoria',
        });
    }
});
exports.getCategory = getCategory;
//GUARDAR UNA CATEGORIA
const saveCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name, description } = req.body;
    if (!userId) {
        return res.status(401).json({
            message: 'No estas autorizado',
        });
    }
    if (!name || !description) {
        return res.status(400).json({
            message: 'Faltan datos',
        });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res.status(500).json({
                message: 'Error al conectar con la base de datos',
            });
        }
        //tengo que revisar si el usuario que esta intentando hacer esto es admin
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
        //tengo que revisar si ya existe una categoria con ese nombre
        const checkCategoryQuery = `SELECT * FROM Categories WHERE Name = @name`;
        const checkCategoryResult = yield pool
            .request()
            .input('name', mssql_1.default.VarChar, name)
            .query(checkCategoryQuery);
        if (checkCategoryResult.recordset.length > 0) {
            return res.status(400).json({
                message: 'Ya existe una categoria con ese nombre',
            });
        }
        const creationDate = new Date();
        //tengo que agregar la fecha de creacion en la query
        const saveCategoryQuery = `INSERT INTO Categories (Name, Description, CreationDate, IsActive)
    VALUES (@name, @description, @creationDate, 1)`;
        const saveCategoryResult = yield pool
            .request()
            .input('name', mssql_1.default.VarChar, name)
            .input('description', mssql_1.default.VarChar, description)
            .input('creationDate', mssql_1.default.Date, creationDate)
            .query(saveCategoryQuery);
        if (saveCategoryResult.rowsAffected[0] === 0) {
            return res.status(400).json({
                message: 'Error al crear la categoria intente nuevamente',
            });
        }
        return res.status(200).json({
            message: 'Categoria creada con éxito',
        });
    }
    catch (error) {
        return res.status(500).json({
            message: 'Error al crear la categoria, intente nuevamente',
        });
    }
});
exports.saveCategory = saveCategory;
//EDITAR UNA CATEGORIA
const editCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name, description, isActive } = req.body;
    const { categoryId } = req.params;
    if (!userId) {
        return res.status(401).json({
            message: 'No estas autorizado',
        });
    }
    if (!categoryId || !name || !description) {
        return res.status(400).json({
            message: 'Faltan datos',
        });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res.status(500).json({
                message: 'Error al conectar con la base de datos',
            });
        }
        //tengo que revisar si el usuario que esta intentando hacer esto es admin
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
        //Guardar la categoria a editar
        const editCategoryQuery = `UPDATE Categories SET Name = @name, Description = @description, IsAvtive = @isActive  WHERE CategoryID = @categoryId`;
        const editCategoryResult = yield pool
            .request()
            .input('name', mssql_1.default.VarChar, name)
            .input('description', mssql_1.default.VarChar, description)
            .input('categoryId', mssql_1.default.Int, categoryId)
            .input('isActive', mssql_1.default.Bit, isActive)
            .query(editCategoryQuery);
        if (editCategoryResult.rowsAffected[0] === 0) {
            return res.status(400).json({
                message: 'Error al editar la categoria intente nuevamente',
            });
        }
        return res.status(200).json({
            message: 'Categoria editada con éxito',
        });
    }
    catch (error) {
        return res.status(500).json({});
    }
});
exports.editCategory = editCategory;
//ELIMINAR UNA CATEGORIA
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const { categoryId } = req.params;
    if (!userId) {
        return res.status(401).json({
            message: 'No estas autorizado',
        });
    }
    if (!categoryId) {
        return res.status(400).json({
            message: 'Faltan datos',
        });
    }
    try {
        const pool = yield (0, dbConfig_1.connectDb)();
        if (!pool) {
            return res.status(500).json({
                message: 'Error al conectar con la base de datos',
            });
        }
        //tengo que revisar si el usuario que esta intentando hacer esto es admin
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
        const deleteCategoryQuery = `DELETE FROM Categories WHERE CategoryID = @categoryId`;
        const deleteCategoryResult = yield pool
            .request()
            .input('categoryId', mssql_1.default.Int, categoryId)
            .query(deleteCategoryQuery);
        if (deleteCategoryResult.rowsAffected[0] === 0) {
            return res.status(400).json({
                message: 'Error al eliminar la categoria intente nuevamente',
            });
        }
        return res.status(200).json({
            message: 'Categoria eliminada con éxito',
        });
    }
    catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar la categoria intente nuevamente',
        });
    }
});
exports.deleteCategory = deleteCategory;
