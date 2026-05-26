import React from 'react';
import type { EstatusId } from '../types';

// Maps both Spanish DB values and legacy English keys to CSS classes
const CSS_CLASS: Record<string, string> = {
    // Spanish (DB)
    Pendiente:          'pending',
    Aprobada:           'approved',
    Rechazada:          'rejected',
    'Entrega completa': 'delivered',
    'Entrega parcial':  'partial',
    Devuelta:           'returned',
    Cancelada:          'cancelled',
    Cerrada:            'cancelled',
    // Legacy (registros anteriores)
    Entregada:          'delivered',
    Parcial:            'partial',
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
