import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Btn from '@/components/Btn';
import Icon from '@/components/Icon';
import type { SolicitudDB, EntregaDB } from '@/types';

const mxMoney = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const mxHora = (s: string) =>
    new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const mxFecha = (s: string) =>
    new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const toDateInput = (s: string | null) => s ? new Date(s).toISOString().slice(0, 10) : '';

interface EntregaResumen {
    id: number;
    folio: string;
    fecha_entrega: string | null;
    total: number;
    estatus: string;
}

interface Props {
    solicitud: SolicitudDB;
    entrega: EntregaDB;
    todas_entregas: EntregaResumen[];
}

export default function EntregasShow({ solicitud: s, entrega: e, todas_entregas }: Props) {
    const { props: shared } = usePage<any>();
    const flash = shared.flash ?? {};

    const subtotal = e.subtotal ?? 0;
    const iva = e.iva ?? 0;
    const total = e.total ?? 0;

    const currentIdx = todas_entregas.findIndex(x => x.id === e.id);
    const prevEntrega = currentIdx > 0 ? todas_entregas[currentIdx - 1] : null;
    const nextEntrega = currentIdx < todas_entregas.length - 1 ? todas_entregas[currentIdx + 1] : null;

    const isCancelled = e.estatus === 'Cancelada';

    const [editing, setEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const form = useForm({
        fecha_entrega:   toDateInput(e.fecha_entrega),
        destinatario:    e.destinatario    ?? '',
        direccion_envio: e.direccion_envio ?? '',
        ciudad:          e.ciudad          ?? '',
        estado:          e.estado          ?? '',
        cp:              e.cp              ?? '',
        telefono:        e.telefono        ?? '',
        forma_envio:     e.forma_envio     ?? 'Paquetería',
        paqueteria:      e.paqueteria      ?? '',
        numero_guia:     e.numero_guia     ?? '',
    });

    const handleSave = () => {
        form.put(`/solicitudes/${s.folio}/entrega/${e.id}`, {
            onSuccess: () => setEditing(false),
        });
    };

    const handleCancel = () => {
        form.reset();
        setEditing(false);
    };

    const handleCancelEntrega = () => {
        setCancelling(true);
        router.post(`/solicitudes/${s.folio}/entrega/${e.id}/cancelar`, {}, {
            onSuccess: () => setShowCancelDialog(false),
            onFinish:  () => setCancelling(false),
        });
    };

    return (
        <AppLayout>
            <div className="doc">
                {/* Title bar */}
                <div className="doc-titlebar">
                    <Icon name="truck" size={13}/>
                    <div className="doc-title-text">
                        Entrega de muestra — <span style={{ fontFamily: 'var(--font-mono)' }}>{e.folio}</span>
                        <span className="doc-title-status"> · desde {s.folio}</span>
                    </div>
                    <span className={`pill ${isCancelled ? 'cancelled' : 'approved'}`}>{e.estatus}</span>
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

                {/* Banner cancelada */}
                {isCancelled && (
                    <div style={{ padding: '8px 16px', fontSize: 12, background: 'var(--st-rejected-bg)', borderBottom: '1px solid var(--line-1)', color: 'var(--st-rejected-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="x-circle" size={13}/>
                        Esta entrega fue cancelada. Las cantidades volvieron a estar pendientes en la solicitud.
                    </div>
                )}

                {/* Toolbar */}
                <div className="doc-toolbar">
                    <div className="row gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>
                            ◀ Volver a solicitud
                        </Btn>
                        {todas_entregas.length > 1 && (
                            <>
                                <Btn variant="ghost" size="sm" disabled={!prevEntrega}
                                    onClick={() => prevEntrega && router.visit(`/solicitudes/${s.folio}/entrega/${prevEntrega.id}`)}>
                                    ◀
                                </Btn>
                                <span style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                                    {currentIdx + 1} de {todas_entregas.length}
                                </span>
                                <Btn variant="ghost" size="sm" disabled={!nextEntrega}
                                    onClick={() => nextEntrega && router.visit(`/solicitudes/${s.folio}/entrega/${nextEntrega.id}`)}>
                                    ▶
                                </Btn>
                            </>
                        )}
                    </div>
                    <div className="row gap-2">
                        <Btn variant="default" size="sm" icon="x" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>Cerrar</Btn>
                    </div>
                </div>

                {/* Header */}
                <div className="doc-head" style={{ opacity: isCancelled ? 0.7 : 1 }}>
                    <div className="doc-fields">
                        <Field label="Cód. cliente"       value={s.cliente_codigo ?? ''} mono/>
                        <Field label="Nombre del cliente" value={s.cliente_nombre}/>
                        <Field label="Orden de Compra"    value={s.orden_compra ?? '—'} mono/>
                        <Field label="Solicitud origen"   value={s.folio} mono highlight/>
                        <Field label="Fecha solicitud"    value={mxHora(s.fecha_solicitud)}/>
                    </div>
                    <div className="doc-fields">
                        <Field label="Folio entrega" value={e.folio} mono/>
                        <Field label="Estatus"       value={e.estatus}/>
                        <div className="field">
                            <label className="field-label">Fecha entrega</label>
                            {editing
                                ? <input className="input" type="date" value={form.data.fecha_entrega}
                                    onChange={ev => form.setData('fecha_entrega', ev.target.value)}/>
                                : <input className="input" readOnly value={e.fecha_entrega ? mxHora(e.fecha_entrega) : '—'}
                                    style={{ background: 'var(--field-disabled)', cursor: 'default' }}/>
                            }
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="doc-body" style={{ opacity: isCancelled ? 0.7 : 1 }}>
                    <div className="doc-grid-wrap" style={{ overflowX: 'auto' }}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: 30 }}>#</th>
                                    <th style={{ width: 110 }}>Código</th>
                                    <th style={{ width: 180 }}>Descripción</th>
                                    <th style={{ width: 90 }} className="num">Cant. solicitada</th>
                                    <th style={{ width: 90 }} className="num">Cant. entregada</th>
                                    <th style={{ width: 60 }}>Unidad</th>
                                    <th style={{ width: 100 }} className="num">Precio de venta</th>
                                    <th style={{ width: 110 }} className="num">Total</th>
                                    <th style={{ width: 80 }}>Almacén</th>
                                    <th style={{ width: 90 }}>Lote</th>
                                    <th style={{ width: 130 }}>Proveedor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {s.lineas.map((l, i) => {
                                    const det = e.lineas?.[i];
                                    const qEnt = det?.cantidad_entregada ?? l.cantidad;
                                    return (
                                        <tr key={l.id}>
                                            <td className="num">{i + 1}</td>
                                            <td className="mono">{l.codigo_articulo ?? '—'}</td>
                                            <td>{l.descripcion}</td>
                                            <td className="num">{l.cantidad}</td>
                                            <td className="num"><strong>{qEnt}</strong></td>
                                            <td>{l.unidad}</td>
                                            <td className="num">{mxMoney(l.costo_unitario)}</td>
                                            <td className="num"><strong>{mxMoney(l.costo_unitario * qEnt)}</strong></td>
                                            <td>{det?.almacen_codigo ?? l.almacen_codigo ?? '—'}</td>
                                            <td className="mono">{det?.lote ?? l.lote ?? '—'}</td>
                                            <td>{det?.proveedor ?? l.proveedor ?? '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 field">
                        <label className="field-label">Comentarios</label>
                        <textarea className="textarea" defaultValue={e.comentarios ?? ''} readOnly
                            placeholder="Sin comentarios"
                            style={{ minHeight: 52, background: 'var(--field-disabled)', cursor: 'default' }}/>
                    </div>

                    {/* Datos de envío */}
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--line-1)', paddingTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon name="truck" size={11}/>
                            Datos de envío
                            {!editing && !isCancelled && (
                                <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}
                                    onClick={() => setEditing(true)}>
                                    ✎ Editar
                                </span>
                            )}
                        </div>

                        {editing ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    <div className="field" style={{ gridColumn: 'span 2' }}>
                                        <label className="field-label">Destinatario</label>
                                        <input className="input" value={form.data.destinatario}
                                            onChange={ev => form.setData('destinatario', ev.target.value)}
                                            placeholder="Nombre de quien recibe…"/>
                                    </div>
                                    <div className="field">
                                        <label className="field-label">Teléfono</label>
                                        <input className="input" value={form.data.telefono}
                                            onChange={ev => form.setData('telefono', ev.target.value)}
                                            placeholder="55 1234 5678"/>
                                    </div>
                                    <div className="field" style={{ gridColumn: 'span 3' }}>
                                        <label className="field-label">Dirección de envío</label>
                                        <input className="input" value={form.data.direccion_envio}
                                            onChange={ev => form.setData('direccion_envio', ev.target.value)}
                                            placeholder="Calle, número, colonia…"/>
                                    </div>
                                    <div className="field">
                                        <label className="field-label">Ciudad</label>
                                        <input className="input" value={form.data.ciudad}
                                            onChange={ev => form.setData('ciudad', ev.target.value)}/>
                                    </div>
                                    <div className="field">
                                        <label className="field-label">Estado</label>
                                        <input className="input" value={form.data.estado}
                                            onChange={ev => form.setData('estado', ev.target.value)}/>
                                    </div>
                                    <div className="field">
                                        <label className="field-label">C.P.</label>
                                        <input className="input" value={form.data.cp}
                                            onChange={ev => form.setData('cp', ev.target.value)}/>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                                    <div className="field">
                                        <label className="field-label">Forma de envío</label>
                                        <select className="input" value={form.data.forma_envio}
                                            onChange={ev => form.setData('forma_envio', ev.target.value)}>
                                            <option>Paquetería</option>
                                            <option>Entrega directa por vendedor</option>
                                            <option>Recolección en sucursal</option>
                                        </select>
                                    </div>
                                    {form.data.forma_envio === 'Paquetería' && (
                                        <>
                                            <div className="field">
                                                <label className="field-label">Paquetería</label>
                                                <select className="input" value={form.data.paqueteria}
                                                    onChange={ev => form.setData('paqueteria', ev.target.value)}>
                                                    <option value="">— Seleccionar —</option>
                                                    <option>Estafeta</option>
                                                    <option>FedEx</option>
                                                    <option>DHL</option>
                                                    <option>Vía propia</option>
                                                    <option>Otra</option>
                                                </select>
                                            </div>
                                            <div className="field">
                                                <label className="field-label">Número de guía</label>
                                                <input className="input mono" value={form.data.numero_guia}
                                                    onChange={ev => form.setData('numero_guia', ev.target.value)}
                                                    placeholder="123456789"/>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <div style={{ gridColumn: 'span 2' }}><Field label="Destinatario" value={e.destinatario ?? '—'}/></div>
                                <Field label="Teléfono" value={e.telefono ?? '—'}/>
                                <div style={{ gridColumn: 'span 3' }}><Field label="Dirección de envío" value={e.direccion_envio ?? '—'}/></div>
                                <Field label="Ciudad" value={e.ciudad ?? '—'}/>
                                <Field label="Estado" value={e.estado ?? '—'}/>
                                <Field label="C.P." value={e.cp ?? '—'}/>
                                <Field label="Forma de envío" value={e.forma_envio ?? '—'}/>
                                {e.paqueteria && <Field label="Paquetería" value={e.paqueteria}/>}
                                {e.numero_guia && <Field label="Número de guía" value={e.numero_guia} mono/>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="doc-foot" style={{ opacity: isCancelled ? 0.7 : 1 }}>
                    <div className="doc-fields">
                        <div className="field">
                            <label className="field-label">Autorizador</label>
                            <select className="input" value={e.autorizador ?? ''} disabled
                                style={{ background: 'var(--field-disabled)', cursor: 'default' }}>
                                <option value="">— Seleccionar —</option>
                                <option>Christianne Álvarez</option>
                                <option>Ramon Gonzalez</option>
                                <option>Ana Grijalva</option>
                            </select>
                        </div>
                    </div>
                    <div className="doc-totals">
                        <Field label="Subtotal" value={mxMoney(subtotal)} num/>
                        <Field label="IVA 16%" value={mxMoney(iva)} num/>
                        <div className="field">
                            <label className="field-label total">Total del documento</label>
                            <input className="input num" defaultValue={mxMoney(total)} readOnly
                                style={{ textAlign: 'right', background: '#fff8e1', border: '1px solid var(--strip)', fontWeight: 700, fontSize: 14, height: 30 }}/>
                        </div>
                    </div>
                </div>

                {/* Action bar */}
                <div className="doc-actions">
                    <Btn variant="default" icon="download">PDF</Btn>
                    {!isCancelled && (
                        <Btn variant="danger" icon="x" onClick={() => setShowCancelDialog(true)}>
                            Cancelar entrega
                        </Btn>
                    )}
                    <Btn variant="default" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>Cerrar</Btn>
                    {editing && !isCancelled && (
                        <div className="right">
                            <Btn variant="default" onClick={handleCancel}>Cancelar</Btn>
                            <Btn variant="accent" icon="check" onClick={handleSave} disabled={form.processing}>
                                {form.processing ? 'Guardando…' : 'Guardar cambios'}
                            </Btn>
                        </div>
                    )}
                </div>
            </div>

            {/* Diálogo confirmación cancelar entrega */}
            {showCancelDialog && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }}
                        onClick={() => setShowCancelDialog(false)}/>
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        background: 'var(--bg-elev)', border: '1px solid var(--line-2)', borderRadius: 4,
                        boxShadow: 'var(--shadow-lg)', minWidth: 380, maxWidth: 480, zIndex: 301, padding: 20,
                    }}>
                        <div className="row gap-2" style={{ marginBottom: 12 }}>
                            <Icon name="x-circle" size={16} style={{ color: 'var(--st-rejected-ink)' }}/>
                            <strong style={{ fontSize: 14 }}>¿Cancelar entrega {e.folio}?</strong>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 16px' }}>
                            Las cantidades entregadas en este documento se reincorporarán como
                            pendientes y la solicitud <strong>{s.folio}</strong> volverá a
                            estatus <strong>Pendiente</strong> (o Entrega parcial si hay otras entregas activas).
                        </p>
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                            <Btn variant="default" onClick={() => setShowCancelDialog(false)}>No, volver</Btn>
                            <Btn variant="danger" onClick={handleCancelEntrega} disabled={cancelling}>
                                {cancelling ? 'Cancelando…' : 'Sí, cancelar entrega'}
                            </Btn>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}

function Field({ label, value, mono, num, highlight }: {
    label: string; value: string; mono?: boolean; num?: boolean; highlight?: boolean;
}) {
    return (
        <div className="field">
            <label className="field-label">{label}</label>
            <input className={`input ${mono ? 'mono' : ''} ${num ? 'num' : ''}`} defaultValue={value} readOnly
                style={{
                    background: highlight ? '#fff8e1' : 'var(--field-disabled)',
                    borderColor: highlight ? 'var(--strip)' : undefined,
                    fontWeight: highlight ? 600 : undefined,
                    textAlign: num ? 'right' : undefined,
                    cursor: 'default',
                }}/>
        </div>
    );
}
