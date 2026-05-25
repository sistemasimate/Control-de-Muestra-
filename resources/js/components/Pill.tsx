import React from 'react';
import type { EstatusId } from '../types';

// Maps both Spanish DB values and legacy English keys to CSS classes
const CSS_CLASS: Record<string, string> = {
    // Spanish (DB)
    Pendiente: 'pending',
    Aprobada:  'approved',
    Rechazada: 'rejected',
    Entregada: 'delivered',
    Parcial:   'partial',
    Devuelta:  'returned',
    Cancelada: 'cancelled',
    Cerrada:   'cancelled',
    // English (legacy)
    pending:   'pending',
    approved:  'approved',
    rejected:  'rejected',
    delivered: 'delivered',
    returned:  'returned',
    cancelled: 'cancelled',
};

export default function Pill({ status }: { status: string }) {
    const cls = CSS_CLASS[status] ?? 'pending';
    return <span className={`pill ${cls}`}>{status}</span>;
}
