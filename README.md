# Sistema de Generación de Horarios Académicos

Sistema web para gestionar y generar horarios académicos, con backend en Django REST Framework y frontend en React + Vite.

## Requisitos previos

- Python 3.12+
- MySQL 8+
- Node.js 20.19+ o 22.12+ (Vite 7)
- npm 10+

## Estructura del repositorio

```text
/
├── horarios_backend/         # API Django
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── horarios_backend/     # settings, urls, interceptor de logs
│   ├── user_accounts/
│   ├── subjects/
│   └── universities/
├── horarios_frontend/        # React + Vite
│   ├── package.json
│   ├── .env.example
│   └── src/
└── ACERCA_DEL_SISTEMA.md
```

## Configuración de entorno

### Backend (`horarios_backend/.env`)

Basado en `horarios_backend/.env.example`:

```env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Si usas otro puerto de Vite (por ejemplo 5174), agrégalo en `CORS_ALLOWED_ORIGINS`.

### Frontend (`horarios_frontend/.env`)

Basado en `horarios_frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Instalación

### 1. Backend

```bash
cd horarios_backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend disponible en `http://localhost:8000`.

### 2. Frontend

```bash
cd horarios_frontend
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173` (o el puerto que asigne Vite).

## Autenticación actual (cookies HttpOnly)

- Login y refresh usan cookies HttpOnly (`access_token` y `refresh_token`).
- El frontend usa `withCredentials: true`.
- No se guarda JWT en `localStorage`.
- `ROTATE_REFRESH_TOKENS=False` y `BLACKLIST_AFTER_ROTATION=False` en `SIMPLE_JWT`.

## Endpoints relevantes

### Documentación API

- `GET /api/schema/`
- `GET /api/docs/`
- `GET /api/redoc/`

### Auth y usuario

- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/user/my-info/`
- `GET /api/v1/user/configurations/`

### Subjects

- `GET /api/v1/subjects/colors/`
- `GET /api/v1/subjects/colors/paginated/`
- `GET|PUT|DELETE /api/v1/subjects/colors/<id>/`
- `PUT /api/v1/subjects/colors/<id>/toggle-status/`

### Universities

- `GET /api/v1/universities/universities/`
- `POST /api/v1/universities/universities/create/`
- `GET|PUT|DELETE /api/v1/universities/universities/<university_id>/`

## Logging

Se usa Loguru con interceptor para redirigir logs de Django/Python.

- Configuración en `horarios_backend/horarios_backend/settings.py`.
- Interceptor en `horarios_backend/horarios_backend/interceptor.py`.
- Archivos por nivel en:
	- `horarios_backend/logs/debug/`
	- `horarios_backend/logs/info/`
	- `horarios_backend/logs/warning/`
	- `horarios_backend/logs/error/`
- El ruido de Swagger/OpenAPI se excluye del log de `DEBUG`.

## Notas

- Si Vite muestra aviso por versión de Node, actualiza a Node 22.12+ o 20.19+.
- Si cambias origen del frontend, recuerda actualizar `CORS_ALLOWED_ORIGINS`.
