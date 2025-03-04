# Billing Number Update System

Sistema para actualizar los números de facturación (billing_num) de los albaranes sin id_transaction.

## Requisitos previos

- Node.js (v12 o superior)
- npm o yarn
- MySQL/MariaDB

## Instalación

1. Clona este repositorio o descárgalo como ZIP
2. Instala las dependencias:

```bash
npm install
```

## Configuración

1. Asegúrate de tener un archivo `.env` en la carpeta `src` con las siguientes variables:

```
PORT=4000
DB_USER=tu_usuario
DB_PORT=3306
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_base_de_datos
DB_HOST=tu_host_de_mysql
```

2. Coloca el archivo CSV con los números de albarán en la raíz del proyecto con el nombre `billling_num.csv`.

El archivo CSV debe contener una columna llamada "Numero Albaran" con los números de albarán a actualizar.

## Uso

### Iniciar el servidor

Para iniciar el servidor en modo de desarrollo:

```bash
npm run dev
```

Para compilar y ejecutar en producción:

```bash
npm run build
npm start
```

### Proceso de actualización de billing_num

Para realizar un update de billing_num, sigue estos pasos:

1. **Preparar el archivo CSV**:
   - Asegúrate de que el archivo `billling_num.csv` esté en la raíz del proyecto
   - El CSV debe contener una columna "Numero Albaran" con los albaranes a actualizar

2. **Validar los números de albarán (opcional)**:
   - Accede a `http://localhost:4000/api/process-csv` en tu navegador o usa una herramienta como Postman
   - Este endpoint mostrará los números de albarán encontrados en el CSV

3. **Verificar los datos en la base de datos (opcional)**:
   - Accede a `http://localhost:4000/api/find-all-orders` para ver el estado actual de los albaranes
   - Puedes verificar un albarán individual con `http://localhost:4000/api/order/NUMERO_ALBARAN`

4. **Ejecutar la actualización**:
   - Accede a `http://localhost:4000/api/update-billing-numbers`
   - También puedes usar el método POST a la misma URL si lo prefieres

### Respuesta de la actualización

Al ejecutar la actualización, recibirás una respuesta JSON con:

- `total`: Número total de albaranes procesados
- `updated`: Cantidad de albaranes actualizados
- `skipped`: Cantidad de albaranes omitidos (ya tienen id_transaction o no existen)
- `errors`: Cantidad de errores encontrados
- `results`: Detalles de los resultados, incluyendo:
  - `updated`: Lista de albaranes actualizados con su nuevo billing_num
  - `skipped`: Lista de albaranes omitidos con el motivo
  - `errors`: Lista de albaranes con errores y sus detalles

## Notas importantes

- El sistema solo actualizará los albaranes que:
  1. Existan en la base de datos
  2. No tengan un id_transaction (o sea nulo o vacío)
- El formato del nuevo billing_num será: `BN-[número_de_albarán]-[timestamp]`
- Se recomienda verificar los datos antes de ejecutar la actualización