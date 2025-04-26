# Portero Virtual - Sistema de Videollamadas para Edificios

Portero Virtual es una aplicación web que facilita la comunicación mediante videollamadas entre un portero y los diferentes departamentos de un edificio. Implementada con una arquitectura moderna basada en Astro+React, proporciona una experiencia fluida y eficiente tanto para porteros como para residentes.

![Portero Virtual](./public/screenshot.png)

## Características

- **Sistema de roles**: Interfaz adaptada para porteros y departamentos
- **Videollamadas en tiempo real**: Integración nativa con Jitsi Meet
- **Notificaciones instantáneas**: Actualizaciones en tiempo real mediante WebSockets
- **Base de datos ligera**: Almacenamiento eficiente con SQLite
- **Interfaz responsiva**: Diseño adaptable a dispositivos móviles y de escritorio
- **Modo offline**: Funcionamiento básico cuando no hay conexión a internet

## Tecnologías

- **Framework**: Astro con integración de React
- **Frontend**: React, Tailwind CSS
- **Backend**: API REST con Astro endpoints
- **Videollamadas**: Jitsi Meet mediante `@jitsi/react-sdk`
- **Base de datos**: SQLite para almacenamiento local y portabilidad
- **Actualizaciones en tiempo real**: WebSockets con Socket.IO
- **Tipado**: TypeScript para código más confiable

## Instalación

### Requisitos previos

- Node.js 18.x o superior
- npm 8.x o superior

### Pasos de instalación

```bash
# Clonar el repositorio
git clone https://github.com/JIATech/portero_jitsi
cd portero_jitsi

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## Configuración

La aplicación lee su configuración desde un archivo `.env` con la siguiente estructura:

```env
# Base de datos: SQLite
SQLITE_PATH=./data/local.db
SQL_DEBUG=false

# Modo de depuración
DEBUG=true

# Puerto del servidor (opcional)
PORT=3000
```

## Estructura del Proyecto

```
/
├── public/              # Recursos estáticos
├── src/
│   ├── components/      # Componentes React (SelectorRol, CallModal, etc.)
│   ├── layouts/         # Plantillas de páginas
│   ├── lib/             # Lógica de negocio
│   │   ├── db/          # Acceso a datos (SQLite)
│   │   └── types/       # Definiciones de TypeScript
│   ├── pages/
│   │   ├── api/         # Endpoints de API REST
│   │   └── *.astro      # Páginas de la aplicación
│   ├── services/        # Servicios (videollamadas, WebSockets, etc.)
│   └── styles/          # Estilos globales y Tailwind CSS
├── .env                 # Variables de entorno
├── astro.config.mjs     # Configuración de Astro

└── tailwind.config.mjs  # Configuración de Tailwind CSS
```

## Base de Datos

La aplicación utiliza SQLite como motor de base de datos, proporcionando las siguientes ventajas:

1. **Simplicidad**: No requiere configuración de servidores o servicios externos
2. **Portabilidad**: Base de datos autocontenida en un único archivo
3. **Rendimiento**: Excelente desempeño para aplicaciones con un volumen moderado de conexiones
4. **Confiabilidad**: Transacciones ACID y funcionamiento robusto
5. **Facilidad de despliegue**: Sin dependencias externas para instalación

### Esquema de Base de Datos

- **departments**: Almacena información de los departamentos y sus estados
- **call_history**: Registra el historial de llamadas realizadas

## Despliegue en Producción

```bash
# Compilar la aplicación
npm run build

# Iniciar en modo producción
npm run start
```

Para despliegues en servidores, se recomienda utilizar PM2 o servicios similares para gestionar el proceso Node.js:

```bash
npm install -g pm2
pm2 start dist/server/entry.mjs --name "portero-virtual"
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - vea el archivo [LICENSE](LICENSE) para más detalles.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, siéntase libre de enviar un Pull Request o abrir un Issue para discutir cambios importantes.
