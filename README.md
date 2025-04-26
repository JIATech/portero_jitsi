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
git clone https://github.com/tu-usuario/portero-virtual.git
cd portero-virtual

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## Configuración

La aplicación lee su configuración desde un archivo `.env` con la siguiente estructura:

```env
# Configuración de Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portero_virtual
DB_USER=postgres
DB_PASSWORD=postgres

# Configuración de SQLite (fallback)
SQLITE_PATH=./data/local.db

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
│   │   ├── db/          # Acceso a datos (PostgreSQL/SQLite)
│   │   └── types/       # Definiciones de TypeScript
│   ├── pages/
│   │   ├── api/         # Endpoints de API REST
│   │   └── *.astro      # Páginas de la aplicación
│   ├── services/        # Servicios (videollamadas, WebSockets, etc.)
│   └── styles/          # Estilos globales y Tailwind CSS
├── .env                 # Variables de entorno
├── astro.config.mjs     # Configuración de Astro
├── docker-compose.yml   # Configuración de Docker para PostgreSQL
└── tailwind.config.mjs  # Configuración de Tailwind CSS
```

## Base de Datos

El sistema utiliza PostgreSQL como motor principal, con la capacidad de cambiar automáticamente a SQLite cuando PostgreSQL no está disponible. Esta arquitectura dual permite:

1. **Alta disponibilidad**: Garantiza que la aplicación siga funcionando incluso si la base de datos principal falla
2. **Funcionamiento offline**: Capacidad de operar con datos locales cuando no hay conexión
3. **Sincronización**: Los datos se sincronizan cuando la conexión se restablece

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
