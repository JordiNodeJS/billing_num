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

// Store SSE clients
const clients: { [id: string]: express.Response } = {};

// SSE client management functions
export const addClient = (id: string, res: express.Response) => {
  clients[id] = res;
  console.log(`Cliente SSE conectado: ${id}`);
};

export const removeClient = (id: string) => {
  delete clients[id];
  console.log(`Cliente SSE desconectado: ${id}`);
};

export const sendEventToAll = (event: string, data: any) => {
  Object.keys(clients).forEach(clientId => {
    const client = clients[clientId];
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

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

// Ruta para SSE
app.get('/api/sse', (req, res) => {
  // Configurar la respuesta como SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Enviar un comentario para mantener la conexión abierta
  res.write(':\n\n');
  
  // Generar un ID único para este cliente
  const clientId = Date.now().toString();
  
  // Añadir este cliente a nuestra lista de clientes
  addClient(clientId, res);
  
  // Cuando el cliente se desconecta
  req.on('close', () => {
    removeClient(clientId);
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de procesamiento de albaranes',
    endpoints: {
      uploadCSV: '/api/upload-csv',
      processCSV: '/api/process-csv',
      findOrder: '/api/order/:orderNumber',
      findAllOrders: '/api/find-all-orders',
      updateBillingNumbers: '/api/update-billing-numbers',
      sse: '/api/sse'
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Documentación de la API disponible en http://localhost:${PORT}`);
});

export default app;