import bcrypt from 'bcrypt';
import sharp from 'sharp';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDb } from '../database/dbConfig';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';

//OBTENER TODAS LAS CATEGORIAS
export const getCategories = async (req: Request, res: Response) => {
  try {
    const pool = await connectDb();
    if (!pool) {
      return res.status(500).json({
        message: 'Error al conectar con la base de datos',
      });
    }

    const getCategoriesQuery = `SELECT * FROM Categories`;
    const categoriesResult = await pool.request().query(getCategoriesQuery);

    if (categoriesResult.recordset.length === 0) {
      return res.status(204).json({
        message: 'No hay categorias',
      });
    }

    const categories = categoriesResult.recordset;
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener las categorias',
    });
  }
};

//OBTENER UNA CATEGORIA
export const getCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    return res.status(400).json({
      message: 'Faltan datos',
    });
  }

  try {
    const pool = await connectDb();
    if (!pool) {
      return res.status(500).json({
        message: 'Error al conectar con la base de datos',
      });
    }

    const getCategoryQuery = `SELECT * FROM Categories WHERE CategoryID = @categoryId`;
    const categoryResult = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(getCategoryQuery);

    if (categoryResult.recordset.length === 0) {
      return res.status(400).json({
        message: 'No existe la categoria',
      });
    }

    const categorie = categoryResult.recordset[0];
    return res.status(200).json(categorie);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la categoria',
    });
  }
};

//GUARDAR UNA CATEGORIA

export const saveCategory = async (req: Request, res: Response) => {
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
    const pool = await connectDb();
    if (!pool) {
      return res.status(500).json({
        message: 'Error al conectar con la base de datos',
      });
    }

    //tengo que revisar si el usuario que esta intentando hacer esto es admin

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

    //tengo que revisar si ya existe una categoria con ese nombre
    const checkCategoryQuery = `SELECT * FROM Categories WHERE Name = @name`;
    const checkCategoryResult = await pool
      .request()
      .input('name', sql.VarChar, name)
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
    const saveCategoryResult = await pool
      .request()
      .input('name', sql.VarChar, name)
      .input('description', sql.VarChar, description)
      .input('creationDate', sql.Date, creationDate)
      .query(saveCategoryQuery);

    if (saveCategoryResult.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: 'Error al crear la categoria intente nuevamente',
      });
    }

    return res.status(200).json({
      message: 'Categoria creada con éxito',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al crear la categoria, intente nuevamente',
    });
  }
};

//EDITAR UNA CATEGORIA
export const editCategory = async (req: Request, res: Response) => {
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
    const pool = await connectDb();
    if (!pool) {
      return res.status(500).json({
        message: 'Error al conectar con la base de datos',
      });
    }

    //tengo que revisar si el usuario que esta intentando hacer esto es admin

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

    //Guardar la categoria a editar
    const editCategoryQuery = `UPDATE Categories SET Name = @name, Description = @description, IsAvtive = @isActive  WHERE CategoryID = @categoryId`;
    const editCategoryResult = await pool
      .request()
      .input('name', sql.VarChar, name)
      .input('description', sql.VarChar, description)
      .input('categoryId', sql.Int, categoryId)
      .input('isActive', sql.Bit, isActive)
      .query(editCategoryQuery);

    if (editCategoryResult.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: 'Error al editar la categoria intente nuevamente',
      });
    }

    return res.status(200).json({
      message: 'Categoria editada con éxito',
    });
  } catch (error) {
    return res.status(500).json({});
  }
};

//ELIMINAR UNA CATEGORIA
export const deleteCategory = async (req: Request, res: Response) => {
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
    const pool = await connectDb();
    if (!pool) {
      return res.status(500).json({
        message: 'Error al conectar con la base de datos',
      });
    }

    //tengo que revisar si el usuario que esta intentando hacer esto es admin

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

    const deleteCategoryQuery = `DELETE FROM Categories WHERE CategoryID = @categoryId`;
    const deleteCategoryResult = await pool
      .request()
      .input('categoryId', sql.Int, categoryId)
      .query(deleteCategoryQuery);
    if (deleteCategoryResult.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: 'Error al eliminar la categoria intente nuevamente',
      });
    }

    return res.status(200).json({
      message: 'Categoria eliminada con éxito',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al eliminar la categoria intente nuevamente',
    });
  }
};
