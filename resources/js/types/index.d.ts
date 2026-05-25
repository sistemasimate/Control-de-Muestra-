// ── Role / permission types ────────────────────────────────────────────
export type RolId = 'vendedor' | 'gerente' | 'direccion' | 'almacen' | 'admin';

export interface Rol {
    id: RolId;
    name: string;
    short: string;
    initials: string;
    area: string;
}

export interface Perms {
    dashboard: string;
    catalogo: string;
    solicitudes: string;
    nueva: boolean;
    autorizaciones: string | false;
    movimientos: string;
    seguimiento: string;
    auditoria: string;
}

// ── DB model types (match schema exactly) ─────────────────────────────
export interface AlmacenDB {
    id: number;
    codigo: string;
    nombre: string;
    ubicacion: string | null;
    activo: boolean;
}

export interface ExistenciaDB {
    id: number;
    articulo_id: number;
    almacen_id: number;
    cantidad_disponible: number;
    cantidad_apartada: number;
    cantidad_entregada: number;
    almacen?: AlmacenDB;
}

export interface ArticuloDB {
    id: number;
    codigo_sic: string;
    sap_itemcode: string | null;
    descripcion: string;
    proveedor: string | null;
    unidad: string;
    costo_unitario: number;
    activo: boolean;
    existencias: ExistenciaDB[];
    total_disponible?: number;
}

export interface SolicitudDetalleDB {
    id: number;
    solicitud_id: number;
    articulo_id: number | null;
    almacen_id: number | null;
    codigo_articulo: string | null;
    descripcion: string | null;
    proveedor: string | null;
    cantidad: number;
    unidad: string | null;
    costo_unitario: number;
    almacen_codigo: string | null;
    impuesto: string | null;
    total_linea: number;
    lote: string | null;
    cantidad_pendiente?: number;
    articulo?: ArticuloDB;
    almacen?: AlmacenDB;
}

export type EstatusId =
    | 'Pendiente'
    | 'Aprobada'
    | 'Parcial'
    | 'Rechazada'
    | 'Entregada'
    | 'Cancelada'
    | 'Devuelta'
    | 'Cerrada';

export interface AutorizacionDB {
    id: number;
    solicitud_id: number;
    usuario_autoriza: string;
    nivel_autorizacion: string | null;
    estatus: 'Aprobada' | 'Rechazada';
    comentarios: string | null;
    fecha_autorizacion: string;
}

export interface SeguimientoRegistroDB {
    id: number;
    solicitud_id: number;
    resultado: 'En proceso' | 'Exitosa' | 'No aprobada' | 'Convertida en venta' | 'Sin seguimiento';
    comentarios: string | null;
    usuario: string;
    fecha_seguimiento: string;
}

export interface EntregaDetalleDB {
    id: number;
    entrega_id: number;
    solicitud_detalle_id: number;
    cantidad_solicitada: number;
    cantidad_entregada: number;
    unidad: string | null;
    costo_unitario: number;
    total_linea: number;
    almacen_codigo: string | null;
    lote: string | null;
    proveedor: string | null;
}

export interface EntregaDB {
    id: number;
    folio: string;
    solicitud_id: number;
    estatus: 'Por entregar' | 'Entregada' | 'Cancelada';
    autorizador: string | null;
    fecha_entrega: string | null;
    comentarios: string | null;
    subtotal: number;
    iva: number;
    total: number;
    destinatario: string | null;
    direccion_envio: string | null;
    ciudad: string | null;
    estado: string | null;
    cp: string | null;
    telefono: string | null;
    forma_envio: string | null;
    paqueteria: string | null;
    numero_guia: string | null;
    lineas?: EntregaDetalleDB[];
}

export interface SolicitudDB {
    id: number;
    folio: string;
    cliente_codigo: string | null;
    cliente_nombre: string;
    orden_compra: string | null;
    vendedor: string | null;
    proyecto: string | null;
    direccion_entrega: string | null;
    motivo: string | null;
    comentarios: string | null;
    autorizador: string | null;
    estatus: EstatusId;
    autorizacion_requerida: string | null;
    usuario_solicita: string;
    fecha_solicitud: string;
    subtotal: number;
    iva: number;
    total: number;
    created_at: string;
    updated_at: string;
    lineas: SolicitudDetalleDB[];
    autorizaciones?: AutorizacionDB[];
    seguimientos?: SeguimientoRegistroDB[];
    entregas?: EntregaDB[];
}

export interface MovimientoDB {
    id: number;
    articulo_id: number;
    almacen_id: number;
    tipo_movimiento: 'Entrada' | 'Salida' | 'Apartado' | 'Cancelacion' | 'Devolucion' | 'Ajuste';
    documento_tipo: string | null;
    documento_folio: string | null;
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
    usuario: string;
    comentarios: string | null;
    fecha_movimiento: string;
    articulo?: ArticuloDB;
    almacen?: AlmacenDB;
}

// ── Inertia pagination wrapper ─────────────────────────────────────────
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

// ── Shared data (HandleInertiaRequests) ────────────────────────────────
export interface SharedData {
    appName: string;
    flash: { success?: string; error?: string };
}
