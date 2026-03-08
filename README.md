# Sistema de Generación de Horarios Académicos

Sistema web para que docentes universitarios gestionen y generen horarios académicos de forma automática, respetando disponibilidad de profesores, aulas y restricciones por carrera.

> Este repositorio contiene el **backend** (Django REST API). El frontend se documentará en una sección aparte cuando esté disponible.

---

## Requisitos previos

Asegúrate de tener instalado lo siguiente antes de continuar:

- **Python 3.12+**
- **MySQL 8.0+** con el schema de la base de datos ya creado (ver sección [Base de datos](#base-de-datos))
- **pip**

---

## Estructura del repositorio

```
/
├── horarios_backend/     ← proyecto Django (backend)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example      ← plantilla de variables de entorno
│   ├── core/             ← utilidades globales
│   ├── user_accounts/    ← autenticación y usuarios
│   └── subjects/         ← materias y colores
├── .docs/                ← documentación técnica del backend
└── ACERCA_DEL_SISTEMA.md
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <nombre-de-la-carpeta>
```

### 2. Crear y activar un entorno virtual (recomendado)

```bash
# Crear
python -m venv venv

# Activar en Windows
venv\Scripts\activate

# Activar en Linux / macOS
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
cd horarios_backend
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Edita `.env` con los datos de tu entorno:

```env
# Base de datos MySQL
DB_NAME=cdi_horarios
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=3306

# Django
SECRET_KEY=genera-una-clave-secreta-larga-y-aleatoria
DEBUG=True
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

> Para generar un `SECRET_KEY` seguro puedes ejecutar:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

## Base de datos

El esquema completo de la base de datos está definido en SQL. **Debe ejecutarse primero en MySQL** antes de correr las migraciones de Django.

El script SQL crea el schema `cdi_horarios` con todas las tablas necesarias. Ejecútalo desde MySQL Workbench o desde la terminal:

```bash
mysql -u tu_usuario -p < ruta/al/script.sql
```

Una vez creadas las tablas, aplica las migraciones de Django para que registre el estado inicial y cree sus propias tablas internas (sesiones, tokens, etc.):

```bash
python manage.py migrate --fake-initial
```

> `--fake-initial` le indica a Django que las tablas de tu proyecto ya existen y que no intente crearlas de nuevo. Solo creará las tablas internas de Django que todavía no existan.

---

## Ejecutar el servidor

```bash
python manage.py runserver
```

El servidor quedará disponible en `http://localhost:8000`.

---

## URLs disponibles

| URL | Descripción |
|-----|-------------|
| `http://localhost:8000/api/v1/auth/` | Endpoints de autenticación (login, registro, logout, etc.) |
| `http://localhost:8000/api/v1/` | Endpoints del sistema (colores, materias, etc.) |
| `http://localhost:8000/api/docs/` | Documentación interactiva Swagger UI |
| `http://localhost:8000/api/redoc/` | Documentación en formato Redoc |

---

## Documentación técnica

La guía de implementación del backend (patrones, serializers, vistas, permisos) está en:

```
.docs/BACKEND_IMPLEMENTATION_GUIDE.md
```
