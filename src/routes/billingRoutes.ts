import express from 'express';
import billingController from '../controllers/billingController';

const router = express.Router();

// Ruta para procesar el archivo CSV y mostrar las consultas generadas
router.get('/process-csv', billingController.processCSV);

// Ruta para buscar un albarán específico en la base de datos
router.get('/order/:orderNumber', billingController.findOrder);

// Ruta para buscar todos los albaranes del CSV en la base de datos
router.get('/find-all-orders', billingController.findMultipleOrders);

// Ruta para actualizar el billing_num de los albaranes sin id_transaction
// Configurada para responder tanto a GET como a POST para facilitar las pruebas
router.get('/update-billing-numbers', billingController.updateBillingNumbers);
router.post('/update-billing-numbers', billingController.updateBillingNumbers);

export default router;