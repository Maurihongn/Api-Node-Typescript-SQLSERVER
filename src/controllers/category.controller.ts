import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { checkAdminPermission } from '../services/authService';

const prisma = new PrismaClient();

//OBTENER TODAS LAS CATEGORIAS

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
      return res.status(204).json({
        message: 'No hay categorias',
      });
    }

    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
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
    const category = await prisma.category.findUnique({
      where: {
        categoryId: parseInt(categoryId, 10),
      },
    });

    if (!category) {
      return res.status(404).json({
        message: 'No existe la categoría',
      });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener la categoría',
    });
  }
};

//GUARDAR UNA CATEGORIA

export const saveCategory = async (req: Request, res: Response) => {
  const { userId, name, description } = req.body;

  if (!userId) {
    return res.status(401).json({
      message: 'No estás autorizado',
    });
  }

  if (!name || !description) {
    return res.status(400).json({
      message: 'Faltan datos',
    });
  }

  try {
    // Verificar si el usuario que está intentando hacer esto es admin
    const isAdmin = checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(401).json({
        message: 'No estás autorizado',
      });
    }

    // Verificar si ya existe una categoría con ese nombre
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: 'Ya existe una categoría con ese nombre',
      });
    }

    // Crear la categoría
    const category = await prisma.category.create({
      data: {
        name: name,
        description: description,
        creationDate: new Date(),
        isActive: true,
      },
    });

    return res.status(200).json({
      message: 'Categoría creada con éxito',
      category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al crear la categoría, intente nuevamente',
    });
  }
};

//EDITAR UNA CATEGORIA
export const editCategory = async (req: Request, res: Response) => {
  const { userId, name, description, isActive } = req.body;
  const { categoryId } = req.params;

  if (!userId) {
    return res.status(401).json({
      message: 'No estás autorizado',
    });
  }
  if (!categoryId || !name || !description) {
    return res.status(400).json({
      message: 'Faltan datos',
    });
  }

  try {
    // Comprobar si el usuario que intenta editar la categoría es un administrador
    const isAdmin = checkAdminPermission(userId);

    if (!isAdmin) {
      return res.status(401).json({
        message: 'No estás autorizado',
      });
    }
    // Actualizar la categoría
    const updatedCategory = await prisma.category.update({
      where: {
        categoryId: parseInt(categoryId),
      },
      data: {
        name,
        description,
        isActive,
      },
    });

    if (!updatedCategory) {
      return res.status(400).json({
        message: 'Error al editar la categoría. Intente nuevamente.',
      });
    }

    return res.status(200).json({
      message: 'Categoría editada con éxito',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};

//ELIMINAR UNA CATEGORIA

export const deleteCategory = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { categoryId } = req.params;

  if (!userId) {
    return res.status(401).json({
      message: 'No estás autorizado',
    });
  }
  if (!categoryId) {
    return res.status(400).json({
      message: 'Faltan datos',
    });
  }

  try {
    // Comprobar si el usuario que intenta eliminar la categoría es un administrador
    const isAdmin = checkAdminPermission(userId);
    if (!isAdmin) {
      return res.status(401).json({
        message: 'No estás autorizado',
      });
    }

    // Eliminar la categoría
    const deletedCategory = await prisma.category.delete({
      where: {
        categoryId: parseInt(categoryId),
      },
    });

    if (!deletedCategory) {
      return res.status(400).json({
        message: 'Error al eliminar la categoría. Intente nuevamente.',
      });
    }

    return res.status(200).json({
      message: 'Categoría eliminada con éxito',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión de Prisma cuando termines
  }
};
