import { useState, useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Btn from '@/components/Btn';
import Icon from '@/components/Icon';
import Pill from '@/components/Pill';
import { useRol } from '@/context/RolContext';
import type { SolicitudDB, Paginated, EstatusId } from '@/types';

// ── helpers ────────────────────────────────────────────────────────────
const mxMoney = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const mxFecha = (s: string) =>
    new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const mxHora = (s: string) =>
    new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ESTATUS_LABELS: Record<EstatusId, string> = {
    Pendiente: 'Pendiente', Aprobada: 'Aprobada', Parcial: 'Parcial',
    Rechazada: 'Rechazada', Entregada: 'Entregada', Cancelada: 'Cancelada',
    Devuelta: 'Devuelta', Cerrada: 'Cerrada',
};

type Mode = 'view' | 'add' | 'find' | 'results';

interface EditLinea {
    id?: number;
    codigo_articulo: string;
    descripcion: string;
    cantidad: number | string;
    unidad: string;
    costo_unitario: number | string;
    almacen_codigo: string;
    lote: string;
    proveedor: string;
}

interface EditState {
    orden_compra: string;
    fecha_solicitud: string;
    autorizador: string;
    lineas: EditLinea[];
}

// ── Page ───────────────────────────────────────────────────────────────
interface Props {
    solicitudes: Paginated<SolicitudDB>;
    filtros: { folio?: string; cliente?: string; estatus?: string; vendedor?: string; sel?: string };
}

export default function SolicitudesIndex({ solicitudes, filtros }: Props) {
    const { perms } = useRol();
    const { props: shared } = usePage<any>();
    const flash = shared.flash ?? {};

    const { sel: selFolio, ...filtrosSinSel } = filtros;
    const hasFilters = Object.values(filtrosSinSel).some(Boolean);
    const [mode, setMode] = useState<Mode>(hasFilters ? 'results' : 'view');
    const [idx, setIdx] = useState(0);
    const [hasSelection, setHasSelection] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [exportFilters, setExportFilters] = useState({
        fecha_ini: '', fecha_fin: '', cliente: '', estatus: '',
        vendedor: '', autorizador: '', producto: '', almacen: '', tipo_envio: '',
    });
    const [editData, setEditData] = useState<EditState | null>(null);
    const [editProcessing, setEditProcessing] = useState(false);
    const editing = editData !== null;

    // Find fields
    const [findFolio, setFindFolio] = useState(filtros.folio ?? '');
    const [findCliente, setFindCliente] = useState(filtros.cliente ?? '');
    const [findEstatus, setFindEstatus] = useState(filtros.estatus ?? '');
    const [findVendedor, setFindVendedor] = useState(filtros.vendedor ?? '');

    const list    = solicitudes.data;
    const safeIdx = Math.min(idx, Math.max(0, list.length - 1));
    const s       = hasSelection ? (list[safeIdx] ?? null) : null;

    const goPrev  = () => { setIdx(i => Math.max(0, i - 1)); setHasSelection(true); };
    const goNext  = () => { setIdx(i => Math.min(list.length - 1, i + 1)); setHasSelection(true); };
    const goFirst = () => { setIdx(0); setHasSelection(true); };
    const goLast  = () => { setIdx(list.length - 1); setHasSelection(true); };

    const enterAdd   = () => { addForm.reset(); setMode('add'); setHasSelection(false); };
    const cancelMode = () => { setMode('view'); setHasSelection(false); };

    const executeFind = () => {
        router.get('/solicitudes', {
            folio: findFolio || undefined,
            cliente: findCliente || undefined,
            estatus: findEstatus || undefined,
            vendedor: findVendedor || undefined,
        }, { replace: true });
    };

    const quickSearch = () => {
        const folio   = (document.getElementById('qs-folio')   as HTMLInputElement)?.value.trim() || undefined;
        const cliente = (document.getElementById('qs-cliente')  as HTMLInputElement)?.value.trim() || undefined;
        const estatus = (document.getElementById('qs-estatus')  as HTMLSelectElement)?.value || undefined;
        router.get('/solicitudes', { folio, cliente, estatus }, { replace: true });
    };

    useEffect(() => {
        if (hasFilters) setMode('results');
    }, [filtros]);

    useEffect(() => {
        if (selFolio) {
            const selIdx = list.findIndex(s => s.folio === selFolio);
            if (selIdx !== -1) {
                setIdx(selIdx);
                setHasSelection(true);
                setMode('view');
            }
        }
    }, [selFolio]);

    useEffect(() => { setEditData(null); }, [idx]);

    // add form
    const emptyLinea = () => ({ codigo_articulo: '', descripcion: '', proveedor: '', cantidad: 1, unidad: '', costo_unitario: 0, almacen_codigo: '', lote: '' });

    const addForm = useForm({
        cliente_codigo: '',
        cliente_nombre: '',
        orden_compra: '',
        comentarios: '',
        autorizador: '',
        lineas: [emptyLinea()],
    });

    const addLinea = () => {
        addForm.setData('lineas', [...addForm.data.lineas, emptyLinea()]);
    };

    const updateLinea = (i: number, field: string, val: number | string) => {
        const updated = addForm.data.lineas.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
        addForm.setData('lineas', updated);
    };

    const removeLinea = (i: number) => {
        if (addForm.data.lineas.length === 1) return;
        addForm.setData('lineas', addForm.data.lineas.filter((_, idx) => idx !== i));
    };

    // computed totals for add mode
    const addTotals = addForm.data.lineas.reduce(
        (acc, l) => ({ subtotal: acc.subtotal + (l.costo_unitario * l.cantidad) }),
        { subtotal: 0 },
    );
    const addIva = addTotals.subtotal * 0.16;
    const addTotal = addTotals.subtotal + addIva;

    const canSave = addForm.data.cliente_nombre.trim() !== '' &&
        addForm.data.lineas.some(l => l.descripcion.trim() !== '');

    const handleSave = () => {
        addForm.post('/solicitudes', {
            onSuccess: () => { setMode('view'); setIdx(0); setHasSelection(true); },
        });
    };

    const submitCancel = () => {
        if (!s) return;
        router.post(`/solicitudes/${s.folio}/cancelar`, {}, {
            onSuccess: () => setShowCancelDialog(false),
        });
    };

    const doExport = () => {
        const params = new URLSearchParams();
        Object.entries(exportFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
        window.location.href = `/solicitudes/export?${params.toString()}`;
    };

    const canEdit = !!s && (s.estatus === 'Pendiente' || s.estatus === 'Aprobada');

    const startEdit = () => {
        if (!s) return;
        setEditData({
            orden_compra: s.orden_compra ?? '',
            fecha_solicitud: s.fecha_solicitud
                ? new Date(s.fecha_solicitud).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            autorizador: s.autorizador ?? '',
            lineas: s.lineas.map(l => ({
                id: l.id,
                codigo_articulo: l.codigo_articulo ?? '',
                descripcion: l.descripcion ?? '',
                cantidad: l.cantidad,
                unidad: l.unidad ?? '',
                costo_unitario: l.costo_unitario,
                almacen_codigo: l.almacen_codigo ?? '',
                lote: l.lote ?? '',
                proveedor: l.proveedor ?? '',
            })),
        });
    };

    const cancelEdit = () => setEditData(null);

    const saveEdit = () => {
        if (!s || !editData) return;
        setEditProcessing(true);
        router.put(`/solicitudes/${s.folio}`, editData as any, {
            onSuccess: () => setEditData(null),
            onFinish: () => setEditProcessing(false),
        });
    };

    const updateEditField = (field: keyof Omit<EditState, 'lineas'>, val: string) => {
        setEditData(d => d ? { ...d, [field]: val } : d);
    };

    const updateEditLinea = (i: number, field: string, val: string | number) => {
        setEditData(d => {
            if (!d) return d;
            return { ...d, lineas: d.lineas.map((l, li) => li === i ? { ...l, [field]: val } : l) };
        });
    };

    const addEditLinea = () => {
        setEditData(d => d ? {
            ...d,
            lineas: [...d.lineas, { codigo_articulo: '', descripcion: '', cantidad: 1, unidad: '', costo_unitario: 0, almacen_codigo: '', lote: '', proveedor: '' }],
        } : d);
    };

    const removeEditLinea = (i: number) => {
        setEditData(d => {
            if (!d || d.lineas.length <= 1) return d;
            return { ...d, lineas: d.lineas.filter((_, li) => li !== i) };
        });
    };

    // view totals
    const viewSubtotal = s ? s.subtotal : 0;
    const viewIva = s ? s.iva : 0;
    const viewTotal = s ? s.total : 0;
    const isLocked = !!s && (s.estatus === 'Cancelada' || s.estatus === 'Cerrada');

    const editSubtotal = editData
        ? editData.lineas.reduce((acc, l) => acc + (parseFloat(String(l.costo_unitario)) || 0) * (parseFloat(String(l.cantidad)) || 0), 0)
        : 0;
    const editIva = editSubtotal * 0.16;
    const editTotal = editSubtotal + editIva;

    // title bar
    let titleText: string;
    let titleStatusText: string;
    let titlePill: React.ReactNode;
    if (mode === 'view') {
        titleText = s ? `Solicitud de muestra — ${s.folio}` : 'Solicitudes de muestra';
        titleStatusText = '';
        titlePill = s ? <Pill status={s.estatus}/> : null;
    } else if (mode === 'add') {
        titleText = 'Crear solicitud de muestra';
        titleStatusText = ' — Borrador (sin guardar)';
        titlePill = <span className="pill draft">Modo: Agregar</span>;
    } else if (mode === 'find') {
        titleText = 'Buscar solicitud de muestra';
        titleStatusText = ' — Captura criterios y presiona Buscar';
        titlePill = <span className="pill cancelled">Modo: Buscar</span>;
    } else {
        titleText = 'Resultados de búsqueda';
        titleStatusText = ` — ${solicitudes.total} coincidencias`;
        titlePill = <span className="pill draft">Modo: Resultados</span>;
    }

    return (
        <AppLayout>
            <div className="doc">
                {/* Title bar */}
                <div className="doc-titlebar">
                    <Icon name="list" size={13}/>
                    <div className="doc-title-text">
                        {titleText}
                        <span className="doc-title-status">{titleStatusText}</span>
                    </div>
                    {titlePill}
                    <div className="doc-win-btns">
                        <button title="Minimizar">−</button>
                        <button title="Maximizar">▢</button>
                    </div>
                </div>
                <div className="doc-strip"/>

                {/* Flash */}
                {(flash.success || flash.error) && (
                    <div style={{
                        padding: '8px 16px', fontSize: 12,
                        background: flash.success ? 'var(--st-approved-bg)' : 'var(--st-rejected-bg)',
                        borderBottom: '1px solid var(--line-1)',
                        color: flash.success ? 'var(--st-approved-ink)' : 'var(--st-rejected-ink)',
                    }}>
                        <Icon name={flash.success ? 'check' : 'x'} size={12} style={{ verticalAlign: '-1px', marginRight: 6 }}/>
                        {flash.success ?? flash.error}
                    </div>
                )}

                {/* Toolbar */}
                <div className="doc-toolbar">
                    <div className="row gap-2">
                        <Btn variant="ghost" size="sm" onClick={goFirst} disabled={mode !== 'view' || list.length === 0 || (hasSelection && safeIdx === 0)} title="Primero">⏮</Btn>
                        <Btn variant="ghost" size="sm" onClick={goPrev}  disabled={mode !== 'view' || list.length === 0 || (hasSelection && safeIdx === 0)} title="Anterior">◀</Btn>
                        <span style={{ fontSize: 11.5, color: 'var(--ink-2)', padding: '0 6px', minWidth: 70, textAlign: 'center' }}>
                            {mode === 'view' && hasSelection ? `${(solicitudes.from ?? 1) + safeIdx} de ${solicitudes.total}` : `— de ${solicitudes.total}`}
                        </span>
                        <Btn variant="ghost" size="sm" onClick={goNext} disabled={mode !== 'view' || list.length === 0 || (hasSelection && safeIdx >= list.length - 1)} title="Siguiente">▶</Btn>
                        <Btn variant="ghost" size="sm" onClick={goLast} disabled={mode !== 'view' || list.length === 0 || (hasSelection && safeIdx >= list.length - 1)} title="Último">⏭</Btn>
                    </div>
                    <div className="row gap-2">
                        <Btn variant="default" size="sm" icon="x" onClick={() => setHasSelection(false)}>Cerrar</Btn>
                    </div>
                </div>

                {/* ── VIEW mode ────────────────────────────────────────────────────── */}
                {mode === 'view' && s && (
                    <>
                        <div className="doc-head">
                            <div className="doc-fields">
                                <ReadField label="Cliente" value={s.cliente_codigo ?? ''} mono lookup locked/>
                                <ReadField label="Nombre del cliente" value={s.cliente_nombre} locked/>
                                {editing && editData ? (
                                    <EditField label="Orden de Compra">
                                        <input className="input mono" value={editData.orden_compra}
                                            onChange={e => updateEditField('orden_compra', e.target.value)}
                                            placeholder="OC-12345"/>
                                    </EditField>
                                ) : (
                                    <ReadField label="Orden de Compra" value={s.orden_compra ?? '—'} mono locked/>
                                )}
                            </div>
                            <div className="doc-fields">
                                <ReadField label="Folio" value={s.folio} mono locked/>
                                <ReadField label="Estatus" value={s.estatus} locked/>
                                {editing && editData ? (
                                    <EditField label="Fecha solicitud">
                                        <input className="input" type="date" value={editData.fecha_solicitud}
                                            onChange={e => updateEditField('fecha_solicitud', e.target.value)}/>
                                    </EditField>
                                ) : (
                                    <ReadField label="Fecha solicitud" value={mxHora(s.fecha_solicitud)} locked/>
                                )}
                            </div>
                        </div>

                        <div className="doc-body">
                            <div className="doc-grid-wrap" style={{ overflowX: 'auto' }}>
                                <table className="tbl">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th style={{ width: 110 }}>Código SIC</th>
                                            <th style={{ width: 180 }}>Descripción del artículo</th>
                                            <th style={{ width: 70 }} className="num">Cant.</th>
                                            <th style={{ width: 60 }}>Unidad</th>
                                            <th style={{ width: 100 }} className="num">Precio de venta</th>
                                            <th style={{ width: 65 }}>Imp.</th>
                                            <th style={{ width: 110 }} className="num">Total</th>
                                            <th style={{ width: 80 }}>Almacén</th>
                                            <th style={{ width: 100 }}>Lote</th>
                                            <th style={{ width: 130 }}>Proveedor</th>
                                            {editing && <th style={{ width: 30 }}></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editing && editData ? (
                                            <>
                                                {editData.lineas.map((l, i) => {
                                                    const lineTotal = (parseFloat(String(l.costo_unitario)) || 0) * (parseFloat(String(l.cantidad)) || 0);
                                                    return (
                                                        <tr key={l.id ?? `new-${i}`}>
                                                            <td className="num">{i + 1}</td>
                                                            <td>
                                                                <input className="input mono" value={l.codigo_articulo}
                                                                    onChange={e => updateEditLinea(i, 'codigo_articulo', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input" value={l.descripcion}
                                                                    onChange={e => updateEditLinea(i, 'descripcion', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, width: '100%' }}/>
                                                            </td>
                                                            <td className="num">
                                                                <input className="input" type="number" step="any" min="0" value={l.cantidad || ''}
                                                                    onChange={e => updateEditLinea(i, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                    style={{ height: 22, textAlign: 'right', border: 0, fontSize: 11.5, background: 'transparent' }}/>
                                                            </td>
                                                            <td>
                                                                <select className="input" value={l.unidad}
                                                                    onChange={e => updateEditLinea(i, 'unidad', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, padding: '0 4px' }}>
                                                                    <option value="">—</option>
                                                                    <option value="KG">Kilos</option>
                                                                    <option value="PZA">Pieza</option>
                                                                    <option value="LB">Libra</option>
                                                                </select>
                                                            </td>
                                                            <td className="num">
                                                                <input className="input" type="number" step="any" min="0" value={l.costo_unitario || ''}
                                                                    onChange={e => updateEditLinea(i, 'costo_unitario', parseFloat(e.target.value) || 0)}
                                                                    style={{ height: 22, textAlign: 'right', border: 0, fontSize: 11.5, background: 'transparent' }}/>
                                                            </td>
                                                            <td className="mono">IVA16</td>
                                                            <td className="num"><strong>{mxMoney(lineTotal)}</strong></td>
                                                            <td>
                                                                <input className="input" value={l.almacen_codigo}
                                                                    onChange={e => updateEditLinea(i, 'almacen_codigo', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input mono" value={l.lote}
                                                                    onChange={e => updateEditLinea(i, 'lote', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input" value={l.proveedor}
                                                                    onChange={e => updateEditLinea(i, 'proveedor', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, width: '100%' }}/>
                                                            </td>
                                                            <td>
                                                                {editData.lineas.length > 1 && (
                                                                    <button style={{ color: 'var(--st-rejected-ink)', fontSize: 14 }}
                                                                        onClick={() => removeEditLinea(i)}>×</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr>
                                                    <td className="num muted">{editData.lineas.length + 1}</td>
                                                    <td colSpan={11} style={{ padding: '4px 10px' }}>
                                                        <button style={{ color: 'var(--accent)', fontSize: 11.5 }}
                                                            onClick={addEditLinea}>+ Agregar artículo</button>
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            s.lineas.map((l, i) => (
                                                <tr key={l.id}>
                                                    <td className="num">{i + 1}</td>
                                                    <td className="mono">{l.codigo_articulo ?? l.articulo?.codigo_sic ?? '—'}</td>
                                                    <td>{l.descripcion ?? l.articulo?.descripcion}</td>
                                                    <td className="num"><strong>{l.cantidad}</strong></td>
                                                    <td>{l.unidad}</td>
                                                    <td className="num">{mxMoney(l.costo_unitario)}</td>
                                                    <td className="mono">IVA16</td>
                                                    <td className="num"><strong>{mxMoney(l.total_linea)}</strong></td>
                                                    <td>{l.almacen_codigo ?? l.almacen?.codigo ?? '—'}</td>
                                                    <td><input className="input mono" defaultValue={l.lote ?? ''} placeholder="—" readOnly={isLocked} style={{ height: 22, border: 0, background: isLocked ? 'var(--field-disabled)' : 'transparent', fontSize: 11.5, cursor: isLocked ? 'default' : undefined }}/></td>
                                                    <td>{l.proveedor ?? '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 field">
                                <label className="field-label">Comentarios</label>
                                <textarea className="textarea" defaultValue={s.comentarios ?? ''} placeholder="Agregar comentarios…" readOnly={isLocked} style={{ minHeight: 52, background: isLocked ? 'var(--field-disabled)' : undefined, cursor: isLocked ? 'default' : undefined }}/>
                            </div>

                            {/* Entregas registradas */}
                            {s.entregas && s.entregas.length > 0 && (
                                <div style={{ marginTop: 16, borderTop: '1px solid var(--line-1)', paddingTop: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon name="truck" size={11}/>
                                        Entregas registradas <span style={{ color: 'var(--accent)', fontWeight: 800 }}>({s.entregas.length})</span>
                                    </div>
                                    <table className="tbl">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 30 }}>#</th>
                                                <th style={{ width: 170 }}>Folio entrega</th>
                                                <th style={{ width: 130 }}>Fecha</th>
                                                <th style={{ width: 90 }}>Estatus</th>
                                                <th style={{ width: 120 }} className="num">Total</th>
                                                <th style={{ width: 50 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {s.entregas.map((e, i) => {
                                                const isCancelled = e.estatus === 'Cancelada';
                                                return (
                                                    <tr key={e.id}
                                                        style={{ cursor: 'pointer', opacity: isCancelled ? 0.65 : 1 }}
                                                        onClick={() => router.visit(`/solicitudes/${s.folio}/entrega/${e.id}`)}
                                                        onMouseEnter={ev => (ev.currentTarget.style.background = isCancelled ? 'var(--field-disabled)' : 'var(--accent-soft)')}
                                                        onMouseLeave={ev => (ev.currentTarget.style.background = '')}>
                                                        <td className="num muted">{i + 1}</td>
                                                        <td className="mono" style={{ fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>{e.folio}</td>
                                                        <td className="muted">{e.fecha_entrega ? mxFecha(e.fecha_entrega) : '—'}</td>
                                                        <td>
                                                            <span style={{
                                                                display: 'inline-block', padding: '1px 7px', borderRadius: 3, fontSize: 10.5, fontWeight: 600,
                                                                background: isCancelled ? 'var(--st-rejected-bg)' : 'var(--st-approved-bg)',
                                                                color: isCancelled ? 'var(--st-rejected-ink)' : 'var(--st-approved-ink)',
                                                            }}>{e.estatus}</span>
                                                        </td>
                                                        <td className="num"><strong style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{mxMoney(Number(e.total))}</strong></td>
                                                        <td style={{ textAlign: 'center', color: isCancelled ? 'var(--ink-3)' : 'var(--accent)', fontSize: 12 }}>Ver ▶</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="doc-foot">
                            <div className="doc-fields">
                                <div className="field">
                                    <label className="field-label">Autorizador</label>
                                    <select className="input"
                                        value={editing && editData ? editData.autorizador : (s?.autorizador ?? '')}
                                        onChange={e => editing && updateEditField('autorizador', e.target.value)}
                                        disabled={!editing}
                                        style={{ background: !editing ? 'var(--field-disabled)' : undefined, cursor: !editing ? 'default' : undefined }}>
                                        <option value="">— Seleccionar —</option>
                                        <option>Christianne Álvarez</option>
                                        <option>Ramon Gonzalez</option>
                                        <option>Ana Grijalva</option>
                                    </select>
                                </div>
                            </div>
                            <div className="doc-totals">
                                <ReadField label="Subtotal" value={mxMoney(editing ? editSubtotal : viewSubtotal)} num locked/>
                                <ReadField label="IVA 16%" value={mxMoney(editing ? editIva : viewIva)} num locked/>
                                <div className="field">
                                    <label className="field-label total">Total del documento</label>
                                    <input className="input num" value={mxMoney(editing ? editTotal : viewTotal)} readOnly
                                        style={{ textAlign: 'right', background: '#fff8e1', border: '1px solid var(--strip)', fontWeight: 700, fontSize: 14, height: 30, cursor: 'default' }}/>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {mode === 'view' && !s && (
                    <div className="doc-body" style={{ paddingTop: 12 }}>
                        {/* Barra de búsqueda rápida */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                            <input
                                className="input mono"
                                placeholder="Folio…"
                                defaultValue={filtros.folio ?? ''}
                                style={{ width: 140 }}
                                id="qs-folio"
                                onKeyDown={e => e.key === 'Enter' && quickSearch()}
                            />
                            <input
                                className="input"
                                placeholder="Cliente…"
                                defaultValue={filtros.cliente ?? ''}
                                style={{ flex: 1 }}
                                id="qs-cliente"
                                onKeyDown={e => e.key === 'Enter' && quickSearch()}
                            />
                            <select className="input" defaultValue={filtros.estatus ?? ''} style={{ width: 130 }} id="qs-estatus">
                                <option value="">Cualquier estatus</option>
                                {(['Pendiente','Aprobada','Parcial','Rechazada','Entregada','Cancelada','Devuelta','Cerrada'] as EstatusId[]).map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                            <Btn variant="accent" size="sm" icon="search" onClick={quickSearch}>Buscar</Btn>
                            {hasFilters && (
                                <Btn variant="ghost" size="sm" onClick={() => router.get('/solicitudes', {}, { replace: true })}>
                                    ✕ Limpiar
                                </Btn>
                            )}
                            <span style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                                {solicitudes.total} resultado{solicitudes.total !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {list.length === 0 ? (
                            <div className="empty">
                                {hasFilters
                                    ? 'No se encontraron solicitudes con esos criterios.'
                                    : 'No hay solicitudes. Usa el botón Crear para agregar una.'}
                            </div>
                        ) : (
                            <>
                                <div className="doc-grid-wrap">
                                    <table className="tbl">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 30 }}>#</th>
                                                <th style={{ width: 150 }}>Folio</th>
                                                <th>Cliente</th>
                                                <th style={{ width: 110 }}>Estatus</th>
                                                <th style={{ width: 100 }}>Entregas</th>
                                                <th style={{ width: 90 }}>Fecha</th>
                                                <th style={{ width: 110 }} className="num">Total</th>
                                                <th style={{ width: 36 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {list.map((sol, i) => {
                                                const nEntregas = sol.entregas?.length ?? 0;
                                                return (
                                                <tr key={sol.id}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => { setIdx(i); setHasSelection(true); }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                    <td className="num muted">{(solicitudes.from ?? 1) + i}</td>
                                                    <td className="mono" style={{ fontWeight: 600 }}>{sol.folio}</td>
                                                    <td>{sol.cliente_nombre}</td>
                                                    <td><Pill status={sol.estatus}/></td>
                                                    <td>
                                                        {nEntregas > 0 && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                fontSize: 11, fontWeight: 600,
                                                                color: nEntregas > 1 ? 'var(--st-partial-ink, #c07000)' : 'var(--ink-2)',
                                                            }}>
                                                                <Icon name="truck" size={11}/>
                                                                {nEntregas > 1 ? `${nEntregas} parciales` : '1 entrega'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="muted">{mxFecha(sol.fecha_solicitud)}</td>
                                                    <td className="num">{mxMoney(sol.total)}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>▶</td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {(solicitudes.prev_page_url || solicitudes.next_page_url) && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Btn variant="ghost" size="sm"
                                            disabled={!solicitudes.prev_page_url}
                                            onClick={() => solicitudes.prev_page_url && router.get(solicitudes.prev_page_url, {}, { replace: true })}>
                                            ◀ Anterior
                                        </Btn>
                                        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                                            Pág. {solicitudes.current_page} de {solicitudes.last_page}
                                        </span>
                                        <Btn variant="ghost" size="sm"
                                            disabled={!solicitudes.next_page_url}
                                            onClick={() => solicitudes.next_page_url && router.get(solicitudes.next_page_url, {}, { replace: true })}>
                                            Siguiente ▶
                                        </Btn>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── ADD mode ─────────────────────────────────────────────────────── */}
                {mode === 'add' && (
                    <>
                        <div className="doc-head">
                            <div className="doc-fields">
                                <EditField label="Cód. cliente">
                                    <input className="input mono" value={addForm.data.cliente_codigo}
                                        onChange={e => addForm.setData('cliente_codigo', e.target.value)}
                                        placeholder="C-1001"/>
                                    {addForm.errors.cliente_codigo && <span className="req">{addForm.errors.cliente_codigo}</span>}
                                </EditField>
                                <EditField label="Nombre del cliente" required>
                                    <input className="input" value={addForm.data.cliente_nombre}
                                        onChange={e => addForm.setData('cliente_nombre', e.target.value)}
                                        placeholder="Constructora Atlas"/>
                                    {addForm.errors.cliente_nombre && <span className="req">{addForm.errors.cliente_nombre}</span>}
                                </EditField>
                                <EditField label="Orden de Compra">
                                    <input className="input mono" value={addForm.data.orden_compra}
                                        onChange={e => addForm.setData('orden_compra', e.target.value)}
                                        placeholder="OC-12345"/>
                                </EditField>
                            </div>
                            <div className="doc-fields">
                                <ReadField label="Folio" value="(auto)" mono/>
                                <ReadField label="Estatus" value="Borrador"/>
                                <ReadField label="Fecha" value={new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}/>
                            </div>
                        </div>

                        <div className="doc-body">
                            <>
                                    <div className="doc-grid-wrap" style={{ overflowX: 'auto' }}>
                                        <table className="tbl">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 30 }}>#</th>
                                                    <th style={{ width: 110 }}>Código</th>
                                                    <th style={{ width: 180 }}>Descripción</th>
                                                    <th style={{ width: 70 }} className="num">Cantidad</th>
                                                    <th style={{ width: 80 }}>Unidad</th>
                                                    <th style={{ width: 100 }} className="num">Precio de venta</th>
                                                    <th style={{ width: 110 }} className="num">Total</th>
                                                    <th style={{ width: 80 }}>Almacén</th>
                                                    <th style={{ width: 90 }}>Lote</th>
                                                    <th style={{ width: 130 }}>Proveedor</th>
                                                    <th style={{ width: 30 }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addForm.data.lineas.map((l, i) => {
                                                    const lineTotal = l.costo_unitario * l.cantidad;
                                                    return (
                                                        <tr key={i}>
                                                            <td className="num">{i + 1}</td>
                                                            <td>
                                                                <input className="input mono" value={l.codigo_articulo}
                                                                    onChange={e => updateLinea(i, 'codigo_articulo', e.target.value)}
                                                                    placeholder="Código…"
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input" value={l.descripcion}
                                                                    onChange={e => updateLinea(i, 'descripcion', e.target.value)}
                                                                    placeholder="Descripción del artículo…"
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, width: '100%' }}/>
                                                            </td>
                                                            <td className="num">
                                                                <input className="input" type="number" step="any" min="0" value={l.cantidad || ''}
                                                                    onChange={e => updateLinea(i, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                    style={{ height: 22, textAlign: 'right', border: 0, fontSize: 11.5, background: 'transparent' }}/>
                                                            </td>
                                                            <td>
                                                                <select className="input" value={l.unidad}
                                                                    onChange={e => updateLinea(i, 'unidad', e.target.value)}
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, padding: '0 4px' }}>
                                                                    <option value="">—</option>
                                                                    <option value="KG">Kilos</option>
                                                                    <option value="PZA">Pieza</option>
                                                                    <option value="LB">Libra</option>
                                                                </select>
                                                            </td>
                                                            <td className="num">
                                                                <input className="input" type="number" step="any" min="0" value={l.costo_unitario || ''}
                                                                    onChange={e => updateLinea(i, 'costo_unitario', parseFloat(e.target.value) || 0)}
                                                                    style={{ height: 22, textAlign: 'right', border: 0, fontSize: 11.5, background: 'transparent' }}/>
                                                            </td>
                                                            <td className="num"><strong>{mxMoney(lineTotal)}</strong></td>
                                                            <td>
                                                                <input className="input" value={l.almacen_codigo}
                                                                    onChange={e => updateLinea(i, 'almacen_codigo', e.target.value)}
                                                                    placeholder="ALM-01"
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input mono" value={l.lote}
                                                                    onChange={e => updateLinea(i, 'lote', e.target.value)}
                                                                    placeholder="Lote…"
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5 }}/>
                                                            </td>
                                                            <td>
                                                                <input className="input" value={l.proveedor}
                                                                    onChange={e => updateLinea(i, 'proveedor', e.target.value)}
                                                                    placeholder="Proveedor…"
                                                                    style={{ height: 22, border: 0, background: 'transparent', fontSize: 11.5, width: '100%' }}/>
                                                            </td>
                                                            <td>
                                                                {addForm.data.lineas.length > 1 && (
                                                                    <button style={{ color: 'var(--st-rejected-ink)', fontSize: 12 }}
                                                                        onClick={() => removeLinea(i)}>×</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr>
                                                    <td className="num muted">{addForm.data.lineas.length + 1}</td>
                                                    <td colSpan={10} style={{ padding: '4px 10px' }}>
                                                        <button style={{ color: 'var(--accent)', fontSize: 11.5 }}
                                                            onClick={addLinea}>+ Agregar artículo</button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-3 field">
                                        <label className="field-label">Comentarios</label>
                                        <textarea className="textarea" value={addForm.data.comentarios}
                                            onChange={e => addForm.setData('comentarios', e.target.value)}
                                            placeholder="Notas…" style={{ minHeight: 52 }}/>
                                    </div>
                                </>
                        </div>

                        <div className="doc-foot">
                            <div className="doc-fields">
                                <div className="field">
                                    <label className="field-label">Autorizador</label>
                                    <select className="input" value={addForm.data.autorizador}
                                        onChange={e => addForm.setData('autorizador', e.target.value)}>
                                        <option value="">— Seleccionar —</option>
                                        <option>Christianne Álvarez</option>
                                        <option>Ramon Gonzalez</option>
                                        <option>Ana Grijalva</option>
                                    </select>
                                </div>
                            </div>
                            <div className="doc-totals">
                                <ReadField label="Subtotal" value={mxMoney(addTotals.subtotal)} num/>
                                <ReadField label="IVA 16%" value={mxMoney(addIva)} num/>
                                <div className="field">
                                    <label className="field-label total">Total del documento</label>
                                    <input className="input num" value={mxMoney(addTotal)} readOnly
                                        style={{ textAlign: 'right', background: '#fff8e1', border: '1px solid var(--strip)', fontWeight: 700, fontSize: 14, height: 30 }}/>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── FIND mode ─────────────────────────────────────────────────────── */}
                {mode === 'find' && (
                    <>
                        <div style={{ padding: '8px 16px', background: '#fffbeb', borderBottom: '1px solid var(--strip)', fontSize: 12, color: '#7a4d00' }}>
                            <Icon name="search" size={12} style={{ verticalAlign: '-2px', marginRight: 6 }}/>
                            <strong>Modo Buscar.</strong> Captura uno o más criterios y presiona{' '}
                            <kbd style={{ padding: '1px 5px', background: 'var(--bg-elev)', border: '1px solid var(--line-2)', borderRadius: 2, fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>Buscar</kbd>.
                        </div>
                        <div className="doc-head">
                            <div className="doc-fields">
                                <EditField label="Folio">
                                    <input className="input mono" value={findFolio} onChange={e => setFindFolio(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && executeFind()} placeholder="SOL-2026-*"/>
                                </EditField>
                                <EditField label="Cliente (nombre)">
                                    <input className="input" value={findCliente} onChange={e => setFindCliente(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && executeFind()} placeholder="Atlas, Constructora…"/>
                                </EditField>
                                <EditField label="Vendedor">
                                    <input className="input" value={findVendedor} onChange={e => setFindVendedor(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && executeFind()} placeholder="Nombre del vendedor"/>
                                </EditField>
                            </div>
                            <div className="doc-fields">
                                <EditField label="Estatus">
                                    <select className="input" value={findEstatus} onChange={e => setFindEstatus(e.target.value)}>
                                        <option value="">Cualquiera</option>
                                        {(['Pendiente','Aprobada','Parcial','Rechazada','Entregada','Cancelada','Devuelta','Cerrada'] as EstatusId[]).map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </EditField>
                            </div>
                        </div>
                        <div className="doc-body" style={{ paddingTop: 12 }}>
                            <div className="row gap-2">
                                <Btn variant="accent" icon="search" onClick={executeFind}>Buscar</Btn>
                                <Btn variant="default" icon="rotate-ccw" onClick={() => { setFindFolio(''); setFindCliente(''); setFindEstatus(''); setFindVendedor(''); }}>
                                    Limpiar criterios
                                </Btn>
                                <div className="fb-spacer"/>
                                <span className="muted" style={{ fontSize: 11.5 }}>Atajo: <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Enter</kbd></span>
                            </div>
                        </div>
                    </>
                )}

                {/* ── RESULTS mode ──────────────────────────────────────────────────── */}
                {mode === 'results' && (
                    <div className="doc-body" style={{ paddingTop: 12 }}>
                        <div className="row mb-2">
                            <Btn variant="ghost" size="sm" onClick={() => setMode('find')}>◀ Volver a criterios</Btn>
                            <div className="fb-spacer"/>
                            <span className="muted" style={{ fontSize: 12 }}>{solicitudes.total} resultados</span>
                        </div>
                        <div className="doc-grid-wrap">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th style={{ width: 30 }}>#</th>
                                        <th>Folio</th><th>Estatus</th><th>Cliente</th>
                                        <th className="num">Artículos</th><th>Vendedor</th>
                                        <th>Fecha</th><th className="num">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((sol, i) => (
                                        <tr key={sol.id} onClick={() => { setIdx(i); setMode('view'); setHasSelection(true); }}>
                                            <td className="num">{(solicitudes.from ?? 1) + i}</td>
                                            <td className="mono">{sol.folio}</td>
                                            <td><Pill status={sol.estatus}/></td>
                                            <td>{sol.cliente_nombre}</td>
                                            <td className="num">{sol.lineas?.length ?? 0}</td>
                                            <td>{sol.vendedor}</td>
                                            <td className="muted">{mxFecha(sol.fecha_solicitud)}</td>
                                            <td className="num">{mxMoney(sol.total)}</td>
                                        </tr>
                                    ))}
                                    {list.length === 0 && (
                                        <tr><td colSpan={8}><div className="empty">No se encontraron solicitudes con esos criterios.</div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Action bar ────────────────────────────────────────────────────── */}
                {mode === 'view' && (
                    <div className="doc-actions">
                        <Btn variant="default" icon="plus" onClick={enterAdd} disabled={!perms.nueva || !!flash.success || !!s}>Crear</Btn>
                        <Btn variant="default" icon="download" onClick={() => setShowExportPanel(true)}>Exportar Excel</Btn>
                        {s && !editing && <Btn variant="default" icon="download">PDF</Btn>}
                        {s && !editing && s.estatus !== 'Cancelada' && s.estatus !== 'Entrega completa' && s.estatus !== 'Entregada' && s.estatus !== 'Cerrada' && (
                            <Btn variant="danger" icon="x" onClick={() => setShowCancelDialog(true)}>
                                Cancelar doc.
                            </Btn>
                        )}
                        <div className="right">
                            {!editing && s && (s.estatus === 'Entrega completa' || s.estatus === 'Entrega parcial' || s.estatus === 'Entregada' || s.estatus === 'Parcial') && s.entregas && s.entregas.length > 0 && (
                                <Btn variant="default" icon="truck"
                                    onClick={() => router.visit(`/solicitudes/${s.folio}/entrega/${s.entregas![s.entregas!.length - 1].id}`)}>
                                    Ver entregas ({s.entregas.length})
                                </Btn>
                            )}
                            {!editing && s && s.estatus !== 'Cancelada' && s.estatus !== 'Rechazada' && s.estatus !== 'Entrega completa' && s.estatus !== 'Entregada' && s.estatus !== 'Cerrada' && (
                                <CopiarADropdown folio={s.folio}/>
                            )}
                            {canEdit && !editing && (
                                <Btn variant="default" onClick={startEdit}>Editar</Btn>
                            )}
                            {editing && (
                                <>
                                    <Btn variant="default" onClick={cancelEdit}>Cancelar</Btn>
                                    <Btn variant="accent" icon="check" onClick={saveEdit} disabled={editProcessing}>
                                        {editProcessing ? 'Guardando…' : 'Guardar cambios'}
                                    </Btn>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'add' && (
                    <div className="doc-actions">
                        <Btn variant="accent" icon="check" onClick={handleSave} disabled={addForm.processing || !canSave}>
                            {addForm.processing ? 'Guardando…' : 'OK — Guardar'}
                        </Btn>
                        <Btn variant="default" onClick={cancelMode}>Cancelar</Btn>
                    </div>
                )}

                {mode === 'find' && (
                    <div className="doc-actions">
                        <Btn variant="accent" icon="search" onClick={executeFind}>Buscar</Btn>
                        <Btn variant="default" onClick={cancelMode}>Cancelar modo</Btn>
                    </div>
                )}

                {mode === 'results' && (
                    <div className="doc-actions">
                        <Btn variant="default" onClick={cancelMode}>Cerrar resultados</Btn>
                    </div>
                )}


            </div>

            {showCancelDialog && s && (
                <SimpleDialog
                    title={`¿Cancelar solicitud ${s.folio}?`}
                    icon="x-circle"
                    iconColor="var(--st-rejected-ink)"
                    confirmLabel="Sí, cancelar"
                    confirmVariant="danger"
                    onConfirm={submitCancel}
                    onCancel={() => setShowCancelDialog(false)}
                >
                    <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
                        Esta acción cambiará el estatus a <strong>Cancelada</strong> y no se podrá revertir.
                    </p>
                </SimpleDialog>
            )}

            {showExportPanel && (
                <ExportPanel
                    filters={exportFilters}
                    onChange={setExportFilters}
                    onExport={() => { doExport(); setShowExportPanel(false); }}
                    onClose={() => setShowExportPanel(false)}
                />
            )}
        </AppLayout>
    );
}

// ── Helper sub-components ──────────────────────────────────────────────
function ReadField({ label, value, mono, num, highlight, lookup, locked }: {
    label: string; value: string; mono?: boolean; num?: boolean; highlight?: boolean; lookup?: boolean; locked?: boolean;
}) {
    const lockedStyle = locked ? { background: 'var(--field-disabled)', cursor: 'default' } : {};
    return (
        <div className="field">
            <label className="field-label">{label}</label>
            {lookup ? (
                <div className="lookup">
                    <input className={`input ${mono ? 'mono' : ''}`} defaultValue={value} readOnly={locked}
                        style={{ borderRadius: '2px 0 0 2px', ...lockedStyle }}/>
                    <button className="lookup-btn" disabled={locked}>▶</button>
                </div>
            ) : (
                <input className={`input ${mono ? 'mono' : ''} ${num ? 'num' : ''}`} defaultValue={value} readOnly={locked}
                    style={{
                        background: locked ? 'var(--field-disabled)' : highlight ? '#fff8e1' : undefined,
                        borderColor: highlight && !locked ? 'var(--strip)' : undefined,
                        fontWeight: highlight ? 600 : undefined,
                        textAlign: num ? 'right' : undefined,
                        cursor: locked ? 'default' : undefined,
                    }}/>
            )}
        </div>
    );
}

function EditField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="field">
            <label className="field-label">{label} {required && <span className="req">*</span>}</label>
            {children}
        </div>
    );
}

function CopiarADropdown({ folio }: { folio: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <Btn variant="accent" icon="arrow-right" onClick={() => setOpen(o => !o)}>
                Copiar a ▾
            </Btn>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }}/>
                    <div style={{
                        position: 'absolute', right: 0, bottom: 'calc(100% + 4px)',
                        background: 'var(--bg-elev)', border: '1px solid var(--line-3)',
                        borderRadius: 2, boxShadow: 'var(--shadow-lg)', minWidth: 220,
                        padding: 4, zIndex: 51,
                    }}>
                        <div style={{ padding: '6px 10px 4px', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                            Crear documento desde esta solicitud
                        </div>
                        <div
                            onClick={() => { setOpen(false); router.visit(`/solicitudes/${folio}/entrega/nueva`); }}
                            style={{ padding: '8px 10px', fontSize: 12.5, cursor: 'pointer', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 8 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Icon name="truck" size={14} style={{ color: 'var(--accent)' }}/>
                            <div>
                                <div style={{ fontWeight: 500 }}>Entrega de muestra</div>
                                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>Registrar salida y evidencia</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface ExportFilters {
    fecha_ini: string; fecha_fin: string; cliente: string; estatus: string;
    vendedor: string; autorizador: string; producto: string; almacen: string; tipo_envio: string;
}

function ExportPanel({ filters, onChange, onExport, onClose }: {
    filters: ExportFilters;
    onChange: (f: ExportFilters) => void;
    onExport: () => void;
    onClose: () => void;
}) {
    const set = (k: keyof ExportFilters, v: string) => onChange({ ...filters, [k]: v });
    const anyFilter = Object.values(filters).some(Boolean);

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} onClick={onClose}/>
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--bg-elev)', border: '1px solid var(--line-2)',
                borderRadius: 4, boxShadow: 'var(--shadow-lg)', width: 540, maxWidth: '95vw', zIndex: 301, padding: 20,
            }}>
                <div className="row gap-2" style={{ marginBottom: 16 }}>
                    <Icon name="download" size={16} style={{ color: 'var(--accent)' }}/>
                    <strong style={{ fontSize: 14 }}>Exportar a Excel</strong>
                    <div className="fb-spacer"/>
                    <button onClick={onClose} style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1 }}>×</button>
                </div>

                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 14px' }}>
                    Aplica filtros opcionales. Sin filtros se exporta el historial completo.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                    <div className="field">
                        <label className="field-label">Fecha solicitud — desde</label>
                        <input className="input" type="date" value={filters.fecha_ini}
                            onChange={e => set('fecha_ini', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Fecha solicitud — hasta</label>
                        <input className="input" type="date" value={filters.fecha_fin}
                            onChange={e => set('fecha_fin', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Cliente (contiene)</label>
                        <input className="input" value={filters.cliente} placeholder="Nombre del cliente…"
                            onChange={e => set('cliente', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Estatus</label>
                        <select className="input" value={filters.estatus} onChange={e => set('estatus', e.target.value)}>
                            <option value="">Cualquiera</option>
                            <option>Pendiente</option>
                            <option>Aprobada</option>
                            <option>Entrega completa</option>
                            <option>Entrega parcial</option>
                            <option>Rechazada</option>
                            <option>Cancelada</option>
                            <option>Devuelta</option>
                            <option>Cerrada</option>
                        </select>
                    </div>
                    <div className="field">
                        <label className="field-label">Vendedor (contiene)</label>
                        <input className="input" value={filters.vendedor} placeholder="Nombre del vendedor…"
                            onChange={e => set('vendedor', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Autorizador (contiene)</label>
                        <input className="input" value={filters.autorizador} placeholder="Nombre del autorizador…"
                            onChange={e => set('autorizador', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Producto / Descripción (contiene)</label>
                        <input className="input" value={filters.producto} placeholder="Artículo, descripción…"
                            onChange={e => set('producto', e.target.value)}/>
                    </div>
                    <div className="field">
                        <label className="field-label">Almacén (contiene)</label>
                        <input className="input" value={filters.almacen} placeholder="Código de almacén…"
                            onChange={e => set('almacen', e.target.value)}/>
                    </div>
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Tipo de envío</label>
                        <select className="input" value={filters.tipo_envio} onChange={e => set('tipo_envio', e.target.value)}
                            style={{ maxWidth: 220 }}>
                            <option value="">Cualquiera</option>
                            <option value="Mensajería">Mensajería</option>
                            <option value="Paquetería">Paquetería</option>
                            <option value="Recolección">Recolección en planta</option>
                            <option value="Entrega directa">Entrega directa</option>
                        </select>
                    </div>
                </div>

                {anyFilter && (
                    <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="filter" size={11}/>
                        Filtros activos: {Object.entries(filters).filter(([,v]) => v).map(([k]) => k).join(', ')}
                    </div>
                )}

                <div className="row gap-2" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
                    {anyFilter && (
                        <Btn variant="ghost" size="sm"
                            onClick={() => onChange({ fecha_ini:'',fecha_fin:'',cliente:'',estatus:'',vendedor:'',autorizador:'',producto:'',almacen:'',tipo_envio:'' })}>
                            Limpiar filtros
                        </Btn>
                    )}
                    <Btn variant="default" onClick={onClose}>Cancelar</Btn>
                    <Btn variant="accent" icon="download" onClick={onExport}>
                        Descargar Excel
                    </Btn>
                </div>
            </div>
        </>
    );
}

function SimpleDialog({ title, icon, iconColor, children, onConfirm, onCancel, confirmLabel, confirmVariant }: {
    title: string; icon: string; iconColor: string; children: React.ReactNode;
    onConfirm: () => void; onCancel: () => void; confirmLabel: string;
    confirmVariant: 'accent' | 'danger' | 'primary';
}) {
    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} onClick={onCancel}/>
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--bg-elev)', border: '1px solid var(--line-2)',
                borderRadius: 4, boxShadow: 'var(--shadow-lg)', minWidth: 360, maxWidth: 480, zIndex: 301, padding: 20,
            }}>
                <div className="row gap-2" style={{ marginBottom: 16 }}>
                    <Icon name={icon} size={16} style={{ color: iconColor }}/>
                    <strong style={{ fontSize: 14 }}>{title}</strong>
                </div>
                {children}
                <div className="row gap-2" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                    <Btn variant="default" onClick={onCancel}>Cancelar</Btn>
                    <Btn variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Btn>
                </div>
            </div>
        </>
    );
}
