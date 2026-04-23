# Backups de Base de Datos (Windows, Linux y macOS)

Este documento describe como configurar, ejecutar y programar respaldos de MySQL con examples del repositorio.

## 1) Estrategia solicitada

1. Incremental: diario a las 00:00.
2. Full: semanal los domingos a las 00:00.
3. Limpieza: diaria (ejemplo 01:00) para eliminar copias viejas por retencion configurable.

## 2) Ubicacion de scripts y jobs

### 2.1 Scripts example

- `scripts/backups/scripts/horarios-backup-full.bat.example`
- `scripts/backups/scripts/horarios-backup-incremental.bat.example`
- `scripts/backups/scripts/horarios-backup-cleanup.bat.example`
- `scripts/backups/scripts/horarios-backup-full.sh.example`
- `scripts/backups/scripts/horarios-backup-incremental.sh.example`
- `scripts/backups/scripts/horarios-backup-cleanup.sh.example`

### 2.2 Jobs example

Windows Task Scheduler:

- `scripts/backups/jobs/horarios-backup-incremental-daily.windows.xml.example`
- `scripts/backups/jobs/horarios-backup-full-weekly.windows.xml.example`
- `scripts/backups/jobs/horarios-backup-cleanup-daily.windows.xml.example`

Linux/macOS con cron:

- `scripts/backups/jobs/horarios-backup-incremental-daily.cron.example`
- `scripts/backups/jobs/horarios-backup-full-weekly.cron.example`
- `scripts/backups/jobs/horarios-backup-cleanup-daily.cron.example`

macOS con launchd:

- `scripts/backups/jobs/com.dci.horarios.backup.incremental.plist.example`
- `scripts/backups/jobs/com.dci.horarios.backup.full.plist.example`
- `scripts/backups/jobs/com.dci.horarios.backup.cleanup.plist.example`

## 3) Preparacion comun

1. Instala herramientas CLI de MySQL:
- `mysqldump`
- `mysql`
- `mysqlbinlog`

2. Crea carpeta de respaldos:
- Windows ejemplo: `D:\backups\horarios`
- Linux/macOS ejemplo: `/opt/backups/horarios`

3. Edita placeholders en scripts:
- usuario
- password (opcional)
- base de datos (full)
- ruta de backups
- ruta de binlogs (incremental)
- retencion en dias (cleanup)

## 4) Windows

### 4.1 Configuracion de scripts

1. Copia `.bat.example` a `.bat`.
2. Ajusta variables internas.
3. Prueba manual:

```powershell
scripts\backups\scripts\horarios-backup-full.bat
scripts\backups\scripts\horarios-backup-incremental.bat
scripts\backups\scripts\horarios-backup-cleanup.bat
```

### 4.2 Programacion de jobs

1. Importa incremental diario:
- `scripts/backups/jobs/horarios-backup-incremental-daily.windows.xml.example`

2. Importa full semanal:
- `scripts/backups/jobs/horarios-backup-full-weekly.windows.xml.example`

3. Importa cleanup diario:
- `scripts/backups/jobs/horarios-backup-cleanup-daily.windows.xml.example`

4. Ajusta en cada task:
- `UserId`.
- `Command` con ruta real del script.

## 5) Linux y macOS con cron

### 5.1 Scripts

1. Copia `.sh.example` a `.sh`.
2. Da permisos:

```bash
chmod +x scripts/backups/scripts/horarios-backup-full.sh
chmod +x scripts/backups/scripts/horarios-backup-incremental.sh
chmod +x scripts/backups/scripts/horarios-backup-cleanup.sh
```

3. Prueba manual:

```bash
./scripts/backups/scripts/horarios-backup-full.sh
./scripts/backups/scripts/horarios-backup-incremental.sh
./scripts/backups/scripts/horarios-backup-cleanup.sh
```

### 5.2 Crontab

Abre `crontab -e` y agrega:

```cron
# Incremental diario 00:00
0 0 * * * /RUTA/scripts/backups/scripts/horarios-backup-incremental.sh >> /RUTA/logs/backup-incremental.log 2>&1

# Full semanal domingo 00:00
0 0 * * 0 /RUTA/scripts/backups/scripts/horarios-backup-full.sh >> /RUTA/logs/backup-full.log 2>&1

# Limpieza diaria 01:00
0 1 * * * /RUTA/scripts/backups/scripts/horarios-backup-cleanup.sh >> /RUTA/logs/backup-cleanup.log 2>&1
```

## 6) macOS con launchd (opcional)

Coloca los `.plist` finales en `~/Library/LaunchAgents/` y carga:

```bash
launchctl load ~/Library/LaunchAgents/com.dci.horarios.backup.incremental.plist
launchctl load ~/Library/LaunchAgents/com.dci.horarios.backup.full.plist
launchctl load ~/Library/LaunchAgents/com.dci.horarios.backup.cleanup.plist
```

## 7) Retencion configurable de copias viejas

La limpieza usa `RETENTION_DAYS` dentro de:

- `scripts/backups/scripts/horarios-backup-cleanup.bat.example`
- `scripts/backups/scripts/horarios-backup-cleanup.sh.example`

Comportamiento:

- elimina archivos `horarios_*.sql` con antiguedad mayor a `RETENTION_DAYS`.
- no borra archivos de control como `ultimo_binlog.txt`.

## 8) Checklist de validacion

- [ ] Incremental diario genera `horarios_incremental_*.sql`.
- [ ] Full semanal genera `horarios_full_*.sql`.
- [ ] Cleanup diario elimina respaldos viejos segun `RETENTION_DAYS`.
- [ ] Jobs ejecutan con el usuario correcto y rutas validas.
- [ ] Se generan logs de ejecucion y no hay errores de permisos.
