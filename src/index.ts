import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import billingRoutes from './routes/billingRoutes';

// Configurar dotenv
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas de la API
app.use('/api', billingRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de procesamiento de albaranes',
    endpoints: {
      processCSV: '/api/process-csv',
      findOrder: '/api/order/:orderNumber',
      findAllOrders: '/api/find-all-orders'
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Documentación de la API disponible en http://localhost:${PORT}`);
});