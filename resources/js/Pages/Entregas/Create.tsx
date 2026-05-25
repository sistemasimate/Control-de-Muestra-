import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Btn from '@/components/Btn';
import Icon from '@/components/Icon';
import type { SolicitudDB } from '@/types';

const mxMoney = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const mxHora = (s: string) =>
    new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const todayISO = () => new Date().toISOString().slice(0, 10);

interface Props {
    solicitud: SolicitudDB;
    folio_entrega: string;
}

export default function EntregasCreate({ solicitud: s, folio_entrega }: Props) {
    const initialLineas = s.lineas.map(l => ({
        solicitud_detalle_id: l.id,
        cantidad_entregada: l.cantidad_pendiente ?? l.cantidad,
        almacen_codigo: l.almacen_codigo ?? '',
        lote: l.lote ?? '',
        proveedor: l.proveedor ?? '',
    }));

    const form = useForm({
        autorizador:     '',
        fecha_entrega:   todayISO(),
        comentarios:     '',
        destinatario:    '',
        direccion_envio: '',
        ciudad:          '',
        estado:          '',
        cp:              '',
        telefono:        '',
        forma_envio:     'Paquetería',
        paqueteria:      '',
        numero_guia:     '',
        lineas: initialLineas,
    });

    const updateLinea = (i: number, field: string, val: string | number) => {
        form.setData('lineas', form.data.lineas.map((l, idx) =>
            idx === i ? { ...l, [field]: val } : l,
        ));
    };

    const subtotal = s.lineas.reduce((acc, l, i) => {
        const q = form.data.lineas[i]?.cantidad_entregada ?? 0;
        return acc + l.costo_unitario * q;
    }, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const handleConfirm = () => {
        form.post(`/solicitudes/${s.folio}/entrega`);
    };

    return (
        <AppLayout>
            <div className="doc">
                {/* Title bar */}
                <div className="doc-titlebar">
                    <Icon name="truck" size={13}/>
                    <div className="doc-title-text">
                        Entrega de muestra — <span style={{ fontFamily: 'var(--font-mono)' }}>{folio_entrega}</span>
                        <span className="doc-title-status"> · desde {s.folio}</span>
                    </div>
                    <span className="pill draft">Modo: Agregar</span>
                    <div className="doc-win-btns">
                        <button title="Minimizar">−</button>
                        <button title="Maximizar">▢</button>
                    </div>
                </div>
                <div className="doc-strip"/>

                {/* Toolbar */}
                <div className="doc-toolbar">
                    <div className="row gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>
                            ◀ Volver a solicitud
                        </Btn>
                    </div>
                    <div className="row gap-2">
                        <Btn variant="default" size="sm" icon="x" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>Cerrar</Btn>
                    </div>
                </div>

                <div className="doc-head">
                    <div className="doc-fields">
                        <LockedField label="Cód. cliente"       value={s.cliente_codigo ?? ''} mono/>
                        <LockedField label="Nombre del cliente" value={s.cliente_nombre}/>
                        <LockedField label="Orden de Compra"    value={s.orden_compra ?? '—'} mono/>
                        <LockedField label="Solicitud origen"   value={s.folio} mono highlight/>
                        <LockedField label="Fecha solicitud"    value={mxHora(s.fecha_solicitud)}/>
                    </div>
                    <div className="doc-fields">
                        <LockedField label="Folio entrega" value={folio_entrega} mono/>
                        <LockedField label="Estatus"       value="Por entregar"/>
                        <div className="field">
                            <label className="field-label">Fecha entrega</label>
                            <input className="input" type="date" value={form.data.fecha_entrega}
                                onChange={e => form.setData('fecha_entrega', e.target.value)}/>
                        </div>
                    </div>
                </div>

                <div className="doc-body">
                    <div className="doc-grid-wrap" style={{ overflowX: 'auto' }}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: 30 }}>#</th>
                                    <th style={{ width: 110 }}>Código</th>
                                    <th style={{ width: 180 }}>Descripción</th>
                                    <th style={{ width: 90 }} className="num">Cantidad</th>
                                    <th style={{ width: 90 }} className="num">Pendiente</th>
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
                                    const pendiente = l.cantidad_pendiente ?? l.cantidad;
                                    const sinPendiente = pendiente <= 0;
                                    const qEnt = form.data.lineas[i]?.cantidad_entregada ?? 0;
                                    const excede = qEnt > pendiente;
                                    return (
                                        <tr key={l.id} style={{ opacity: sinPendiente ? 0.55 : 1 }}>
                                            <td className="num">{i + 1}</td>
                                            <td className="mono" style={{ background: 'var(--field-disabled)', color: 'var(--ink-2)' }}>
                                                {l.codigo_articulo ?? '—'}
                                            </td>
                                            <td style={{ background: 'var(--field-disabled)', color: 'var(--ink-2)' }}>
                                                {l.descripcion ?? l.articulo?.descripcion}
                                            </td>
                                            <td className="num" style={{ padding: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, padding: '0 6px' }}>
                                                    <input
                                                        type="number"
                                                        value={qEnt}
                                                        min={0}
                                                        max={pendiente}
                                                        disabled={sinPendiente}
                                                        onChange={e => {
                                                            const val = Number(e.target.value) || 0;
                                                            updateLinea(i, 'cantidad_entregada', Math.min(val, pendiente));
                                                        }}
                                                        style={{
                                                            width: '100%', height: 22, textAlign: 'right',
                                                            border: excede ? '1px solid var(--st-rejected)' : '0',
                                                            fontSize: 11.5, background: 'transparent', fontWeight: 700,
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    {sinPendiente && (
                                                        <span title="Línea completa" style={{ fontSize: 11, color: 'var(--st-approved-ink)' }}>🔒</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="num" style={{
                                                background: sinPendiente ? 'var(--st-approved-bg)' : 'var(--field-disabled)',
                                                color: sinPendiente ? 'var(--st-approved-ink)' : 'var(--ink-2)',
                                                fontWeight: 600,
                                            }}>
                                                {sinPendiente ? '✓ Completo' : pendiente}
                                            </td>
                                            <td style={{ background: 'var(--field-disabled)', color: 'var(--ink-2)' }}>{l.unidad}</td>
                                            <td className="num" style={{ background: 'var(--field-disabled)', color: 'var(--ink-2)' }}>{mxMoney(l.costo_unitario)}</td>
                                            <td className="num"><strong>{mxMoney(l.costo_unitario * qEnt)}</strong></td>
                                            <td style={{ padding: 0 }}>
                                                <input
                                                    value={form.data.lineas[i]?.almacen_codigo ?? ''}
                                                    disabled={sinPendiente}
                                                    onChange={e => updateLinea(i, 'almacen_codigo', e.target.value)}
                                                    placeholder={l.almacen_codigo ?? '—'}
                                                    style={{ width: '100%', height: 22, border: 0, background: 'transparent', fontSize: 11.5, padding: '0 6px' }}
                                                />
                                            </td>
                                            <td style={{ padding: 0 }}>
                                                <input
                                                    className="mono"
                                                    value={form.data.lineas[i]?.lote ?? ''}
                                                    disabled={sinPendiente}
                                                    onChange={e => updateLinea(i, 'lote', e.target.value)}
                                                    placeholder={l.lote ?? '—'}
                                                    style={{ width: '100%', height: 22, border: 0, background: 'transparent', fontSize: 11.5, padding: '0 6px' }}
                                                />
                                            </td>
                                            <td style={{ padding: 0 }}>
                                                <input
                                                    value={form.data.lineas[i]?.proveedor ?? ''}
                                                    disabled={sinPendiente}
                                                    onChange={e => updateLinea(i, 'proveedor', e.target.value)}
                                                    placeholder={l.proveedor ?? '—'}
                                                    style={{ width: '100%', height: 22, border: 0, background: 'transparent', fontSize: 11.5, padding: '0 6px' }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 field">
                        <label className="field-label">Comentarios</label>
                        <textarea className="textarea" value={form.data.comentarios}
                            onChange={e => form.setData('comentarios', e.target.value)}
                            placeholder="Notas de entrega…" style={{ minHeight: 52 }}/>
                    </div>

                    <div style={{ marginTop: 16, borderTop: '1px solid var(--line-1)', paddingTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>
                            <Icon name="truck" size={11} style={{ verticalAlign: '-1px', marginRight: 5 }}/>
                            Datos de envío
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            <div className="field" style={{ gridColumn: 'span 2' }}>
                                <label className="field-label">Destinatario</label>
                                <input className="input" value={form.data.destinatario}
                                    onChange={e => form.setData('destinatario', e.target.value)}
                                    placeholder="Nombre de quien recibe…"/>
                            </div>
                            <div className="field">
                                <label className="field-label">Teléfono</label>
                                <input className="input" value={form.data.telefono}
                                    onChange={e => form.setData('telefono', e.target.value)}
                                    placeholder="55 1234 5678"/>
                            </div>
                            <div className="field" style={{ gridColumn: 'span 3' }}>
                                <label className="field-label">Dirección de envío</label>
                                <input className="input" value={form.data.direccion_envio}
                                    onChange={e => form.setData('direccion_envio', e.target.value)}
                                    placeholder="Calle, número, colonia…"/>
                            </div>
                            <div className="field">
                                <label className="field-label">Ciudad</label>
                                <input className="input" value={form.data.ciudad}
                                    onChange={e => form.setData('ciudad', e.target.value)}
                                    placeholder="Ciudad de México"/>
                            </div>
                            <div className="field">
                                <label className="field-label">Estado</label>
                                <input className="input" value={form.data.estado}
                                    onChange={e => form.setData('estado', e.target.value)}
                                    placeholder="CDMX"/>
                            </div>
                            <div className="field">
                                <label className="field-label">C.P.</label>
                                <input className="input" value={form.data.cp}
                                    onChange={e => form.setData('cp', e.target.value)}
                                    placeholder="06600"/>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                            <div className="field">
                                <label className="field-label">Forma de envío</label>
                                <select className="input" value={form.data.forma_envio}
                                    onChange={e => form.setData('forma_envio', e.target.value)}>
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
                                            onChange={e => form.setData('paqueteria', e.target.value)}>
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
                                            onChange={e => form.setData('numero_guia', e.target.value)}
                                            placeholder="123456789"/>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {s.comentarios && (
                        <div className="mt-3 row gap-2" style={{ padding: 10, background: 'var(--bg-stripe)', border: '1px solid var(--line-1)', borderRadius: 2 }}>
                            <Icon name="message-square" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0, marginTop: 1 }}/>
                            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                                <strong>Comentarios solicitud:</strong> {s.comentarios}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="doc-foot">
                    <div className="doc-fields">
                        <div className="field">
                            <label className="field-label">Autorizador</label>
                            <select className="input" value={form.data.autorizador}
                                onChange={e => form.setData('autorizador', e.target.value)}>
                                <option value="">— Seleccionar —</option>
                                <option>Christianne Álvarez</option>
                                <option>Ramon Gonzalez</option>
                                <option>Ana Grijalva</option>
                            </select>
                        </div>
                    </div>
                    <div className="doc-totals">
                        <LockedField label="Subtotal"  value={mxMoney(subtotal)} num/>
                        <LockedField label="IVA 16%"   value={mxMoney(iva)} num/>
                        <div className="field">
                            <label className="field-label total">Total del documento</label>
                            <input className="input num" value={mxMoney(total)} readOnly
                                style={{ textAlign: 'right', background: '#fff8e1', border: '1px solid var(--strip)', fontWeight: 700, fontSize: 14, height: 30 }}/>
                        </div>
                    </div>
                </div>

                {/* Action bar */}
                <div className="doc-actions">
                    <Btn variant="accent" icon="plus" onClick={handleConfirm} disabled={form.processing}>
                        {form.processing ? 'Guardando…' : 'Crear entrega'}
                    </Btn>
                    <Btn variant="default" onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}>Cancelar</Btn>
                </div>
            </div>
        </AppLayout>
    );
}

/** Campo bloqueado — no editable */
function LockedField({ label, value, mono, num, highlight }: {
    label: string; value: string; mono?: boolean; num?: boolean; highlight?: boolean;
}) {
    return (
        <div className="field">
            <label className="field-label">{label}</label>
            <input className={`input ${mono ? 'mono' : ''} ${num ? 'num' : ''}`} value={value} readOnly
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
