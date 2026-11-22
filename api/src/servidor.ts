// Punto de entrada: `npm run start -w api`. Escucha en 0.0.0.0:PUERTO, atiende /api
// y sirve el front compilado (DIR_ESTATICOS) para todo lo demás.
import { crearApp } from './app';
import { bdResponde, crearBd } from './bd';
import { cargarArchivoEntorno, cargarConfig } from './config';
import { crearCanalPostgres } from './eventos';
import { diasParaRecambio, evaluarAgua, leerTira, tira } from './medicion/index';

async function principal(): Promise<void> {
  cargarArchivoEntorno();
  const config = cargarConfig();
  if (!config.urlBd) {
    console.error('[servidor] Falta DATABASE_URL. Revisa el archivo de entorno (ver .env.example).');
    process.exit(1);
  }

  const bd = crearBd(config.urlBd);
  const eventos = crearCanalPostgres({ bd, urlBd: config.urlBd });

  const app = await crearApp({
    bd,
    config,
    medicion: { tira, leerTira, evaluarAgua, diasParaRecambio },
    eventos,
    dirEstaticos: config.dirEstaticos,
    registro: true,
  });

  for (const aviso of config.avisos) app.log.warn(aviso);
  if (config.lectorSimulado) app.log.warn('Lectura de la tira en modo simulado (sin servicio de visión).');
  if (!(await bdResponde(bd))) {
    app.log.error('La base de datos no responde todavía; /api/salud lo informa con "bd": false.');
  }

  // La conexión de avisos se reintenta sola si la base aún no está lista.
  void eventos.iniciar();

  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    app.log.info(`recibida ${senal}: cerrando`);
    try {
      await app.close();
      await eventos.cerrar();
      await bd.end();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void cerrar('SIGTERM'));
  process.on('SIGINT', () => void cerrar('SIGINT'));

  await app.listen({ host: '0.0.0.0', port: config.puerto });
}

principal().catch((error) => {
  console.error('[servidor] no pudo arrancar:', error);
  process.exit(1);
});
