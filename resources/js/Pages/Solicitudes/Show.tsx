import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Btn from '@/components/Btn';
import Icon from '@/components/Icon';
import Pill from '@/components/Pill';
import { useRol } from '@/context/RolContext';
import type { SolicitudDB } from '@/types';

const mxMoney = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const mxHora = (s: string) =>
    new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props {
    solicitud: SolicitudDB;
}

export default function SolicitudesShow({ solicitud: s }: Props) {
    const { perms } = useRol();
    const [tab, setTab] = useState('contenido');
    const [showApprove, setShowApprove] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [comment, setComment] = useState('');

    const canApprove = s.estatus === 'Pendiente' && (
        perms.autorizaciones === 'todas' ||
        (perms.autorizaciones === 'gerente' && s.autorizacion_requerida === 'Gerente') ||
        (perms.autorizaciones === 'direccion' && s.autorizacion_requerida === 'Dirección')
    );

    const submitApprove = () => {
        router.post(`/solicitudes/${s.folio}/aprobar`, { comentarios: comment }, {
            onSuccess: () => { setShowApprove(false); setComment(''); },
        });
    };

    const submitReject = () => {
        router.post(`/solicitudes/${s.folio}/rechazar`, { comentarios: comment }, {
            onSuccess: () => { setShowReject(false); setComment(''); },
        });
    };

    return (
        <AppLayout>
            <div className="doc">
                {/* Title bar */}
                <div className="doc-titlebar">
                    <Icon name="list" size={13}/>
                    <div className="doc-title-text">
                        Solicitud de muestra — <span style={{ fontFamily: 'var(--font-mono)' }}>{s.folio}</span>
                        {s.proyecto && <span className="doc-title-status"> · {s.proyecto}</span>}
                    </div>
                    <Pill status={s.estatus}/>
                    <div className="doc-win-btns">
                        <button title="Minimizar">−</button>
                        <button title="Maximizar">▢</button>
                    </div>
                </div>
                <div className="doc-strip"/>

                {/* Toolbar */}
                <div className="doc-toolbar">
                    <div className="row gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => router.visit('/solicitudes')}>◀ Volver a solicitudes</Btn>
                    </div>
                    <div className="row gap-2">
                        <Btn variant="ghost" size="sm" icon="download">PDF</Btn>
                        <Btn variant="ghost" size="sm" icon="paperclip">Adjuntos</Btn>
                        <Btn variant="default" size="sm" icon="x" onClick={() => router.visit('/solicitudes')}>Cerrar</Btn>
                    </div>
                </div>

                {/* Header */}
                <div className="doc-head">
                    <div className="doc-fields">
                        <RF label="Cliente" value={s.cliente_codigo ?? ''} mono lookup/>
                        <RF label="Nombre" value={s.cliente_nombre}/>
                        <RF label="Vendedor" value={s.vendedor ?? ''}/>
                        <RF label="Proyecto" value={s.proyecto ?? '—'}/>
                        <RF label="Dirección entrega" value={s.direccion_entrega ?? ''}/>
                    </div>
                    <div className="doc-fields">
                        <RF label="Folio" value={s.folio} mono/>
                        <RF label="Estatus" value={s.estatus}/>
                        <RF label="Fecha solicitud" value={mxHora(s.fecha_solicitud)}/>
                        <RF label="Aut. requerida" value={s.autorizacion_requerida ?? '—'} highlight/>
                        <RF label="Motivo" value={s.motivo ?? ''}/>
                    </div>
                </div>

                {/* Tabs */}
                <div className="doc-tabs">
                    {[{ k: 'contenido', label: 'Contenido' }, { k: 'historial', label: 'Historial' }].map(t => (
                        <div key={t.k} className={`doc-tab ${tab === t.k ? 'active' : ''}`}
                            onClick={() => setTab(t.k)}>{t.label}</div>
                    ))}
                </div>

                {/* Body */}
                <div className="doc-body">
                    {tab === 'contenido' && (
                        <>
                            <div className="doc-grid-wrap" style={{ overflowX: 'auto' }}>
                                <table className="tbl">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 30 }}>#</th>
                                            <th style={{ width: 110 }}>Código SIC</th>
                                            <th style={{ width: 180 }}>Descripción</th>
                                            <th style={{ width: 70 }} className="num">Cant.</th>
                                            <th style={{ width: 60 }}>Unidad</th>
                                            <th style={{ width: 100 }} className="num">Precio de venta</th>
                                            <th style={{ width: 110 }} className="num">Total</th>
                                            <th style={{ width: 85 }}>Almacén</th>
                                            <th style={{ width: 100 }}>Lote</th>
                                            <th style={{ width: 140 }}>Proveedor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {s.lineas?.map((l, i) => (
                                            <tr key={l.id}>
                                                <td className="num">{i + 1}</td>
                                                <td className="mono">{l.codigo_articulo ?? l.articulo?.codigo_sic ?? '—'}</td>
                                                <td>{l.descripcion ?? l.articulo?.descripcion ?? '—'}</td>
                                                <td className="num"><strong>{l.cantidad}</strong></td>
                                                <td>{l.unidad}</td>
                                                <td className="num">{mxMoney(l.costo_unitario)}</td>
                                                <td className="num"><strong>{mxMoney(l.total_linea)}</strong></td>
                                                <td>{l.almacen_codigo ?? l.almacen?.codigo ?? '—'}</td>
                                                <td className="mono">{l.lote ?? '—'}</td>
                                                <td>{l.proveedor ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {s.comentarios && (
                                <div className="mt-3 field">
                                    <label className="field-label">Comentarios</label>
                                    <div style={{ padding: '8px 10px', background: 'var(--bg-stripe)', border: '1px solid var(--line-1)', borderRadius: 2, fontSize: 12.5, color: 'var(--ink-2)' }}>
                                        {s.comentarios}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {tab === 'historial' && (
                        <div className="timeline">
                            <div className="tl-item">
                                <div className="tl-dot done"><Icon name="plus" size={10}/></div>
                                <div className="tl-body">
                                    <div className="title">Solicitud creada</div>
                                    <div className="meta">{s.usuario_solicita} · {mxHora(s.fecha_solicitud)}</div>
                                </div>
                            </div>
                            {s.autorizaciones?.map(a => (
                                <div key={a.id} className="tl-item">
                                    <div className="tl-dot done"
                                        style={a.estatus === 'Rechazada' ? { borderColor: 'var(--st-rejected-ink)', color: 'var(--st-rejected-ink)', background: 'var(--st-rejected-bg)' } : {}}>
                                        <Icon name={a.estatus === 'Aprobada' ? 'check' : 'x'} size={10}/>
                                    </div>
                                    <div className="tl-body">
                                        <div className="title">{a.estatus} · {a.nivel_autorizacion}</div>
                                        <div className="meta">{a.usuario_autoriza} · {mxHora(a.fecha_autorizacion)}</div>
                                        {a.comentarios && <div className="note">{a.comentarios}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="doc-foot">
                    <div className="doc-fields">
                        <RF label="Vendedor" value={s.vendedor ?? ''}/>
                        <RF label="Solicitado por" value={s.usuario_solicita}/>
                    </div>
                    <div className="doc-totals">
                        <RF label="Subtotal" value={mxMoney(s.subtotal)} num/>
                        <RF label="IVA 16%" value={mxMoney(s.iva)} num/>
                        <div className="field">
                            <label className="field-label total">Total del documento</label>
                            <input className="input num" value={mxMoney(s.total)} readOnly
                                style={{ textAlign: 'right', background: '#fff8e1', border: '1px solid var(--strip)', fontWeight: 700, fontSize: 14, height: 30 }}/>
                        </div>
                    </div>
                </div>

                {/* Action bar */}
                <div className="doc-actions">
                    <Btn variant="default" icon="x" onClick={() => router.visit('/solicitudes')}>Cerrar</Btn>
                    <div className="right">
                        {canApprove && (
                            <>
                                <Btn variant="danger" icon="x" onClick={() => setShowReject(true)}>Rechazar</Btn>
                                <Btn variant="accent" icon="check" onClick={() => setShowApprove(true)}>Aprobar</Btn>
                            </>
                        )}
                        {s.estatus !== 'Cancelada' && s.estatus !== 'Rechazada' && s.estatus !== 'Entrega completa' && (
                            <Btn variant="accent" icon="truck"
                                onClick={() => router.visit(`/solicitudes/${s.folio}/entrega/nueva`)}>
                                Crear entrega
                            </Btn>
                        )}
                    </div>
                </div>

                {/* Dialogs */}
                {showApprove && (
                    <Dialog title="Aprobar solicitud" icon="check" iconColor="var(--st-approved-ink)"
                        onConfirm={submitApprove} onCancel={() => setShowApprove(false)} confirmLabel="Aprobar" confirmVariant="accent">
                        <div className="field">
                            <label className="field-label">Comentarios (opcional)</label>
                            <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} rows={3}/>
                        </div>
                    </Dialog>
                )}
                {showReject && (
                    <Dialog title="Rechazar solicitud" icon="x" iconColor="var(--st-rejected-ink)"
                        onConfirm={submitReject} onCancel={() => setShowReject(false)} confirmLabel="Rechazar" confirmVariant="danger">
                        <div className="field">
                            <label className="field-label">Motivo del rechazo <span className="req">*</span></label>
                            <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} rows={3}
                                placeholder="Describe el motivo…"/>
                        </div>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}

function RF({ label, value, mono, num, highlight, lookup }: {
    label: string; value: string; mono?: boolean; num?: boolean; highlight?: boolean; lookup?: boolean;
}) {
    return (
        <div className="field">
            <label className="field-label">{label}</label>
            {lookup ? (
                <div className="lookup">
                    <input className={`input ${mono ? 'mono' : ''}`} value={value} readOnly
                        style={{ background: 'var(--field-disabled)', borderRadius: '2px 0 0 2px' }}/>
                    <button className="lookup-btn">▶</button>
                </div>
            ) : (
                <input className={`input ${mono ? 'mono' : ''} ${num ? 'num' : ''}`} value={value} readOnly
                    style={{
                        background: highlight ? '#fff8e1' : 'var(--field-disabled)',
                        borderColor: highlight ? 'var(--strip)' : undefined,
                        fontWeight: highlight ? 600 : undefined,
                        textAlign: num ? 'right' : undefined,
                    }}/>
            )}
        </div>
    );
}

function Dialog({ title, icon, iconColor, children, onConfirm, onCancel, confirmLabel, confirmVariant }: {
    title: string; icon: string; iconColor: string; children: React.ReactNode;
    onConfirm: () => void; onCancel: () => void; confirmLabel: string;
    confirmVariant: 'accent' | 'danger' | 'primary';
}) {
    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} onClick={onCancel}/>
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'var(--bg-elev)', border: '1px solid var(--line-2)', borderRadius: 4,
                boxShadow: 'var(--shadow-lg)', minWidth: 360, maxWidth: 480, zIndex: 301, padding: 20,
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
