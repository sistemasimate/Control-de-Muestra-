import React, { createContext, useContext, useState } from 'react';
import type { RolId, Perms, Rol } from '../types';

export const ROLES: Record<RolId, Rol> = {
  vendedor:  { id: 'vendedor',  name: 'Carla Méndez',   short: 'Vendedor',          initials: 'CM', area: 'Ventas — Zona Norte' },
  gerente:   { id: 'gerente',   name: 'Diego Ramírez',  short: 'Gerente comercial', initials: 'DR', area: 'Gerencia comercial' },
  direccion: { id: 'direccion', name: 'Patricia Solís', short: 'Dirección',         initials: 'PS', area: 'Dirección comercial' },
  almacen:   { id: 'almacen',   name: 'Iván Torres',    short: 'Almacén',           initials: 'IT', area: 'Almacén central — CDMX' },
  admin:     { id: 'admin',     name: 'Luis Aguilar',   short: 'Administrador',     initials: 'LA', area: 'Administración del sistema' },
};

export const PERMS: Record<RolId, Perms> = {
  vendedor:  { dashboard: 'view', catalogo: 'view',  solicitudes: 'edit', nueva: true,  autorizaciones: false,       movimientos: 'view', seguimiento: 'edit',  auditoria: 'view-own' },
  gerente:   { dashboard: 'view', catalogo: 'view',  solicitudes: 'edit', nueva: true,  autorizaciones: 'gerente',   movimientos: 'view', seguimiento: 'edit',  auditoria: 'view' },
  direccion: { dashboard: 'view', catalogo: 'view',  solicitudes: 'view', nueva: false, autorizaciones: 'direccion', movimientos: 'view', seguimiento: 'view',  auditoria: 'view' },
  almacen:   { dashboard: 'view', catalogo: 'edit',  solicitudes: 'view', nueva: false, autorizaciones: false,       movimientos: 'edit', seguimiento: 'view',  auditoria: 'view' },
  admin:     { dashboard: 'view', catalogo: 'edit',  solicitudes: 'edit', nueva: true,  autorizaciones: 'todas',     movimientos: 'edit', seguimiento: 'edit',  auditoria: 'view' },
};

interface RolCtx {
  rolId: RolId;
  setRolId: (r: RolId) => void;
  perms: Perms;
  rol: Rol;
}

const Ctx = createContext<RolCtx>({} as RolCtx);

export function RolProvider({ children }: { children: React.ReactNode }) {
  const [rolId, setRolId] = useState<RolId>('vendedor');
  const perms = PERMS[rolId];
  const rol = ROLES[rolId];
  return <Ctx.Provider value={{ rolId, setRolId, perms, rol }}>{children}</Ctx.Provider>;
}

export const useRol = () => useContext(Ctx);
