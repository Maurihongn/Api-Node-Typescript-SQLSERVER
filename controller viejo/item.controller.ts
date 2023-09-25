import { Request, Response } from 'express';
import { connectDb } from '../database/dbConfig';
import sql, { pool } from 'mssql';
import fs from 'fs';
import { checkAdminPermission } from '../services/authService';
import sharp from 'sharp';
import path from 'path';

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
      .input('price', sql.Decimal, price)
      .input('isActive', sql.Bit, isActive)
      .input('description', sql.NVarChar, description)
      .input('categoryId', sql.Int, categoryId)
      .query(createItemQuery);

    if (createItemResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al crear el item intente nuevamente' });
    }

    if (!req.file) {
      return res.status(200).json({
        message: 'Item creado correctamente, agregale una foto',
      });
    }
    console.log(createItemResult.recordset[0]);
    const insertedItemId = createItemResult.recordset[0].InsertedItemId;

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
      if (fs.existsSync(oldFileName)) {
        fs.unlinkSync(oldFileName);
      }
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
    let getItemsQuery = `SELECT i.ItemID as itemId, i.Name as name, i.Price as price, i.Description as description, i.ItemImage as itemImage, i.IsActive as isActive, i.CreationDate as creationDate, i.CategoryID as categoryId, c.Name as categoryName FROM Items i INNER JOIN Categories c ON i.CategoryID = c.CategoryID ${
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
export const getItemById = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }
  if (!itemId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    const pool = await connectDb();
    if (!pool) {
      return res
        .status(500)
        .json({ message: 'Error connecting to the database' });
    }

    const getItemByIdQuery = `SELECT ItemID as itemId, Name as name, Price as price, Description as description, ItemImage as itemImage, IsActive as isActive, CreationDate as creationDate, CategoryID as categoryId FROM Items WHERE ItemID = @itemId`;
    const getItemByIdResult = await pool
      .request()
      .input('itemId', sql.Int, itemId)
      .query(getItemByIdQuery);

    if (getItemByIdResult.recordset.length === 0) {
      return res.status(400).json({ message: 'No se encontro el item' });
    }

    const item = getItemByIdResult.recordset[0];

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener el item' });
  }
};

//EDITAR ITEM
export const editItem = async (req: Request, res: Response) => {
  const { userId, name, price, isActive, description, categoryId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }
  if (!itemId || !name || !price || !isActive || !description || !categoryId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    //revisar si sos admin
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

    const editItemQuery = `UPDATE Items SET Name = @name, Price = @price, IsActive = @isActive, Description = @description, CategoryID = @categoryId WHERE ItemID = @itemId`;
    const editItemResult = await pool
      .request()
      .input('itemId', sql.Int, itemId)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Int, price)
      .input('isActive', sql.Bit, isActive)
      .input('description', sql.NVarChar, description)
      .input('categoryId', sql.Int, categoryId)
      .query(editItemQuery);

    if (editItemResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al editar el item intente nuevamente' });
    }

    if (req.file) {
      const getItemImageQuery = `SELECT ItemImage FROM Items WHERE ItemID = @itemId`;
      const getItemImageResult = await pool
        .request()
        .input('itemId', sql.Int, itemId)
        .query(getItemImageQuery);

      if (getItemImageResult.recordset.length === 0) {
        return res
          .status(400)
          .json({ message: 'Error al obtener la imagen del item' });
      }
      // Ruta de la imagen anterior
      const oldImagePath = getItemImageResult.recordset[0].ItemImage;

      // Eliminar la imagen anterior si existe
      if (oldImagePath) {
        //extrar el nombre del fichero
        const oldFileName = `uploads/items/${path.basename(oldImagePath)}`;
        //eliminarlo

        if (fs.existsSync(oldFileName)) {
          fs.unlinkSync(oldFileName);
        }
      }

      const fileName = `item-${Date.now()}-${itemId}.webp`;
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
        });
    }
    return res.status(200).json({
      message: 'Item editado correctamente',
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'Error al editar el item, intente editar nuevamente' });
  }
};

//ELIMINAR ITEM
export const deleteItem = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estas autorizado para hacer esta accion' });
  }
  if (!itemId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    //revisar si sos admin
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

    //traer el item y su imagen asi borrarla del almacenamiento del servidor
    const getItemImageQuery = `SELECT ItemImage FROM Items WHERE ItemID = @itemId`;
    const getItemImageResult = await pool
      .request()
      .input('itemId', sql.Int, itemId)
      .query(getItemImageQuery);

    if (getItemImageResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: 'Error al obtener la imagen del item' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = getItemImageResult.recordset[0].ItemImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      //extrar el nombre del fichero
      const oldFileName = `uploads/items/${path.basename(oldImagePath)}`;
      //eliminarlo

      if (fs.existsSync(oldFileName)) {
        fs.unlinkSync(oldFileName);
      }
    }

    const deleteItemQuery = `DELETE FROM Items WHERE ItemID = @itemId`;
    const deleteItemResult = await pool
      .request()
      .input('itemId', sql.Int, itemId)
      .query(deleteItemQuery);

    if (deleteItemResult.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: 'Error al eliminar el item intente nuevamente' });
    }
    return res.status(200).json({ message: 'Item eliminado correctamente' });
  } catch {
    fs.unlinkSync(req.file!.path);
    return res
      .status(500)
      .json({ message: 'Error al eliminar el item, intente nuevamente' });
  }
};
