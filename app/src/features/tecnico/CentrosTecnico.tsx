// Centros de llenado (/tecnico, pestaña "Centros de llenado"): el técnico de Grimuca mide el grifo de despacho de
// cada centro y publica la medición tal cual, también lo que sale fuera de rango (docs/negocio/idea-centros-de-llenado.md).
// El frasco de coliformes se lee a las 48 horas y se anota una sola vez.
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Aviso, Boton, Campo, Cargando, EstadoVacio, Insignia } from '../../components/grimuca';
import { api, ErrorApi } from '../../lib/api';
import type { CentroPublico, MedicionCentro, Nivel, ParametroTira, ValoresMedicion } from '../../lib/tipos';
import { esNoAutorizado, fechaLarga, mensajeDe } from '../red/comun';

export const AVISO_MEDICION_CENTRO = 'Medición orientativa con tira, no es un análisis de laboratorio.';

const PALABRA_NIVEL: Record<Nivel, string> = {
  verde: 'En rango',
  amarillo: 'Para vigilar',
  rojo: 'Fuera de rango',
  sin_dato: 'Sin dato',
};

/** "N de M casillas en rango". */
export function conteoEnRango(m: Pick<MedicionCentro, 'casillas_en_rango' | 'casillas_leidas'>): string {
  return `${m.casillas_en_rango} de ${m.casillas_leidas} casillas en rango`;
}

function textoFrasco(m: MedicionCentro): string {
  if (m.bacterias === 'cambio') return 'El frasco cambió de color.';
  if (m.bacterias === 'sin_cambio') return 'El frasco no cambió de color.';
  return 'El frasco todavía está en lectura (48 horas).';
}

function ResultadoPublicado({ m }: { m: MedicionCentro }) {
  return (
    <div className="g-pila" aria-label="Medición publicada">
      <p style={{ margin: 0 }}>
        <strong>{conteoEnRango(m)}</strong> · {fechaLarga(m.fecha)}
      </p>
      <ul className="tec-casillas">
        {m.casillas.map((c) => (
          <li key={c.clave}>
            {c.nombre}: {c.valor === null ? 'no se leyó' : `${c.valor}${c.unidad ? ` ${c.unidad}` : ''}`} ·{' '}
            {PALABRA_NIVEL[c.nivel]}
          </li>
        ))}
      </ul>
      <p className="g-apagado" style={{ margin: 0 }}>
        {textoFrasco(m)}
      </p>
      <p className="g-apagado" style={{ margin: 0 }}>
        {AVISO_MEDICION_CENTRO}
      </p>
    </div>
  );
}

function FormularioMedicion({
  centro,
  tira,
  token,
  alPublicar,
  alCancelar,
  alNoAutorizado,
}: {
  centro: CentroPublico;
  tira: ParametroTira[];
  token: string;
  alPublicar: (m: MedicionCentro) => void;
  alCancelar: () => void;
  alNoAutorizado: () => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publicar(evento: FormEvent) {
    evento.preventDefault();
    const leidos: ValoresMedicion = {};
    for (const p of tira) {
      const texto = valores[p.clave];
      leidos[p.clave] = texto === undefined || texto === '' ? null : Number(texto);
    }
    if (!Object.values(leidos).some((v) => typeof v === 'number')) {
      setError('Carga al menos una casilla de la tira.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const m = await api.medirCentro(centro.tienda_id, { valores: leidos, nota: nota.trim() || null }, token);
      alPublicar(m);
    } catch (e) {
      if (esNoAutorizado(e)) alNoAutorizado();
      else setError(mensajeDe(e, 'No se pudo publicar la medición. Intenta otra vez.'));
      setEnviando(false);
    }
  }

  return (
    <form className="tec-cierre g-pila" onSubmit={publicar} noValidate aria-label={`Medición de ${centro.nombre}`}>
      <h3 className="g-h3" style={{ margin: 0 }}>
        Medición del grifo de despacho
      </h3>
      {tira.map((p) => (
        <Campo
          key={p.clave}
          id={`centro-${centro.tienda_id}-${p.clave}`}
          como="select"
          etiqueta={`${p.nombre}${p.unidad ? ` (${p.unidad})` : ''}`}
          marcador="No se leyó"
          opciones={p.niveles.map((n) => ({ valor: String(n), etiqueta: String(n) }))}
          value={valores[p.clave] ?? ''}
          onChange={(e) => setValores((v) => ({ ...v, [p.clave]: e.target.value }))}
        />
      ))}
      <Campo
        como="textarea"
        etiqueta="Nota"
        opcional
        rows={2}
        placeholder="Muestra del grifo de despacho…"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      <p className="g-apagado" style={{ margin: 0 }}>
        Se publica tal cual, también lo que salga fuera de rango.
      </p>
      {error && (
        <Aviso tono="error" rol="alert">
          {error}
        </Aviso>
      )}
      <Boton type="submit" cargando={enviando} anchoCompleto>
        Publicar medición
      </Boton>
      <Boton variante="secundario" onClick={alCancelar} anchoCompleto>
        Cancelar
      </Boton>
    </form>
  );
}

function Frasco({
  m,
  token,
  alAnotar,
  alNoAutorizado,
}: {
  m: MedicionCentro;
  token: string;
  alAnotar: (m: MedicionCentro) => void;
  alNoAutorizado: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function anotar(resultado: 'cambio' | 'sin_cambio') {
    setEnviando(true);
    setError(null);
    try {
      alAnotar(await api.frascoCentro(m.id, resultado, token));
    } catch (e) {
      if (esNoAutorizado(e)) alNoAutorizado();
      else if (e instanceof ErrorApi && e.estado === 409) setError(e.mensaje);
      else setError(mensajeDe(e, 'No se pudo anotar el frasco. Intenta otra vez.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="g-pila" role="group" aria-label="Resultado del frasco">
      <p style={{ margin: 0 }}>Frasco de coliformes de la última medición: anota lo que ves a las 48 horas.</p>
      <Boton variante="secundario" disabled={enviando} onClick={() => void anotar('cambio')} anchoCompleto>
        El frasco cambió de color
      </Boton>
      <Boton variante="secundario" disabled={enviando} onClick={() => void anotar('sin_cambio')} anchoCompleto>
        El frasco sigue igual
      </Boton>
      {error && (
        <Aviso tono="error" rol="alert">
          {error}
        </Aviso>
      )}
    </div>
  );
}

function TarjetaCentro({
  centro,
  abierto,
  token,
  alAbrir,
  alCerrar,
  alCambiar,
  alNoAutorizado,
}: {
  centro: CentroPublico;
  abierto: boolean;
  token: string;
  alAbrir: () => void;
  alCerrar: () => void;
  alCambiar: (m: MedicionCentro) => void;
  alNoAutorizado: () => void;
}) {
  const [tira, setTira] = useState<ParametroTira[] | null>(null);
  const [errorTira, setErrorTira] = useState<string | null>(null);
  const [publicada, setPublicada] = useState<MedicionCentro | null>(null);
  const ultima = centro.ultima;

  useEffect(() => {
    if (!abierto || tira) return;
    let vigente = true;
    api
      .configTira()
      .then((t) => vigente && setTira(t))
      .catch((e) => vigente && setErrorTira(mensajeDe(e, 'No se pudo cargar la tira.')));
    return () => {
      vigente = false;
    };
  }, [abierto, tira]);

  return (
    <li className="tec-tarjeta">
      <div className="tec-tarjeta__cabecera">
        {centro.vencida ? <Insignia tono="aviso">Toca medir</Insignia> : <Insignia tono="ok">Medición vigente</Insignia>}
        {centro.es_demostracion && <Insignia tono="neutro">Demostración</Insignia>}
      </div>
      <h2 className="g-h3 tec-tarjeta__titulo">{centro.nombre}</h2>
      <dl className="tec-datos">
        <dt>Local</dt>
        <dd>{centro.local}</dd>
        <dt>Urbanización</dt>
        <dd>{[centro.urbanizacion, centro.zona].filter(Boolean).join(' · ') || '—'}</dd>
        <dt>Última medición</dt>
        <dd>{ultima ? `${fechaLarga(ultima.fecha)} · ${conteoEnRango(ultima)}` : 'Sin medición'}</dd>
      </dl>

      {publicada && (
        <Aviso tono="ok">
          <span>
            Medición publicada: {conteoEnRango(publicada)}.{' '}
            <a className="g-enlace" href={`/centros/${encodeURIComponent(centro.tienda_id)}`}>
              Ver la página pública
            </a>
          </span>
        </Aviso>
      )}

      {ultima && ultima.bacterias === 'pendiente' && !abierto && (
        <Frasco m={ultima} token={token} alAnotar={alCambiar} alNoAutorizado={alNoAutorizado} />
      )}

      {abierto ? (
        errorTira ? (
          <Aviso tono="error" rol="alert">
            {errorTira}
          </Aviso>
        ) : !tira ? (
          <Cargando texto="Cargando la tira…" />
        ) : (
          <FormularioMedicion
            centro={centro}
            tira={tira}
            token={token}
            alNoAutorizado={alNoAutorizado}
            alCancelar={alCerrar}
            alPublicar={(m) => {
              setPublicada(m);
              alCambiar(m);
              alCerrar();
            }}
          />
        )
      ) : (
        <Boton variante="secundario" anchoCompleto onClick={alAbrir} aria-label={`Medir: ${centro.nombre}`}>
          Medir
        </Boton>
      )}

      {publicada && <ResultadoPublicado m={publicada} />}
    </li>
  );
}

/** Lista de centros de llenado a medir. Se carga al abrir la pestaña. */
export function CentrosDeLlenado({ token, alNoAutorizado }: { token: string; alNoAutorizado: () => void }) {
  const [centros, setCentros] = useState<CentroPublico[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setCentros(await api.tecnicoCentros(token));
    } catch (e) {
      if (esNoAutorizado(e)) alNoAutorizado();
      else setError(mensajeDe(e, 'No se pudieron cargar los centros de llenado.'));
    }
  }, [token, alNoAutorizado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Reemplaza la última medición del centro por la nueva o la actualizada (frasco). */
  function cambiar(tiendaId: string, m: MedicionCentro) {
    setCentros((lista) =>
      (lista ?? []).map((c) => (c.tienda_id === tiendaId ? { ...c, ultima: m, vencida: false } : c)),
    );
  }

  if (error && !centros) {
    return (
      <EstadoVacio
        tono="error"
        titulo={error}
        accion={
          <Boton variante="secundario" onClick={() => void cargar()}>
            Reintentar
          </Boton>
        }
      />
    );
  }
  if (!centros) return <Cargando variante="esqueleto" lineas={3} texto="Cargando centros de llenado…" />;
  if (centros.length === 0) {
    return <EstadoVacio titulo="No hay centros de llenado en la red.">Cuando la red dé de alta uno, aparece aquí.</EstadoVacio>;
  }

  return (
    <ul className="tec-lista" aria-label="Centros de llenado">
      {centros.map((c) => (
        <TarjetaCentro
          key={c.tienda_id}
          centro={c}
          token={token}
          abierto={abierto === c.tienda_id}
          alAbrir={() => setAbierto(c.tienda_id)}
          alCerrar={() => setAbierto(null)}
          alCambiar={(m) => cambiar(c.tienda_id, m)}
          alNoAutorizado={alNoAutorizado}
        />
      ))}
    </ul>
  );
}
