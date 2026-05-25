import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Btn from '@/components/Btn';
import Icon from '@/components/Icon';
import Pill from '@/components/Pill';
import Avatar from '@/components/Avatar';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { useRol } from '@/context/RolContext';
import type { SolicitudDB } from '@/types';

const mxMoney = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const mxHora = (s: string) =>
    new Date(s).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props {
    pendientes: SolicitudDB[];
    historial: SolicitudDB[];
}

export default function AutorizacionesIndex({ pendientes, historial }: Props) {
    const { rolId, perms } = useRol();
    const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes');
    const [comentario, setComentario] = useState('');
    const [selected, setSelected] = useState<SolicitudDB | null>(null);
    const [action, setAction] = useState<'aprobar' | 'rechazar' | null>(null);

    const canAuth = perms.autorizaciones && perms.autorizaciones !== 'none';

    const openDialog = (sol: SolicitudDB, act: 'aprobar' | 'rechazar') => {
        setSelected(sol);
        setAction(act);
        setComentario('');
    };

    const closeDialog = () => { setSelected(null); setAction(null); setComentario(''); };

    const confirm = () => {
        if (!selected || !action) return;
        router.post(`/solicitudes/${selected.folio}/${action}`, { comentarios: comentario }, {
            onSuccess: closeDialog,
        });
    };

    const NIVEL_MAP: Record<string, string> = { gerente: 'Gerente', direccion: 'Dirección' };
    const nivelDB = typeof perms.autorizaciones === 'string' ? NIVEL_MAP[perms.autorizaciones] ?? perms.autorizaciones : '';
    const filtered = perms.autorizaciones === 'todas'
        ? pendientes
        : pendientes.filter(s => s.autorizacion_requerida === nivelDB);

    return (
        <AppLayout>
            <div>
                <PageHeader
                    title="Autorizaciones"
                    sub="Solicitudes pendientes de aprobación según tu nivel de autorización."
                    actions={
                        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', padding: '4px 10px', background: 'var(--bg-stripe)', borderRadius: 4, border: '1px solid var(--line-1)' }}>
                            <Icon name="shield" size={13} style={{ verticalAlign: '-2px', marginRight: 6 }}/>
                            Nivel: <strong>{typeof perms.autorizaciones === 'string' ? perms.autorizaciones : '—'}</strong>
                        </div>
                    }
                />

                <div className="fb" style={{ marginBottom: 16 }}>
                    <div className="seg">
                        <button className={tab === 'pendientes' ? 'active' : ''} onClick={() => setTab('pendientes')}>
                            Pendientes ({filtered.length})
                        </button>
                        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>
                            Historial ({historial.length})
                        </button>
                    </div>
                </div>

                {tab === 'pendientes' && (
                    filtered.length === 0 ? (
                        <Card>
                            <div className="empty" style={{ padding: '40px 0' }}>
                                <Icon name="check" size={32} style={{ color: 'var(--st-approved-ink)', display: 'block', margin: '0 auto 12px' }}/>
                                No hay solicitudes pendientes de autorización.
                            </div>
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filtered.map(sol => {
                                const needsThisLevel = sol.autorizacion_requerida === perms.autorizaciones || perms.autorizaciones === 'todas';
                                return (
                                    <Card key={sol.id} pad>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                                            <div>
                                                <div className="row gap-3" style={{ marginBottom: 8 }}>
                                                    <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{sol.folio}</span>
                                                    <Pill status={sol.estatus}/>
                                                    <span style={{ fontSize: 11.5, padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 10, color: 'var(--accent)', fontWeight: 600, border: '1px solid var(--accent-line)' }}>
                                                        Nivel: {sol.autorizacion_requerida}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 16px', fontSize: 12.5 }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Cliente</div>
                                                        <div style={{ fontWeight: 500 }}>{sol.cliente_nombre}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Vendedor</div>
                                                        <div className="row gap-1">
                                                            <Avatar name={sol.vendedor ?? ''} size={18}/>
                                                            <span>{sol.vendedor}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Artículos</div>
                                                        <div>{sol.lineas?.map(l => l.articulo?.descripcion ?? l.articulo_id).join(', ')}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Monto total</div>
                                                        <div style={{ fontWeight: 700, color: 'var(--ink-1)' }}>{mxMoney(sol.total)}</div>
                                                    </div>
                                                </div>
                                                {sol.motivo && (
                                                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)', padding: '4px 8px', background: 'var(--bg-stripe)', borderRadius: 2 }}>
                                                        <Icon name="info" size={12} style={{ verticalAlign: '-1px', marginRight: 4 }}/>
                                                        Motivo: {sol.motivo}
                                                    </div>
                                                )}
                                                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-4)' }}>
                                                    <Icon name="clock" size={10} style={{ verticalAlign: '-1px', marginRight: 4 }}/>
                                                    Solicitado {mxHora(sol.fecha_solicitud)} por {sol.usuario_solicita}
                                                </div>
                                            </div>
                                            {canAuth && needsThisLevel && (
                                                <div className="row gap-2" style={{ flexShrink: 0 }}>
                                                    <Btn variant="ghost" size="sm" onClick={() => router.visit(`/solicitudes?folio=${sol.folio}`)}>
                                                        Ver detalle
                                                    </Btn>
                                                    <Btn variant="danger" size="sm" icon="x" onClick={() => openDialog(sol, 'rechazar')}>
                                                        Rechazar
                                                    </Btn>
                                                    <Btn variant="accent" size="sm" icon="check" onClick={() => openDialog(sol, 'aprobar')}>
                                                        Aprobar
                                                    </Btn>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )
                )}

                {tab === 'historial' && (
                    <Card pad={false}>
                        <div className="tbl-wrap">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Cliente</th>
                                        <th>Estatus</th>
                                        <th>Nivel aut.</th>
                                        <th>Vendedor</th>
                                        <th className="num">Total</th>
                                        <th>Fecha</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map(sol => (
                                        <tr key={sol.id}>
                                            <td className="mono">{sol.folio}</td>
                                            <td>{sol.cliente_nombre}</td>
                                            <td><Pill status={sol.estatus}/></td>
                                            <td><span className="tag">{sol.autorizacion_requerida}</span></td>
                                            <td>
                                                <div className="row gap-1">
                                                    <Avatar name={sol.vendedor ?? ''} size={20}/>
                                                    <span>{sol.vendedor}</span>
                                                </div>
                                            </td>
                                            <td className="num">{mxMoney(sol.total)}</td>
                                            <td className="muted">{mxHora(sol.fecha_solicitud)}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Btn variant="ghost" size="sm" onClick={() => router.visit(`/solicitudes?folio=${sol.folio}`)}>
                                                    Ver
                                                </Btn>
                                            </td>
                                        </tr>
                                    ))}
                                    {historial.length === 0 && (
                                        <tr><td colSpan={8}><div className="empty">Sin historial aún.</div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Dialog */}
                {selected && action && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} onClick={closeDialog}/>
                        <div style={{
                            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            background: 'var(--bg-elev)', border: '1px solid var(--line-2)', borderRadius: 4,
                            boxShadow: 'var(--shadow-lg)', minWidth: 380, maxWidth: 480, zIndex: 301, padding: 20,
                        }}>
                            <div className="row gap-2" style={{ marginBottom: 12 }}>
                                <Icon name={action === 'aprobar' ? 'check' : 'x'} size={16}
                                    style={{ color: action === 'aprobar' ? 'var(--st-approved-ink)' : 'var(--st-rejected-ink)' }}/>
                                <strong style={{ fontSize: 14 }}>
                                    {action === 'aprobar' ? 'Aprobar' : 'Rechazar'} — {selected.folio}
                                </strong>
                            </div>
                            <div className="field">
                                <label className="field-label">
                                    {action === 'aprobar' ? 'Comentarios (opcional)' : 'Motivo del rechazo *'}
                                </label>
                                <textarea className="textarea" value={comentario}
                                    onChange={e => setComentario(e.target.value)} rows={3}
                                    placeholder={action === 'aprobar' ? 'Notas de aprobación…' : 'Describe el motivo…'}/>
                            </div>
                            <div className="row gap-2" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                                <Btn variant="default" onClick={closeDialog}>Cancelar</Btn>
                                <Btn variant={action === 'aprobar' ? 'accent' : 'danger'} onClick={confirm}>
                                    {action === 'aprobar' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                                </Btn>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
