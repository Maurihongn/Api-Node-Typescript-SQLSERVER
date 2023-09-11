import { Request, Response } from 'express';
import { connectDb } from '../database/dbConfig';
import sql, { pool } from 'mssql';
import fs from 'fs';
import bcrypt from 'bcrypt';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../config/mailer';
import { generateToken } from '../services/generateTokens';
import { checkAdminPermission } from '../services/authService';

//CREAR UN ITEM
export const createItem = async (req: Request, res: Response) => {
  const { userId, name, price, isActive, description, categoryId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'No estas autorizado' });
  }

  if (!name || !price || !isActive || !description || !categoryId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(400).json({ message: 'No estas autorizado' });
    }

    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    const createItemQuery = `INSERT INTO Items (Name, Price, IsActive, Description, CategoryId) VALUES (@name, @price, @isActive, @description, @categoryId);
        SELECT SCOPE_IDENTITY() AS InsertedItemId;`;
    const createItemResult = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('price', sql.Float, price)
      .input('isActive', sql.Bit, isActive)
      .input('description', sql.NVarChar, description)
      .input('categoryId', sql.Int, categoryId)
      .query(createItemQuery);

    if (createItemResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al crear el item intente nuevamente' });
    }

    const insertedItemId = createItemResult.recordset[0].InsertedItemId;

    if (req.file) {
      const fileName = `item-${Date.now()}-${insertedItemId}.webp`;
      const imagePath = `uploads/items/${fileName}`; // Ruta donde guardar la imagen

      // Utiliza Sharp para redimensionar y convertir la foto de perfil a WebP
      sharp(req.file.path)
        .resize({ width: 200 }) // Ajusta el tamaño a tus necesidades
        .webp()
        .toFile(imagePath, async (err) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Error al procesar la foto del item.' });
          }

          // Elimina el archivo temporal de la carga
          fs.unlinkSync(req.file!.path);

          //preparar el la ruta del endpoint de la imagen

          const imageUrl = `${process.env.BASE_URL}/item/image/${fileName}`;

          const updateImageUrlQuery = `UPDATE Items SET ItemImage = @itemImage WHERE ItemID = @itemId`;
          const updateImageUrlResult = await pool
            .request()
            .input('itemId', sql.Int, insertedItemId)
            .input('itemImage', sql.NVarChar, imageUrl)
            .query(updateImageUrlQuery);

          if (updateImageUrlResult.rowsAffected[0] === 0) {
            return res.status(400).json({
              message: 'Error al actualizar el item intente nuevamente',
            });
          }

          // Si llegaste hasta aquí, la actualización y procesamiento de la foto fueron exitosos
        });
    }

    return res.status(200).json({ message: 'Item creado correctamente' });
  } catch (error) {
    console.log(error);
    fs.unlinkSync(req.file!.path);
    return res.status(500).json({ message: 'Error al crear el item' });
  }
};

//MOSTRAR IMAGEN
export const image = async (req: Request, res: Response) => {
  let fileName = req.params.fileName;
  let ruta_fisica = `./uploads/items/${fileName}`;

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

//CARGAR IMAGEN A UN ITEM
export const uploadImage = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }
  if (!req.file || !itemId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(400).json({ message: 'No estas autorizado' });
    }

    //conectarse a la base de datos
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    //obtener el datos del usuario por id
    const getItemQuery = `SELECT ItemID, ItemImage FROM Items WHERE ItemID = @itemId`;
    const itemResult = await pool
      .request()
      .input('itemId', sql.Int, itemId)
      .query(getItemQuery);

    if (itemResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Item no encontrado' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = itemResult.recordset[0].ItemImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      //extrar el nombre del fichero
      const oldFileName = `uploads/items/${path.basename(oldImagePath)}`;
      //eliminarlo
      fs.unlinkSync(oldFileName);
    }

    const fileName = `item-${Date.now()}-${
      itemResult.recordset[0].ItemID
    }.webp`;
    const imagePath = `uploads/items/${fileName}`; // Ruta donde guardar la imagen

    // Utiliza Sharp para redimensionar y convertir la foto de perfil a WebP
    sharp(req.file.path)
      .resize({ width: 200 }) // Ajusta el tamaño a tus necesidades
      .webp()
      .toFile(imagePath, async (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: 'Error al procesar la foto del Item.' });
        }

        // Elimina el archivo temporal de la carga
        fs.unlinkSync(req.file!.path);

        // Actualiza la foto de perfil del usuario

        //preparar el la ruta del endpoint de la imagen

        const imageUrl = `${process.env.BASE_URL}/item/image/${fileName}`;

        const updateImageUrlQuery = `UPDATE Items SET ItemImage = @itemImage WHERE ItemID = @itemId`;
        const updateImageUrlResult = await pool
          .request()
          .input('itemId', sql.Int, itemId)
          .input('itemImage', sql.NVarChar, imageUrl)
          .query(updateImageUrlQuery);

        if (updateImageUrlResult.rowsAffected[0] === 0) {
          return res.status(400).json({
            message: 'Error al actualizar el item intente nuevamente',
          });
        }

        // Si llegaste hasta aquí, la actualización y procesamiento de la foto fueron exitosos
      });
    return res.status(200).json({ message: 'Imagen actualizada con éxito.' });
  } catch (error) {
    fs.unlinkSync(req.file!.path);
    return res
      .status(500)
      .json({ message: 'Error al procesar la foto de perfil.' });
  }
};

//OBTENER ITEMS
export const getItems = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { search = '', page = 1, limit = 10 } = req.query;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }

  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    // Parsea los valores de page y limit a números enteros
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Calcula el número de elementos a omitir para la paginación
    const offset = (pageNumber - 1) * limitNumber;

    //contruye la consulta sql para obtener los items
    let getItemsQuery = `SELECT i.ItemID, i.Name, i.Price, i.Description, i.ItemImage, i.IsActive, i.CreationDate, c.Name FROM Items i INNER JOIN Categories c ON i.CategoryID ${
      typeof search === 'string' && search.trim() !== ''
        ? `WHERE c.Name LIKE @search`
        : ''
    }`;

    const queryParams: { [key: string]: any } = {};

    if (typeof search === 'string' && search.trim() !== '') {
      queryParams.search = `%${search}%`;
    }

    // Calcula el total de items
    const totalItemsQuery = `
      SELECT COUNT(*) AS TotalItems
      FROM Items i
      INNER JOIN Categories c ON i.CategoryId = c.CategoryId
      ${
        typeof search === 'string' && search.trim() !== ''
          ? 'WHERE c.Name LIKE @search'
          : ''
      }
    `;

    const totalItemsResult = await pool
      .request()
      .input('search', sql.NVarChar, `%${search}%`)
      .query(totalItemsQuery);

    if (totalItemsResult.recordset.length === 0) {
      return res.status(400).json({ message: 'No hay items cargados' });
    }

    const totalItems = totalItemsResult.recordset[0].TotalItems;

    const totalPages = Math.ceil(totalItems / limitNumber);

    //agregar paginacion y ordenamiento y limite

    getItemsQuery += `
      ORDER BY i.ItemID ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY;
    `;

    queryParams.offset = offset;
    queryParams.limit = limitNumber;

    console.log(offset);
    console.log(limitNumber);
    console.log(getItemsQuery);
    console.log(queryParams);

    const itemsResult = await pool
      .request()
      .input('search', sql.NVarChar, `%${search}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limitNumber)
      .query(getItemsQuery);

    if (itemsResult.recordset.length === 0) {
      return res.status(400).json({ message: 'No se encontraron items' });
    }

    return res
      .status(200)
      .json({ items: itemsResult.recordset, totalPages, totalItems, page });

    // Si search no está vacío, agrega la condición de búsqueda
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error al obtener los items' });
  }
};

//OBTENER POR ID

//EDITAR ITEM

//ELIMINAR ITEM
