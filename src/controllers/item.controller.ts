import { Request, Response } from 'express';
import fs from 'fs';
import { checkAdminPermission } from '../services/authService';
import sharp from 'sharp';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

//CREAR UN ITEM
export const createItem = async (req: Request, res: Response) => {
  const { userId, name, price, isActive, description, categoryId } = req.body;

  if (!userId) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res.status(400).json({ message: 'No estás autorizado' });
  }

  if (!name || !price || !isActive || !description || !categoryId) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Verificar si el usuario tiene permisos de administrador
    const isAdmin = checkAdminPermission(userId);
    if (!isAdmin) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res.status(401).json({
        message: 'No estas autorizado',
      });
    }

    //verificar si la categoria existe
    const category = await prisma.category.findUnique({
      where: {
        categoryId: parseInt(categoryId),
      },
    });

    if (!category) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res.status(400).json({
        message: 'La categoría no existe',
      });
    }

    // Convertir isActive a un booleano
    const isActiveBool = isActive === 'true';
    // Crear el nuevo ítem
    const createdItem = await prisma.item.create({
      data: {
        name,
        price: parseFloat(price), // Convertir 'price' a tipo Float
        isActive: isActiveBool,
        description,
        categoryId: parseInt(categoryId),
      },
    });

    if (!createdItem) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res
        .status(400)
        .json({ message: 'Error al crear el ítem. Intente nuevamente' });
    }

    // Si no se subió una imagen, regresar una respuesta
    if (!req.file) {
      return res.status(200).json({
        message: 'Ítem creado correctamente. Agregue una foto si lo desea.',
      });
    }

    const itemId = createdItem.itemId;

    const fileName = `item-${Date.now()}-${itemId}.webp`;
    const imagePath = `src/uploads/items/${fileName}`;

    // Utiliza Sharp para redimensionar y convertir la foto a formato WebP
    sharp(req.file.path)
      .resize({ width: 200 }) // Ajusta el tamaño según tus necesidades
      .webp()
      .toFile(imagePath, async (err) => {
        if (err) {
          if (req.file) {
            fs.unlinkSync(req.file!.path);
          }
          return res
            .status(500)
            .json({ message: 'Error al procesar la foto del ítem.' });
        }

        // Eliminar el archivo temporal de la carga
        fs.unlinkSync(req.file!.path);

        // Preparar la URL de la imagen
        const imageUrl = `${process.env.BASE_URL}/item/image/${fileName}`;

        // Actualizar la URL de la imagen en la base de datos
        const updatedItem = await prisma.item.update({
          where: {
            itemId: itemId,
          },
          data: {
            itemImage: imageUrl,
          },
        });

        if (!updatedItem) {
          return res.status(400).json({
            message:
              'Error al actualizar la imagen del ítem. Intente nuevamente.',
          });
        }

        // Si has llegado hasta aquí, la actualización y procesamiento de la foto fueron exitosos
        return res.status(200).json({ message: 'Ítem creado correctamente' });
      });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res.status(500).json({ message: 'Error al crear el ítem' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};
//MOSTRAR IMAGEN
export const image = async (req: Request, res: Response) => {
  let fileName = req.params.fileName;
  let ruta_fisica = `./src/uploads/items/${fileName}`;

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
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res
      .status(401)
      .json({ message: 'No estás autorizado para hacer esta acción' });
  }

  if (!req.file || !itemId) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res.status(400).json({ message: 'No estas autorizado' });
    }
    // Conectarse a la base de datos
    const item = await prisma.item.findUnique({
      where: {
        itemId: parseInt(itemId),
      },
    });

    if (!item) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res.status(400).json({ message: 'Item no encontrado' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = item.itemImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      const oldFileName = `src/uploads/items/${path.basename(oldImagePath)}`;
      if (fs.existsSync(oldFileName)) {
        fs.unlinkSync(oldFileName);
      }
    }

    const fileName = `item-${Date.now()}-${item.itemId}.webp`;
    const imagePath = `src/uploads/items/${fileName}`;

    // Utilizar Sharp para redimensionar y convertir la foto de perfil a WebP
    sharp(req.file.path)
      .resize({ width: 200 }) // Ajustar el tamaño según tus necesidades
      .webp()
      .toFile(imagePath, async (err) => {
        if (err) {
          if (req.file) {
            fs.unlinkSync(req.file!.path);
          }
          return res
            .status(500)
            .json({ message: 'Error al procesar la foto del Item.' });
        }

        // Eliminar el archivo temporal de la carga
        fs.unlinkSync(req.file!.path);

        // Preparar la URL del endpoint de la imagen
        const imageUrl = `${process.env.BASE_URL}/item/image/${fileName}`;

        // Actualizar la foto del ítem en la base de datos
        const updatedItem = await prisma.item.update({
          where: {
            itemId: parseInt(itemId),
          },
          data: {
            itemImage: imageUrl,
          },
        });

        if (!updatedItem) {
          return res.status(400).json({
            message:
              'Error al actualizar la imagen del ítem. Intente nuevamente',
          });
        }

        return res
          .status(200)
          .json({ message: 'Imagen actualizada con éxito' });
      });
  } catch (error) {
    fs.unlinkSync(req.file!.path);
    return res
      .status(500)
      .json({ message: 'Error al procesar la foto de perfil.' });
  } finally {
    await prisma.$disconnect(); // Cerrar la conexión de Prisma cuando hayas terminado
  }
};

//OBTENER ITEMS

export const getItems = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { search = '', page = 1, limit = 10 } = req.query;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estás autorizado para hacer esta acción' });
  }

  try {
    // Parsea los valores de page y limit a números enteros
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Calcula el número de elementos a omitir para la paginación
    const offset = (pageNumber - 1) * limitNumber;

    const itemsInfo = await prisma.item.findMany({
      where: {
        category: {
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      },
      orderBy: {
        itemId: 'asc',
      },
      skip: offset,
      take: limitNumber,
      select: {
        itemId: true,
        name: true,
        price: true,
        description: true,
        itemImage: true,
        isActive: true,
        creationDate: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const items = itemsInfo.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      description: item.description,
      itemImage: item.itemImage,
      isActive: item.isActive,
      creationDate: item.creationDate,
      category: item.category.name, // Aquí obtenemos el nombre de la categoría
    }));

    const totalItems = await prisma.item.count({
      where: {
        category: {
          name: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      },
    });

    const totalPages = Math.ceil(totalItems / limitNumber);

    return res.status(200).json({ items, totalPages, totalItems, page });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener los items' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando hayas terminado
  }
};

//OBTENER POR ID
export const getItemById = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estás autorizado para hacer esta acción' });
  }
  if (!itemId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    // Consulta el ítem por ID utilizando Prisma
    const item = await prisma.item.findUnique({
      where: {
        itemId: parseInt(itemId), // Asegúrate de convertir el ID a número
      },
      select: {
        itemId: true,
        name: true,
        price: true,
        description: true,
        itemImage: true,
        isActive: true,
        creationDate: true,
        category: {
          select: {
            categoryId: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(400).json({ message: 'No se encontró el ítem' });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener el ítem' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};

//EDITAR ITEM
export const editItem = async (req: Request, res: Response) => {
  const { userId, name, price, isActive, description, categoryId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res
      .status(401)
      .json({ message: 'No estás autorizado para hacer esta acción' });
  }
  if (!itemId || !name || !price || !isActive || !description || !categoryId) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Verificar si el usuario tiene permisos de administrador
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res.status(400).json({ message: 'No estás autorizado' });
    }

    // Actualizar el ítem utilizando Prisma
    const updatedItem = await prisma.item.update({
      where: {
        itemId: parseInt(itemId), // Asegúrate de convertir el ID a número
      },
      data: {
        name,
        price: parseFloat(price), // Convierte 'price' a tipo Float
        isActive: isActive === 'true', // Convierte 'isActive' a tipo booleano
        description,
        categoryId: parseInt(categoryId), // Convierte 'categoryId' a número
      },
    });

    if (!updatedItem) {
      if (req.file) {
        fs.unlinkSync(req.file!.path);
      }
      return res
        .status(400)
        .json({ message: 'Error al editar el ítem. Intente nuevamente' });
    }

    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (updatedItem.itemImage) {
        const oldFileName = `src/uploads/items/${path.basename(
          updatedItem.itemImage
        )}`;
        if (fs.existsSync(oldFileName)) {
          fs.unlinkSync(oldFileName);
        }
      }

      const fileName = `item-${Date.now()}-${itemId}.webp`;
      const imagePath = `src/uploads/items/${fileName}`;

      // Utiliza Sharp para redimensionar y convertir la foto a formato WebP
      sharp(req.file.path)
        .resize({ width: 200 }) // Ajusta el tamaño a tus necesidades
        .webp()
        .toFile(imagePath, async (err) => {
          if (err) {
            if (req.file) {
              fs.unlinkSync(req.file!.path);
            }
            return res
              .status(500)
              .json({ message: 'Error al procesar la foto del ítem.' });
          }

          // Elimina el archivo temporal de la carga
          fs.unlinkSync(req.file!.path);

          // Preparar la URL de la imagen
          const imageUrl = `${process.env.BASE_URL}/item/image/${fileName}`;

          // Actualizar la URL de la imagen en la base de datos
          const updatedItemImage = await prisma.item.update({
            where: {
              itemId: parseInt(itemId), // Asegúrate de convertir el ID a número
            },
            data: {
              itemImage: imageUrl,
            },
          });

          if (!updatedItemImage) {
            return res.status(400).json({
              message:
                'Error al actualizar la imagen del ítem. Intente nuevamente.',
            });
          }
        });
    }

    return res.status(200).json({
      message: 'Ítem editado correctamente',
    });
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    return res
      .status(500)
      .json({ message: 'Error al editar el ítem. Intente nuevamente' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};

//ELIMINAR ITEM
export const deleteItem = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { itemId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ message: 'No estás autorizado para hacer esta acción' });
  }
  if (!itemId) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Verificar si el usuario tiene permisos de administrador
    const isAdmin = await checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(400).json({ message: 'No estás autorizado' });
    }

    // Obtener la información del ítem antes de eliminarlo
    const itemToDelete = await prisma.item.findUnique({
      where: {
        itemId: parseInt(itemId), // Asegúrate de convertir el ID a número
      },
    });

    if (!itemToDelete) {
      return res.status(400).json({ message: 'Error al obtener el ítem' });
    }

    // Ruta de la imagen anterior
    const oldImagePath = itemToDelete.itemImage;

    // Eliminar la imagen anterior si existe
    if (oldImagePath) {
      const oldFileName = `src/uploads/items/${path.basename(oldImagePath)}`;
      if (fs.existsSync(oldFileName)) {
        fs.unlinkSync(oldFileName);
      }
    }

    // Eliminar el ítem utilizando Prisma
    const deletedItem = await prisma.item.delete({
      where: {
        itemId: parseInt(itemId), // Asegúrate de convertir el ID a número
      },
    });

    if (!deletedItem) {
      return res
        .status(400)
        .json({ message: 'Error al eliminar el ítem. Intente nuevamente' });
    }

    return res.status(200).json({ message: 'Ítem eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Error al eliminar el ítem. Intente nuevamente' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};
