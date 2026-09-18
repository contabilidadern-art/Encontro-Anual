import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { STATE_COORDINATES } from '../../constants';
import { fBRLCompact } from '../theme';

// Mapa de calor por UF (mesmo padrão visual da aba "Visão Geral" do módulo
// de Precificação — CircleMarker com raio proporcional ao valor) — usado
// tanto pra vendas quanto pra compras, só troca `dados`/`cor`.
export default function MapaUF({ dados, cor = '#D9C14A', titulo }) {
  const entradas = Object.entries(dados || {}).filter(([, v]) => v > 0);
  const maxVal = Math.max(...entradas.map(([, v]) => v), 1);

  if (entradas.length === 0) {
    return (
      <div className="h-[360px] flex items-center justify-center text-sm text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
        Sem dados de UF nesse período.
      </div>
    );
  }

  return (
    <div className="h-[360px] rounded-xl overflow-hidden border border-slate-200 z-0">
      <MapContainer center={[-14.235, -51.925]} zoom={3.6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {entradas.map(([uf, valor]) => {
          const coords = STATE_COORDINATES[uf];
          if (!coords) return null;
          return (
            <CircleMarker
              key={uf} center={coords}
              pathOptions={{ color: '#334155', fillColor: cor, fillOpacity: 0.8, weight: 1.5 }}
              radius={Math.max((valor / maxVal) * 38, 10)}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-center min-w-[90px]">
                  <strong className="text-sm block border-b border-slate-100 pb-1 mb-1">{uf}</strong>
                  <div className="text-xs font-bold text-slate-600">{fBRLCompact(valor)}</div>
                  {titulo && <div className="text-[10px] text-slate-500">{titulo}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
