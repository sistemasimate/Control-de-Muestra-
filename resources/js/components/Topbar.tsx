import React from 'react';
import { router, usePage } from '@inertiajs/react';
import Icon from './Icon';
import Btn from './Btn';
import { useRol } from '../context/RolContext';

const CRUMBS: Record<string, string[]> = {
  '':              ['Operación', 'Dashboard'],
  dashboard:       ['Operación', 'Dashboard'],
  solicitudes:     ['Operación', 'Solicitudes'],
  autorizaciones:  ['Operación', 'Autorizaciones'],
  seguimiento:     ['Operación', 'Seguimiento'],
  catalogo:        ['Inventario', 'Catálogo de muestras'],
  movimientos:     ['Inventario', 'Entradas y salidas'],
  auditoria:       ['Sistema', 'Auditoría'],
};

export default function Topbar() {
  const { perms } = useRol();
  const { url } = usePage();
  const seg = url.replace(/^\//, '').split('/')[0] || '';
  const crumbs = CRUMBS[seg] ?? [seg];

  return (
    <header className="tb">
      <div className="tb-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={12} className="sep"/>}
            <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="tb-search">
        <Icon name="search" size={14} className="tb-search-icon"/>
        <input placeholder="Buscar folio, cliente, artículo…"/>
      </div>

      <div className="tb-actions">
        <Btn variant="ghost" icon="bell" title="Notificaciones"/>
        {perms.nueva && (
          <Btn variant="primary" icon="plus" onClick={() => router.visit('/solicitudes')}>
            Nueva solicitud
          </Btn>
        )}
      </div>
    </header>
  );
}
