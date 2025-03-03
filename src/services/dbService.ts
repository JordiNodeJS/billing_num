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

  /**
   * Actualiza el billing_num de los albaranes que no tengan id_transaction
   * @param orderNumbers Array de números de albarán a actualizar
   * @returns Promise que resuelve a un objeto con los resultados de la actualización
   */
  async updateBillingNumbers(orderNumbers: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {
      updated: [],
      skipped: [],
      errors: []
    };

    for (const orderNumber of orderNumbers) {
      try {
        // Primero verificamos si el albarán existe y no tiene id_transaction
        const query = 'SELECT * FROM test.`order` WHERE order_num = ? LIMIT 1';
        const [rows] = await pool.execute<OrderResult[]>(query, [orderNumber]);

        if (rows.length === 0) {
          results.skipped.push({
            orderNumber,
            reason: 'El albarán no existe en la base de datos'
          });
          continue;
        }

        const order = rows[0];
        
        // Verificamos si el pedido ya tiene id_transaction
        if (order.id_transaction) {
          results.skipped.push({
            orderNumber,
            reason: 'El albarán ya tiene un id_transaction'
          });
          continue;
        }

        // Actualizar el billing_num del albarán
        const timestamp = new Date().getTime();
        const billingNum = `BN-${orderNumber}-${timestamp}`;
        
        const updateQuery = 'UPDATE test.`order` SET billing_num = ? WHERE order_num = ? AND (id_transaction IS NULL OR id_transaction = "")';
        const [updateResult] = await pool.execute(updateQuery, [billingNum, orderNumber]);
        
        results.updated.push({
          orderNumber,
          billingNum,
          updateResult
        });
      } catch (error) {
        console.error(`Error al actualizar el albarán ${orderNumber}:`, error);
        results.errors.push({
          orderNumber,
          error: (error as Error).message
        });
      }
    }

    return results;
  }
}

export default new DbService();