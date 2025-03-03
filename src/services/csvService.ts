import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

interface BillingRecord {
  'Numero Albaran': string;
  'Cliente': string;
  [key: string]: any; // Para otros campos que puedan existir en el CSV
}

/**
 * Servicio para procesar archivos CSV de albaranes
 */
class CsvService {
  /**
   * Lee el archivo CSV y extrae los números de albarán
   * @param filePath Ruta al archivo CSV
   * @returns Promise que resuelve a un array de números de albarán
   */
  async extractOrderNumbers(filePath: string): Promise<string[]> {
    const results: string[] = [];
    const absolutePath = path.resolve(filePath);

    return new Promise((resolve, reject) => {
      fs.createReadStream(absolutePath)
        .pipe(csv())
        .on('data', (data: BillingRecord) => {
          if (data['Numero Albaran'] && data['Numero Albaran'].trim() !== '') {
            results.push(data['Numero Albaran'].trim());
          }
        })
        .on('end', () => {
          console.log(`Se encontraron ${results.length} números de albarán`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('Error al procesar el CSV:', error);
          reject(error);
        });
    });
  }
}

export default new CsvService();