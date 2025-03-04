import express from 'express';
import multer from 'multer';
import billingController from '../controllers/billingController';

const router = express.Router();

// Configuración de multer para almacenar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'uploaded_' + Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos CSV
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// Ruta para subir un archivo CSV
router.post('/upload-csv', upload.single('csvFile'), billingController.uploadCSV);

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