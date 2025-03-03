import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import csvService from '../services/csvService';
import dbService from '../services/dbService';

/**
 * Controlador para gestionar las operaciones de albaranes
 */
class BillingController {
  /**
   * Procesa el archivo CSV y extrae los números de albarán
   * @param req Solicitud HTTP
   * @param res Respuesta HTTP
   */
  async processCSV(req: Request, res: Response): Promise<void> {
    try {
      const csvFilePath = path.resolve(process.cwd(), 'billling_num.csv');
      
      // Verificar si el archivo existe
      if (!fs.existsSync(csvFilePath)) {
        res.status(404).json({ error: 'El archivo CSV no se encuentra' });
        return;
      }

      // Extraer números de albarán del CSV
      const orderNumbers = await csvService.extractOrderNumbers(csvFilePath);
      
      // Generar las consultas SQL para cada número de albarán
      const queries = dbService.generateOrderQueries(orderNumbers);
      
      res.json({
        total: orderNumbers.length,
        orderNumbers,
        queries
      });
    } catch (error) {
      console.error('Error al procesar el archivo CSV:', error);
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
      // Extraer números de albarán del CSV
      const csvFilePath = path.resolve(process.cwd(), 'billling_num.csv');
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
}

export default new BillingController();