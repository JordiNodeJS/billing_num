import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import billingRoutes from './routes/billingRoutes';

// Configurar dotenv
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Asegurar que exista el directorio de uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Directorio de uploads creado:', uploadsDir);
}

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 4000;

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Rutas de la API
app.use('/api', billingRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de procesamiento de albaranes',
    endpoints: {
      uploadCSV: '/api/upload-csv',
      processCSV: '/api/process-csv',
      findOrder: '/api/order/:orderNumber',
      findAllOrders: '/api/find-all-orders',
      updateBillingNumbers: '/api/update-billing-numbers'
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Documentación de la API disponible en http://localhost:${PORT}`);
});