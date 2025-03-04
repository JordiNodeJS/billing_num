import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import csvService from '../services/csvService';
import dbService from '../services/dbService';
import { sendEventToAll } from '../index';

/**
 * Controlador para gestionar las operaciones de albaranes
 */
class BillingController {
  constructor() {
    this.uploadCSV = this.uploadCSV.bind(this);
    this.processCSV = this.processCSV.bind(this);
    this.findOrder = this.findOrder.bind(this);
    this.findMultipleOrders = this.findMultipleOrders.bind(this);
    this.updateBillingNumbers = this.updateBillingNumbers.bind(this);
  }

  /**
   * Maneja la subida de un archivo CSV
   * @param req Solicitud HTTP
   * @param res Respuesta HTTP
   */
  async uploadCSV(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        console.error('No file provided in the request');
        res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
        return;
      }

      console.log('File uploaded:', req.file);
      const uploadedFilePath = path.resolve(req.file.path);
      console.log('Uploaded file path:', uploadedFilePath);

      // Guardar la ruta del archivo en memoria para usarla en otras solicitudes
      req.app.locals.lastUploadedFile = uploadedFilePath;

      // Notificar a los clientes conectados que se ha subido un archivo
      sendEventToAll('file_uploaded', {
        message: 'Archivo CSV subido correctamente',
        filename: req.file.filename,
        path: uploadedFilePath
      });

      // Procesar el archivo CSV y actualizar los números de facturación
      const orderNumbers = await csvService.extractOrderNumbers(uploadedFilePath);
      const updateResults = await dbService.updateBillingNumbers(orderNumbers);

      // Enviar la respuesta con los resultados de la actualización
      res.status(200).json({
        total: orderNumbers.length,
        updated: updateResults.updated,
        skipped: updateResults.skipped,
        errors: updateResults.errors,
        results: updateResults
      });
    } catch (error) {
      console.error('Error al subir el archivo CSV:', error);
      
      // Notificar a los clientes que hubo un error
      sendEventToAll('upload_error', {
        message: 'Error al procesar el archivo subido',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al procesar el archivo subido' });
      }
    }
  }

  /**
   * Procesa el archivo CSV y extrae los números de albarán
   * @param req Solicitud HTTP
   * @param res Respuesta HTTP
   */
  async processCSV(req: Request, res: Response): Promise<void> {
    try {
      // Usar el archivo subido si existe, de lo contrario usar el archivo predeterminado
      let csvFilePath: string;
      
      if (req.app.locals.lastUploadedFile) {
        csvFilePath = req.app.locals.lastUploadedFile;
      } else {
        csvFilePath = path.resolve(process.cwd(), 'billling_num.csv');
      }
      
      // Verificar si el archivo existe
      if (!fs.existsSync(csvFilePath)) {
        res.status(404).json({ error: 'El archivo CSV no se encuentra' });
        return;
      }

      // Notificar a los clientes que ha iniciado el procesamiento
      sendEventToAll('process_started', {
        message: 'Iniciando procesamiento del archivo CSV',
        filePath: csvFilePath
      });

      // Extraer números de albarán del CSV
      const orderNumbers = await csvService.extractOrderNumbers(csvFilePath);
      
      // Generar las consultas SQL para cada número de albarán
      const queries = dbService.generateOrderQueries(orderNumbers);
      
      // Notificar a los clientes que ha terminado el procesamiento
      sendEventToAll('process_completed', {
        message: 'Procesamiento del archivo CSV completado',
        total: orderNumbers.length
      });
      
      res.json({
        total: orderNumbers.length,
        orderNumbers,
        queries,
        results: {
          total: orderNumbers.length,
          orderNumbers,
          queries
        }
      });
    } catch (error) {
      console.error('Error al procesar el archivo CSV:', error);
      
      // Notificar a los clientes que hubo un error
      sendEventToAll('process_error', {
        message: 'Error al procesar el archivo CSV',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      res.status(500).json({ error: 'Error al procesar el archivo CSV' });
    }
  }

  /**
   * Busca un número de albarán en la base de datos
   * @param req Solicitud HTTP con el número de albarán como parámetro
   * @param res Respuesta HTTP
   */
  async findOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({ error: 'Se requiere un número de albarán' });
        return;
      }
      
      const results = await dbService.findOrderByNumber(orderNumber);
      
      if (results.length === 0) {
        res.status(404).json({ message: `No se encontró el albarán ${orderNumber}` });
        return;
      }
      
      res.json({
        orderNumber,
        data: results[0]
      });
    } catch (error) {
      console.error('Error al buscar el albarán:', error);
      res.status(500).json({ error: 'Error al buscar el albarán en la base de datos' });
    }
  }

  /**
   * Busca múltiples números de albarán en la base de datos
   * @param req Solicitud HTTP
   * @param res Respuesta HTTP
   */
  async findMultipleOrders(req: Request, res: Response): Promise<void> {
    try {
      // Usar el archivo subido si existe, de lo contrario usar el archivo predeterminado
      let csvFilePath: string;
      
      if (req.app.locals.lastUploadedFile) {
        csvFilePath = req.app.locals.lastUploadedFile;
      } else {
        csvFilePath = path.resolve(process.cwd(), 'billling_num.csv');
      }

      // Extraer números de albarán del CSV
      const orderNumbers = await csvService.extractOrderNumbers(csvFilePath);
      
      // Buscar los números de albarán en la base de datos
      const results = await dbService.findMultipleOrders(orderNumbers);
      
      res.json({
        total: Object.keys(results).length,
        results
      });
    } catch (error) {
      console.error('Error al buscar los albaranes:', error);
      res.status(500).json({ error: 'Error al buscar los albaranes en la base de datos' });
    }
  }

  /**
   * Actualiza el billing_num de los albaranes/order_num sin id_transaction
   * @param req Solicitud HTTP
   * @param res Respuesta HTTP
   */
  async updateBillingNumbers(req: Request, res: Response): Promise<void> {
    try {
      // Usar el archivo subido si existe, de lo contrario usar el archivo predeterminado
      let csvFilePath: string;
      
      if (req.app.locals.lastUploadedFile) {
        csvFilePath = req.app.locals.lastUploadedFile;
      } else {
        csvFilePath = path.resolve(process.cwd(), 'billing_num.csv');
      }
      
      // Verificar si el archivo existe
      if (!fs.existsSync(csvFilePath)) {
        res.status(404).json({ error: 'El archivo CSV no se encuentra' });
        return;
      }
      // Extraer números de albarán del CSV
      const orderNumbers = await csvService.extractOrderNumbers(csvFilePath);
      if (orderNumbers.length === 0) {
        res.status(404).json({ error: 'No se encontraron números de albarán en el archivo CSV' });
        return;
      }
      
      // Notificar a los clientes conectados que ha iniciado la actualización
      sendEventToAll('update_started', {
        message: 'Iniciando actualización de números de facturación',
        total: orderNumbers.length
      });
      
      // Actualizar los billing_num de los albaranes que no tienen id_transaction
      const updateResults = await dbService.updateBillingNumbers(orderNumbers);
      
      // Notificar a los clientes que ha terminado la actualización
      sendEventToAll('update_completed', {
        total: orderNumbers.length,
        updated: updateResults.updated,
        skipped: updateResults.skipped,
        errors: updateResults.errors
      });
      
      res.json({
        total: orderNumbers.length,
        updated: updateResults.updated,
        skipped: updateResults.skipped,
        errors: updateResults.errors,
        results: updateResults
      });
    } catch (error) {
      console.error('Error al actualizar los números de facturación:', error);
      
      // Notificar a los clientes que hubo un error
      sendEventToAll('update_error', {
        message: 'Error al actualizar los números de facturación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      res.status(500).json({ error: 'Error al actualizar los números de facturación' });
    }
  }
}

export default new BillingController();