import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { stdin as input, stdout as output } from 'process';
import readline from 'node:readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlDir = path.join(__dirname, 'base_de_datos');
const envExamplePath = path.join(__dirname, '.env.base_de_datos.example');
const envLocalPath = path.join(__dirname, '.env.base_de_datos');

const getSqlFilesInOrder = (dirPath) => {
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (!key) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
};

const resolveConfig = async () => {
  const envFileVars = parseEnvFile(envLocalPath);

  const config = {
    mysqlBin: process.env.MYSQL_BIN || envFileVars.MYSQL_BIN || 'mysql',
    dbHost: process.env.DB_HOST || envFileVars.DB_HOST || '127.0.0.1',
    dbPort: process.env.DB_PORT || envFileVars.DB_PORT || '3306',
    dbUser: process.env.DB_USER || envFileVars.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || envFileVars.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || envFileVars.DB_NAME || 'cdi_horarios',
  };

  if (!config.dbPassword) {
    const rl = readline.createInterface({ input, output });
    try {
      config.dbPassword = await rl.question('DB_PASSWORD no definido. Escribe la contraseña de MySQL (enter para vacío): ');
    } finally {
      rl.close();
    }
  }

  return config;
};

const run = async () => {
  if (!fs.existsSync(sqlDir)) {
    throw new Error(`No existe la carpeta de scripts SQL: ${sqlDir}`);
  }

  const sqlFiles = getSqlFilesInOrder(sqlDir);

  if (!sqlFiles.length) {
    throw new Error(`No se encontraron archivos .sql en: ${sqlDir}`);
  }

  const config = await resolveConfig();

  const env = { ...process.env };
  if (config.dbPassword) {
    env.MYSQL_PWD = config.dbPassword;
  }

  console.log('[info] Ejecutando scripts SQL en orden...');
  console.log(`[info] Host: ${config.dbHost}:${config.dbPort}`);
  console.log(`[info] Usuario: ${config.dbUser}`);
  console.log(`[info] Base de datos objetivo: ${config.dbName}`);
  console.log(`[info] Carpeta: ${sqlDir}`);
  console.log(`[info] Env local: ${envLocalPath}`);
  console.log(`[info] Env example: ${envExamplePath}`);
  console.log('');

  for (const fileName of sqlFiles) {
    const fullPath = path.join(sqlDir, fileName);
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    console.log(`[run] ${fileName}`);

    execFileSync(
      config.mysqlBin,
      [
        `--host=${config.dbHost}`,
        `--port=${config.dbPort}`,
        `--user=${config.dbUser}`,
        '--default-character-set=utf8mb4',
      ],
      {
        input: sqlContent,
        stdio: ['pipe', 'inherit', 'inherit'],
        env,
      }
    );
  }

  console.log('');
  console.log('[done] Todos los scripts SQL se ejecutaron correctamente.');
};

try {
  await run();
} catch (error) {
  console.error('');
  console.error('[error] Fallo al ejecutar scripts SQL.');
  console.error(error.message || error);
  process.exit(1);
}
