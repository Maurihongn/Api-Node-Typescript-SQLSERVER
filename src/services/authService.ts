import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// export const checkAdminPermission = async (userId: number) => {
//   const pool = await connectDb(); // Obtener la conexión a la base de datos

//   if (!pool) {
//     // Manejar el error de conexión a la base de datos
//     return false; // Otra opción sería lanzar una excepción
//   }

//   try {
//     const getUserRoleQuery = `
//         SELECT Users.RoleID, Roles.RoleValue
//         FROM Users
//         INNER JOIN Roles ON Users.RoleID = Roles.RoleID
//         WHERE UserID = @userId
//       `;

//     const userRoleResult = await pool
//       .request()
//       .input('userId', sql.Int, userId)
//       .query(getUserRoleQuery);

//     // Verificar si el usuario tiene el rol de "ADMIN"
//     return userRoleResult.recordset[0].RoleValue === 'ADMIN';
//   } catch (error) {
//     console.error('Error al verificar el permiso de administrador:', error);
//     return false; // En caso de error, asumimos que no tiene permisos
//   } finally {
//     pool.close();
//   }
// };

export const checkAdminPermission = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Role: true },
    });

    if (!user || !user.Role) {
      return false;
    }

    // Verificar si el usuario tiene el rol de "ADMIN"
    return user.Role.RoleValue === 'ADMIN';
  } catch (error) {
    console.error('Error al verificar el permiso de administrador:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
};
