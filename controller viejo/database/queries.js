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
Object.defineProperty(exports, "__esModule", { value: true });
// database/queries.js
const dbConfig_1 = require("./dbConfig");
function obtenerDatosDesdeBD() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield dbConfig_1.sql.query('SELECT * FROM tabla');
            console.log('Datos obtenidos:', result.recordset);
        }
        catch (error) {
            console.error('Error al obtener datos desde SQL Server', error);
        }
    });
}
module.exports = {
    obtenerDatosDesdeBD,
};
