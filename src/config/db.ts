import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Configurar dotenv para cargar el archivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuración para la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test'
};

// Crear un pool de conexiones para mejorar el rendimiento
const pool = mysql.createPool(dbConfig);

export default pool;