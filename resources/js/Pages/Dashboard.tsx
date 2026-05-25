import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import Pill from '../components/Pill';

const MXN = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const MXF = (s: string) =>
    new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

interface Mes { mes: string; entregadas: number; pendientes: number; canceladas: number }
interface Cliente { nombre: string; n: number; monto: number }
interface Vendedor { nombre: string; total: number; entregadas: number; monto: number }
interface Reciente { folio: string; cliente: string; estatus: string; total: number; fecha: string }

interface Props {
    kpis: {
        totalSolicitudes: number;
        entregadas: number;
        pendientes: number;
        canceladas: number;
        costoTotal: number;
        costoPromedio: number;
        clientesAtendidos: number;
        conversion: number;
        convertidas: number;
    };
    meses: Mes[];
    topClientes: Cliente[];
    porVendedor: Vendedor[];
    solicitudesPendientes: any[];
    recientes: Reciente[];
}

// ── colores semaforo ──────────────────────────────────────────────────
const C_ENT  = 'var(--accent)';
const C_PEND = '#f59e0b';
const C_CANC = '#f87171';

export default function Dashboard({ kpis, meses, topClientes, porVendedor, solicitudesPendientes, recientes }: Props) {

    // ── gráfica barras apiladas ───────────────────────────────────────
    const maxBarTotal = Math.max(...meses.map(b => b.entregadas + b.pendientes + b.canceladas), 1);
    const BAR_H = 110; // px

    // ── top clientes / vendedores (max para escala) ───────────────────
    const maxCliente  = Math.max(...topClientes.map(c => c.n), 1);
    const maxVendedor = Math.max(...porVendedor.map(v => v.total), 1);

    return (
        <AppLayout pendientes={kpis.pendientes}>
            <Head title="Dashboard"/>

            {/* ── Encabezado ─────────────────────────────────────────── */}
            <div style={{ padding: '14px 20px 0' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Dashboard operativo</h2>
            </div>

            {/* ── KPI grid ───────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '12px 20px' }}>
                <KpiCard icon="list"     label="Total solicitudes" value={kpis.totalSolicitudes} />
                <KpiCard icon="truck"    label="Entregadas"        value={kpis.entregadas}        color={C_ENT}  />
                <KpiCard icon="clock"    label="Pendientes"        value={kpis.pendientes}        color={C_PEND} badge={kpis.pendientes > 0} />
                <KpiCard icon="x-circle" label="Canceladas"        value={kpis.canceladas}        color={C_CANC} />
                <KpiCard icon="dollar"   label="Costo total"       value={MXN(kpis.costoTotal)}   wide />
            </div>

            {/* ── Gráfica + Actividad reciente ───────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10, padding: '0 20px 10px' }}>

                {/* Gráfica barras apiladas */}
                <Section title="Tendencia mensual de solicitudes" sub="últimos 12 meses"
                    legend={[
                        { color: C_ENT,  label: 'Entregadas' },
                        { color: C_PEND, label: 'Pendientes' },
                        { color: C_CANC, label: 'Canceladas' },
                    ]}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: BAR_H, paddingBottom: 2 }}>
                        {meses.map((b, i) => {
                            const total = b.entregadas + b.pendientes + b.canceladas;
                            const barPx = total > 0 ? Math.max((total / maxBarTotal) * BAR_H, 6) : 2;
                            const hEnt  = total > 0 ? (b.entregadas / total) * barPx : 0;
                            const hPend = total > 0 ? (b.pendientes / total) * barPx : 0;
                            const hCanc = total > 0 ? (b.canceladas / total) * barPx : 0;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 1, cursor: 'default' }}
                                    title={`${b.mes}: ${b.entregadas} ent · ${b.pendientes} pend · ${b.canceladas} canc`}>
                                    <div style={{ height: hEnt,  background: C_ENT,  borderRadius: '2px 2px 0 0', minHeight: b.entregadas > 0 ? 3 : 0 }}/>
                                    <div style={{ height: hPend, background: C_PEND, borderRadius: '2px 2px 0 0', minHeight: b.pendientes > 0 ? 3 : 0 }}/>
                                    <div style={{ height: hCanc, background: C_CANC, borderRadius: '2px 2px 0 0', minHeight: b.canceladas > 0 ? 3 : 0 }}/>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {meses.map((b, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'var(--ink-4)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {b.mes}
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Actividad reciente */}
                <Section title="Actividad reciente" sub="últimas solicitudes">
                    {recientes.length === 0 ? (
                        <EmptyState icon="inbox" text="Sin actividad reciente" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {recientes.map((r, i) => (
                                <div key={i}
                                    onClick={() => router.visit('/solicitudes')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--line-1)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{r.folio}</div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                                        <Pill status={r.estatus as any}/>
                                        <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{MXF(r.fecha)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            {/* ── Top Clientes + Top Vendedores ──────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 10px' }}>

                {/* Top Clientes */}
                <Section title="Top clientes" sub={`${topClientes.length} clientes con solicitudes`}>
                    {topClientes.length === 0 ? (
                        <EmptyState icon="users" text="Sin datos de clientes" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {topClientes.map((c, i) => (
                                <RankRow key={i} rank={i + 1} label={c.nombre}
                                    value={c.n} suffix="solicitudes"
                                    sub={MXN(c.monto)}
                                    pct={(c.n / maxCliente) * 100}
                                    color={C_ENT}/>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Top Vendedores */}
                <Section title="Top vendedores" sub={`${porVendedor.length} vendedores activos`}>
                    {porVendedor.length === 0 ? (
                        <EmptyState icon="user" text="Sin datos de vendedores" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {porVendedor.map((v, i) => {
                                const entPct = v.total > 0 ? Math.round((v.entregadas / v.total) * 100) : 0;
                                return (
                                    <RankRow key={i} rank={i + 1} label={v.nombre}
                                        value={v.total} suffix="solicitudes"
                                        sub={`${v.entregadas} entregadas · ${entPct}%`}
                                        pct={(v.total / maxVendedor) * 100}
                                        color="#6366f1"/>
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>

            {/* ── Solicitudes pendientes ─────────────────────────────── */}
            <div style={{ padding: '0 20px 20px' }}>
                <Section title="Solicitudes pendientes" sub="requieren atención"
                    action={
                        <button onClick={() => router.visit('/solicitudes')}
                            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Ver todas →
                        </button>
                    }>
                    {solicitudesPendientes.length === 0 ? (
                        <EmptyState icon="check-circle" text="No hay solicitudes pendientes" positive/>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--line-1)' }}>
                                    {['Folio', 'Cliente', 'Vendedor', 'Total', 'Autorización'].map(h => (
                                        <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudesPendientes.map((s: any) => (
                                    <tr key={s.folio}
                                        onClick={() => router.visit('/solicitudes')}
                                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--line-0)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{s.folio}</td>
                                        <td style={{ padding: '6px 8px' }}>{s.cliente_nombre}</td>
                                        <td style={{ padding: '6px 8px', color: 'var(--ink-3)' }}>{s.vendedor || '—'}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{MXN(s.total)}</td>
                                        <td style={{ padding: '6px 8px' }}>
                                            <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>
                                                {s.autorizacion_requerida}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>
            </div>
        </AppLayout>
    );
}

// ── Sub-componentes ───────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, badge, wide }: {
    icon: string; label: string; value: number | string; color?: string; badge?: boolean; wide?: boolean;
}) {
    return (
        <div style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line-1)', borderRadius: 4,
            padding: '12px 14px', position: 'relative', overflow: 'hidden',
        }}>
            {badge && (
                <span style={{
                    position: 'absolute', top: 8, right: 8, background: C_PEND, color: '#fff',
                    borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 6px',
                }}>!</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Icon name={icon} size={12} style={{ color: color ?? 'var(--ink-3)' }}/>
                <span style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {label}
                </span>
            </div>
            <div style={{ fontSize: wide ? 16 : 22, fontWeight: 700, color: color ?? 'var(--ink-1)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                {value}
            </div>
        </div>
    );
}

function Section({ title, sub, action, legend, children }: {
    title: string; sub?: string; action?: React.ReactNode;
    legend?: { color: string; label: string }[];
    children: React.ReactNode;
}) {
    return (
        <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line-1)', borderRadius: 4, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{title}</span>
                    {sub && <span style={{ fontSize: 10.5, color: 'var(--ink-3)', marginLeft: 6 }}>{sub}</span>}
                </div>
                {legend && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        {legend.map((l, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--ink-3)' }}>
                                <span style={{ width: 8, height: 8, background: l.color, borderRadius: 2, display: 'inline-block' }}/>
                                {l.label}
                            </span>
                        ))}
                    </div>
                )}
                {action}
            </div>
            {children}
        </div>
    );
}

function RankRow({ rank, label, value, suffix, sub, pct, color }: {
    rank: number; label: string; value: number; suffix: string; sub: string; pct: number; color: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'right', flexShrink: 0 }}>
                #{rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                        {label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{value} {suffix}</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }}/>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{sub}</div>
            </div>
        </div>
    );
}

function EmptyState({ icon, text, positive }: { icon: string; text: string; positive?: boolean }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px 0', gap: 8,
            color: positive ? 'var(--st-approved-ink)' : 'var(--ink-4)',
        }}>
            <Icon name={icon} size={22} style={{ opacity: 0.4 }}/>
            <span style={{ fontSize: 12 }}>{text}</span>
        </div>
    );
}
