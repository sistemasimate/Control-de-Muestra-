import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Icon from './Icon';
import { useRol, ROLES, PERMS } from '../context/RolContext';
import type { RolId } from '../types';

const NAV = [
  { section: 'Operación', items: [
    { id: 'dashboard',      label: 'Dashboard',      icon: 'dashboard' },
    { id: 'solicitudes',    label: 'Solicitudes',    icon: 'list',         badgeKey: 'pendientes' },
    { id: 'autorizaciones', label: 'Autorizaciones', icon: 'shield-check', badgeKey: 'pendientesAuth' },
  ]},
];

interface SidebarProps {
  pendientes?: number;
  pendientesAuth?: number;
}

export default function Sidebar({ pendientes = 0, pendientesAuth = 0 }: SidebarProps) {
  const { rolId, setRolId, perms, rol } = useRol();
  const { url } = usePage();
  const [showRolPicker, setShowRolPicker] = useState(false);

  const counts: Record<string, number> = { pendientes, pendientesAuth };

  const go = (route: string) => router.visit(`/${route === 'dashboard' ? '' : route}`);
  const active = (id: string) => url.startsWith(`/${id}`) || (id === 'dashboard' && (url === '/' || url === ''));

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-logo">SIC</div>
        <div>
          <div className="sb-brand-name">Control de muestras</div>
          <div className="sb-brand-sub">Portal SIC · v1.0</div>
        </div>
      </div>

      <div className="sb-nav">
        {NAV.map(group => (
          <div className="sb-section" key={group.section}>
            <div className="sb-section-title">{group.section}</div>
            {group.items.map(item => {
              if (item.id === 'autorizaciones' && !perms.autorizaciones) return null;
              const badge = item.badgeKey ? counts[item.badgeKey] : 0;
              return (
                <div
                  key={item.id}
                  className={`sb-link ${active(item.id) ? 'active' : ''}`}
                  onClick={() => go(item.id)}
                >
                  <Icon name={item.icon} size={14} className="sb-link-icon"/>
                  <span>{item.label}</span>
                  {badge > 0 && <span className="sb-link-badge">{badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sb-user" style={{ cursor: 'pointer' }} onClick={() => setShowRolPicker(v => !v)} title="Cambiar rol (demo)">
        <div className="sb-user-avatar">{rol.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="sb-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rol.name}</div>
          <div className="sb-user-role">{rol.short}</div>
        </div>
      </div>

      {showRolPicker && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowRolPicker(false)}/>
          <div style={{
            position: 'fixed', left: 0, bottom: 0, width: 'var(--sb-w)',
            background: 'var(--header-bg-2)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '0 4px 0 0', padding: '8px 6px 6px', zIndex: 91,
            boxShadow: '4px -4px 16px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 6px 6px' }}>Ver como rol (demo)</div>
            {(Object.keys(ROLES) as RolId[]).map(r => (
              <div
                key={r}
                onClick={() => { setRolId(r); setShowRolPicker(false); }}
                style={{
                  padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 2,
                  color: r === rolId ? 'var(--strip)' : 'rgba(255,255,255,0.82)',
                  background: r === rolId ? 'rgba(230,162,0,0.15)' : 'transparent',
                  fontWeight: r === rolId ? 600 : 400,
                }}
              >
                {ROLES[r].name} <span style={{ opacity: 0.6, fontSize: 10.5 }}>({ROLES[r].short})</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
