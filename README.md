# Sistema de Generacion de Horarios Academicos

Sistema web para gestionar y generar horarios academicos, con backend en Django REST Framework y frontend en React + Vite.

## Requisitos previos

- Python 3.12 o superior
- MySQL 8 o superior
- Node.js 20.19+ o 22.12+ (requerido por Vite 7)
- npm 10 o superior

## Estructura del repositorio

```text
/
|- .docs/
|- scripts/
|  |- horarios-estructura-bd.sql
|  |- 4. horarios-inserciones.sql
|  |- generate-rsa-keys.mjs
|- horarios_backend/
|  |- manage.py
|  |- requirements.txt
|  |- .env.example
|  |- horarios_backend/       # settings.py, urls.py, logging interceptor
|  |- user_accounts/
|  |- subjects/
|  |- universities/
|  |- careers/
|  |- teachers/
|  |- classrooms/
|- horarios_frontend/
|  |- package.json
|  |- .env.example
|  |- src/
|- README.md
|- ACERCA_DEL_SISTEMA.md
```

## Puesta en marcha local

### 1) Crear base de datos MySQL

Crea una base de datos vacia y asigna usuario/permiso acorde a tus credenciales de entorno.

Ejemplo:

```sql
CREATE DATABASE horarios_academicos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2) Crear los archivos `.env`

Desde cada carpeta, copia su archivo ejemplo:

```powershell
# Desde la raiz del repositorio
Copy-Item horarios_backend/.env.example horarios_backend/.env
Copy-Item horarios_frontend/.env.example horarios_frontend/.env
```

Si usas Linux/macOS:

```bash
cp horarios_backend/.env.example horarios_backend/.env
cp horarios_frontend/.env.example horarios_frontend/.env
```

#### Backend (`horarios_backend/.env`)

Configura, al menos:

```env
DB_NAME=horarios_academicos
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_HOST=localhost
DB_PORT=3306

SECRET_KEY=tu_secret_key_django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

RSA_PRIVATE_KEY=
RSA_PRIVATE_KEY_PATH=keys/private_key.pem
```

#### Frontend (`horarios_frontend/.env`)

Configura:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nREEMPLAZAR_CON_TU_LLAVE_PUBLICA_RSA\n-----END PUBLIC KEY-----"
```

### 3) Generar llaves RSA

Desde la raiz del repositorio ejecuta:

```bash
node scripts/generate-rsa-keys.mjs
```

Este comando:

- Genera `horarios_backend/keys/private_key.pem` y `horarios_backend/keys/public_key.pem`.
- Imprime el valor listo para pegar en `VITE_RSA_PUBLIC_KEY` del frontend.

Importante:

- En backend puedes dejar `RSA_PRIVATE_KEY` vacio si usas `RSA_PRIVATE_KEY_PATH=keys/private_key.pem`.
- `keys/` esta ignorado por git en backend.

### 4) Instalar y ejecutar backend

```bash
cd horarios_backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend: `http://localhost:8000`

### 5) Instalar y ejecutar frontend

En otra terminal:

```bash
cd horarios_frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173` (o el puerto que asigne Vite)

## Verificacion rapida

- Swagger/OpenAPI: `http://localhost:8000/api/docs/`
- OpenAPI JSON: `http://localhost:8000/api/schema/`
- ReDoc: `http://localhost:8000/api/redoc/`

## Credenciales iniciales de desarrollo

Al ejecutar migraciones se insertan usuarios de prueba:

- `admin@gmail.com` / `Admin123`
- `usuario@gmail.com` / `Usuario123`

## Endpoints utiles (base)

### Autenticacion y usuario

- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/register-admin/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/user/my-info/`
- `GET /api/v1/user/configurations/`
- `PUT /api/v1/user/configurations/selected-university/`

### Catalogos principales

- `GET /api/v1/universities/`
- `POST /api/v1/universities/create/`
- `GET|PUT|DELETE /api/v1/universities/<university_id>/`
- `GET /api/v1/subjects/colors/`
- `GET /api/v1/university/subjects/`

Para el detalle completo de rutas, usa `GET /api/schema/` o la UI de `GET /api/docs/`.

## Logging

Se usa Loguru con interceptor para redirigir logs de Django/Python.

- Configuracion: `horarios_backend/horarios_backend/settings.py`
- Interceptor: `horarios_backend/horarios_backend/interceptor.py`
- Directorios de salida:
  - `horarios_backend/logs/debug/`
  - `horarios_backend/logs/info/`
  - `horarios_backend/logs/warning/`
  - `horarios_backend/logs/error/`

## Scripts disponibles

- `scripts/generate-rsa-keys.mjs`: genera llaves RSA para cifrado de login/registro.
- `scripts/1. horarios-estructura-bd.sql`: script SQL de estructura (opcional).
- `scripts/4. horarios-inserciones.sql`: script SQL de inserciones (opcional).

## Notas

- Si Vite avisa sobre version de Node, actualiza a Node 22.12+ o 20.19+.
- Si el frontend corre en otro origen/puerto, agregalo en `CORS_ALLOWED_ORIGINS` del backend.
