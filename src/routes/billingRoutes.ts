import express from 'express';
import billingController from '../controllers/billingController';

const router = express.Router();

// Ruta para procesar el archivo CSV y mostrar las consultas generadas
router.get('/process-csv', billingController.processCSV);

// Ruta para buscar un albarán específico en la base de datos
router.get('/order/:orderNumber', billingController.findOrder);

// Ruta para buscar todos los albaranes del CSV en la base de datos
router.get('/find-all-orders', billingController.findMultipleOrders);

export default router;