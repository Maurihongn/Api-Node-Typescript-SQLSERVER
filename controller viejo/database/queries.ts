// database/queries.js
import { sql } from './dbConfig';

async function obtenerDatosDesdeBD() {
  try {
    const result = await sql.query('SELECT * FROM tabla');
    console.log('Datos obtenidos:', result.recordset);
  } catch (error) {
    console.error('Error al obtener datos desde SQL Server', error);
  }
}

module.exports = {
  obtenerDatosDesdeBD,
};
