import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

interface OrderResult extends RowDataPacket {
  id: number;
  order_num: string;
  // Otros campos que puedan existir en la tabla order
}

/**
 * Servicio para realizar operaciones en la base de datos
 */
class DbService {
  /**
   * Busca un número de albarán en la base de datos
   * @param orderNumber Número de albarán a buscar
   * @returns Promise que resuelve a los resultados de la consulta
   */
  async findOrderByNumber(orderNumber: string): Promise<OrderResult[]> {
    try {
      const query = 'SELECT * FROM test.`order` `ord` WHERE `ord`.order_num = ? LIMIT 1';
      const [rows] = await pool.execute<OrderResult[]>(query, [orderNumber]);
      console.log('rows', rows);
      console.log('query', query);
      return rows;
    } catch (error) {
      console.error(`Error al buscar el albarán ${orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta consultas MySQL para múltiples números de albarán
   * @param orderNumbers Array de números de albarán
   * @returns Promise que resuelve a un objeto con los resultados agrupados por número de albarán
   */
  async findMultipleOrders(orderNumbers: string[]): Promise<Record<string, OrderResult>> {
    const results: Record<string, OrderResult> = {};

    for (const orderNumber of orderNumbers) {
      try {
        const rows = await this.findOrderByNumber(orderNumber);
        if (rows.length > 0) {
          results[orderNumber] = rows[0];
        }
      } catch (error) {
        console.error(`Error al procesar el albarán ${orderNumber}:`, error);
      }
    }

    return results;
  }

  /**
   * Genera consultas SQL para búsqueda de albaranes sin ejecutarlas
   * @param orderNumbers Array de números de albarán
   * @returns Array de consultas SQL como strings
   */
  generateOrderQueries(orderNumbers: string[]): string[] {
    return orderNumbers.map(orderNumber => 
      `SELECT * FROM test.\`order\` WHERE order_num = ${orderNumber} LIMIT 1;`
    );
  }
}

export default new DbService();