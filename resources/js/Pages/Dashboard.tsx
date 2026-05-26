import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '../layouts/AppLayout';
import Icon from '../components/Icon';
import Pill from '../components/Pill';

const MXN = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const MXF = (s: string) =>
    new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

const C = {
    complete: '#1d4ed8',
    partial:  '#d97706',
    pending:  '#059669',
    cancel:   '#dc2626',
    money:    '#7c3aed',
    vendor:   '#0891b2',
    neutral:  '#475569',
};

interface TooltipState {
    x: number; y: number;
    title: string;
    rows: { label: string; value: string | number; color?: string }[];
}

interface Mes { mes: string; entregadas: number; parciales: number; pendientes: number; canceladas: number }
interface Cliente { nombre: string; n: number; monto: number }
interface Vendedor { nombre: string; total: number; entregadas: number; monto: number }
interface Reciente { folio: string; cliente: string; estatus: string; total: number; fecha: string }
interface TopProducto { descripcion: string; qty: number; veces: number }
interface TopAlmacen { codigo: string; total: number }

interface Props {
    kpis: {
        totalSolicitudes: number; entregadas: number; parciales: number;
        pendientes: number; canceladas: number; costoTotal: number;
        clientesAtendidos: number; kilosEntregados: number;
        conversion: number; convertidas: number;
    };
    meses: Mes[];
    topClientes: Cliente[];
    porVendedor: Vendedor[];
    solicitudesPendientes: any[];
    recientes: Reciente[];
    topProducto: TopProducto | null;
    topAlmacen: TopAlmacen | null;
}

export default function Dashboard({ kpis, meses, topClientes, porVendedor, solicitudesPendientes, recientes, topProducto, topAlmacen }: Props) {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const show = (e: React.MouseEvent, title: string, rows: TooltipState['rows']) =>
        setTooltip({ x: e.clientX, y: e.clientY, title, rows });
    const hide = () => setTooltip(null);
    const move = (e: React.MouseEvent) =>
        tooltip && setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t);

    const maxCli = Math.max(...topClientes.map(c => c.n), 1);
    const maxVen = Math.max(...porVendedor.map(v => v.total), 1);

    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AppLayout pendientes={kpis.pendientes}>
            <Head title="Dashboard"/>

            {/* Floating tooltip */}
            {tooltip && (
                <div style={{
                    position: 'fixed', left: tooltip.x + 16, top: tooltip.y - 12,
                    background: 'var(--bg-elev)', border: '1px solid var(--line-2)',
                    borderRadius: 5, padding: '9px 13px', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.13)', minWidth: 170,
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 7, color: 'var(--ink-1)', borderBottom: '1px solid var(--line-1)', paddingBottom: 5 }}>
                        {tooltip.title}
                    </div>
                    {tooltip.rows.map((r, i) => r.value !== '' && (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 11, color: 'var(--ink-2)', marginBottom: 3 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                {r.color && <span style={{ width: 7, height: 7, background: r.color, borderRadius: 2, display: 'inline-block', flexShrink: 0 }}/>}
                                {r.label}
                            </span>
                            <strong style={{ color: r.color ?? 'var(--ink-1)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{r.value}</strong>
                        </div>
                    ))}
                </div>
            )}

            {/* Header */}
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink-1)' }}>Dashboard operativo</h2>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>{today}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>SIC · Control de Muestras</span>
            </div>

            <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── KPIs fila 1 ─────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    <KpiCard icon="list"        color={C.neutral}   label="Total solicitudes"
                        value={kpis.totalSolicitudes}
                        onHover={e => show(e, 'Total solicitudes', [
                            { label: 'Entrega completa', value: kpis.entregadas,  color: C.complete },
                            { label: 'Entrega parcial',  value: kpis.parciales,   color: C.partial  },
                            { label: 'Pendientes',       value: kpis.pendientes,  color: C.pending  },
                            { label: 'Canceladas',       value: kpis.canceladas,  color: C.cancel   },
                        ])} onLeave={hide}/>
                    <KpiCard icon="check-circle" color={C.complete}  label="Entrega completa"
                        value={kpis.entregadas}
                        onHover={e => show(e, 'Entrega completa', [
                            { label: 'Solicitudes',  value: kpis.entregadas },
                            { label: 'Del total',    value: `${kpis.totalSolicitudes > 0 ? Math.round(kpis.entregadas / kpis.totalSolicitudes * 100) : 0}%` },
                        ])} onLeave={hide}/>
                    <KpiCard icon="truck"        color={C.partial}   label="Entrega parcial"
                        value={kpis.parciales} badge={kpis.parciales > 0}
                        onHover={e => show(e, 'Entregas parciales', [
                            { label: 'En proceso',             value: kpis.parciales },
                            { label: 'Pendiente de completar', value: kpis.parciales },
                        ])} onLeave={hide}/>
                    <KpiCard icon="clock"        color={C.pending}   label="Pendientes"
                        value={kpis.pendientes} badge={kpis.pendientes > 0}
                        onHover={e => show(e, 'Solicitudes pendientes', [
                            { label: 'Sin procesar',      value: kpis.pendientes },
                            { label: 'Requieren atención', value: kpis.pendientes > 0 ? '⚠ Sí' : '✓ Al día' },
                        ])} onLeave={hide}/>
                    <KpiCard icon="x-circle"     color={C.cancel}    label="Canceladas"
                        value={kpis.canceladas}
                        onHover={e => show(e, 'Canceladas', [
                            { label: 'Total canceladas', value: kpis.canceladas },
                            { label: '% del total',      value: `${kpis.totalSolicitudes > 0 ? Math.round(kpis.canceladas / kpis.totalSolicitudes * 100) : 0}%` },
                        ])} onLeave={hide}/>
                </div>

                {/* ── KPIs fila 2 ─────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <KpiCard icon="dollar-sign" color={C.money} label="Total"
                        value={MXN(kpis.costoTotal)} wide
                        onHover={e => show(e, 'Total acumulado', [
                            { label: 'Total muestras',      value: MXN(kpis.costoTotal) },
                            { label: 'Solicitudes activas', value: kpis.entregadas + kpis.parciales },
                        ])} onLeave={hide}/>
                    <KpiCard icon="users" color={C.vendor} label="Clientes atendidos"
                        value={kpis.clientesAtendidos}
                        onHover={e => show(e, 'Clientes atendidos', [
                            { label: 'Clientes únicos', value: kpis.clientesAtendidos },
                        ])} onLeave={hide}/>
                    <KpiCard icon="package" color={C.pending} label="Kilos entregados"
                        value={kpis.kilosEntregados.toLocaleString('es-MX', { maximumFractionDigits: 2 })} wide
                        sub="unidad KG · entregas no canceladas"
                        onHover={e => show(e, 'Kilos entregados', [
                            { label: 'Total KG', value: kpis.kilosEntregados },
                        ])} onLeave={hide}/>
                </div>

                {/* ── Producto + Almacén top ───────────────────────────── */}
                {(topProducto || topAlmacen) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {topProducto ? (
                            <InfoCard icon="package" color={C.pending}
                                title="Producto más solicitado"
                                main={topProducto.descripcion}
                                meta={`${topProducto.qty} unidades · ${topProducto.veces} solicitudes`}/>
                        ) : <div/>}
                        {topAlmacen ? (
                            <InfoCard icon="archive" color={C.money}
                                title="Almacén con mayor movimiento"
                                main={topAlmacen.codigo}
                                meta={`${topAlmacen.total} líneas registradas`}/>
                        ) : <div/>}
                    </div>
                )}

                {/* ── Gráfica + Actividad ──────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 10 }}>

                    <Section title="Tendencia de solicitudes"
                        legend={[
                            { color: C.complete, label: 'Entrega completa' },
                            { color: C.partial,  label: 'Entrega parcial' },
                            { color: C.pending,  label: 'Pendientes' },
                            { color: C.cancel,   label: 'Canceladas' },
                        ]}>
                        <TrendChart meses={meses} C={C} onShow={show} onHide={hide} onMove={move}/>
                    </Section>

                    <Section title="Actividad reciente" sub="últimas solicitudes">
                        {recientes.length === 0 ? (
                            <EmptyState icon="inbox" text="Sin actividad reciente"/>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {recientes.map((r, i) => (
                                    <div key={i}
                                        onClick={() => router.visit(`/solicitudes?sel=${r.folio}`)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 3, cursor: 'pointer', border: '1px solid var(--line-1)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{r.folio}</div>
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

                {/* ── Top Clientes + Top Vendedores ────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Section title="Top clientes" sub={`${topClientes.length} con solicitudes`}>
                        {topClientes.length === 0 ? (
                            <EmptyState icon="users" text="Sin datos de clientes"/>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {topClientes.map((c, i) => (
                                    <RankRow key={i} rank={i + 1} label={c.nombre}
                                        value={c.n} suffix="sol." sub={MXN(c.monto)}
                                        pct={(c.n / maxCli) * 100} color={C.complete}
                                        onHover={e => show(e, c.nombre, [
                                            { label: 'Solicitudes', value: c.n },
                                            { label: 'Monto total', value: MXN(c.monto) },
                                        ])} onLeave={hide}/>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section title="Top vendedores" sub={`${porVendedor.length} activos`}>
                        {porVendedor.length === 0 ? (
                            <EmptyState icon="user" text="Sin datos de vendedores"/>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {porVendedor.map((v, i) => {
                                    const ep = v.total > 0 ? Math.round((v.entregadas / v.total) * 100) : 0;
                                    return (
                                        <RankRow key={i} rank={i + 1} label={v.nombre}
                                            value={v.total} suffix="sol."
                                            sub={`${v.entregadas} completas · ${ep}%`}
                                            pct={(v.total / maxVen) * 100} color={C.vendor}
                                            onHover={e => show(e, v.nombre, [
                                                { label: 'Total solicitudes',  value: v.total },
                                                { label: 'Entrega completa',   value: v.entregadas },
                                                { label: 'Monto',              value: MXN(v.monto) },
                                                { label: 'Cumplimiento',       value: `${ep}%` },
                                            ])} onLeave={hide}/>
                                    );
                                })}
                            </div>
                        )}
                    </Section>
                </div>

                {/* ── Solicitudes pendientes ───────────────────────────── */}
                <Section
                    title="Solicitudes pendientes"
                    sub={`${solicitudesPendientes.length} requieren atención`}
                    action={
                        <button onClick={() => router.visit('/solicitudes?estatus=Pendiente')}
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
                                    {['Folio', 'Cliente', 'Vendedor', 'Total', 'Autorización requerida'].map(h => (
                                        <th key={h} style={{ padding: '4px 8px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudesPendientes.map((s: any) => (
                                    <tr key={s.folio}
                                        onClick={() => router.visit(`/solicitudes?sel=${s.folio}`)}
                                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--line-0)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', fontSize: 11.5 }}>{s.folio}</td>
                                        <td style={{ padding: '7px 8px', fontWeight: 500 }}>{s.cliente_nombre}</td>
                                        <td style={{ padding: '7px 8px', color: 'var(--ink-3)' }}>{s.vendedor || '—'}</td>
                                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{MXN(s.total)}</td>
                                        <td style={{ padding: '7px 8px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: '#fef3c7', color: '#92400e', display: 'inline-block' }}>
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

// ── Sub-componentes ────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, badge, wide, sub, onHover, onLeave }: {
    icon: string; label: string; value: number | string; color?: string;
    badge?: boolean; wide?: boolean; sub?: string;
    onHover?: (e: React.MouseEvent) => void; onLeave?: () => void;
}) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={e => { setHov(true); onHover?.(e); }}
            onMouseLeave={() => { setHov(false); onLeave?.(); }}
            style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--line-1)',
                borderLeft: `3px solid ${color ?? 'var(--line-2)'}`,
                borderRadius: 4, padding: '12px 14px',
                position: 'relative', overflow: 'hidden', cursor: 'default',
                boxShadow: hov ? '0 6px 16px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)',
                transform: hov ? 'translateY(-2px)' : 'none',
                transition: 'box-shadow 0.15s, transform 0.15s',
            }}>
            {badge && (
                <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: color, color: '#fff',
                    borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 6px',
                }}>!</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
                <Icon name={icon} size={11} style={{ color: color ?? 'var(--ink-3)' }}/>
                <span style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {label}
                </span>
            </div>
            <div style={{
                fontSize: wide ? 15 : 28, fontWeight: 800, color: color ?? 'var(--ink-1)',
                lineHeight: 1,
                fontFamily: typeof value === 'number' ? 'var(--font-mono)' : undefined,
            }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 5 }}>{sub}</div>}
        </div>
    );
}

function Section({ title, sub, action, legend, children }: {
    title: string; sub?: string; action?: React.ReactNode;
    legend?: { color: string; label: string }[];
    children: React.ReactNode;
}) {
    return (
        <div style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line-1)',
            borderRadius: 4, padding: '14px 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-1)' }}>{title}</span>
                    {sub && <span style={{ fontSize: 10.5, color: 'var(--ink-4)', marginLeft: 6 }}>{sub}</span>}
                </div>
                {legend && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {legend.map((l, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
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

function RankRow({ rank, label, value, suffix, sub, pct, color, onHover, onLeave }: {
    rank: number; label: string; value: number; suffix: string; sub: string; pct: number; color: string;
    onHover?: (e: React.MouseEvent) => void; onLeave?: () => void;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}
            onMouseEnter={onHover} onMouseLeave={onLeave}>
            <span style={{ width: 20, fontSize: 10, color: 'var(--ink-4)', textAlign: 'right', flexShrink: 0, fontWeight: 700 }}>
                #{rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0, fontWeight: 700 }}>{value} {suffix}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }}/>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{sub}</div>
            </div>
        </div>
    );
}

function InfoCard({ icon, color, title, main, meta }: {
    icon: string; color: string; title: string; main: string; meta: string;
}) {
    return (
        <div style={{
            background: 'var(--bg-elev)', border: '1px solid var(--line-1)',
            borderLeft: `3px solid ${color}`, borderRadius: 4,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon name={icon} size={17} style={{ color }}/>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', fontWeight: 700, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{main}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{meta}</div>
            </div>
        </div>
    );
}

type MesNumKey = 'entregadas' | 'parciales' | 'pendientes' | 'canceladas';

function TrendChart({ meses, C, onShow, onHide, onMove }: {
    meses: Mes[];
    C: Record<string, string>;
    onShow: (e: React.MouseEvent, title: string, rows: { label: string; value: string | number; color?: string }[]) => void;
    onHide: () => void;
    onMove: (e: React.MouseEvent) => void;
}) {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    // Auto-range: trim leading empty months, keep at least last 3
    const firstWithData = meses.findIndex(m => m.entregadas + m.parciales + m.pendientes + m.canceladas > 0);
    const startIdx = firstWithData <= 0
        ? Math.max(0, meses.length - 4)
        : Math.max(0, firstWithData - 1);
    const data = meses.slice(startIdx);
    const n = data.length;

    const VW = 480, VH = 170;
    const PAD = { t: 12, r: 12, b: 28, l: 30 };
    const W = VW - PAD.l - PAD.r;
    const H = VH - PAD.t - PAD.b;

    const maxVal = Math.max(...data.map(m => m.entregadas + m.parciales + m.pendientes + m.canceladas), 1);

    const xOf = (i: number) => n <= 1 ? PAD.l + W / 2 : PAD.l + (i / (n - 1)) * W;
    const yOf = (v: number) => PAD.t + H - (v / maxVal) * H;

    const makeLine = (vals: number[]) => {
        const pts = vals.map<[number, number]>((v, i) => [xOf(i), yOf(v)]);
        if (pts.length === 0) return '';
        if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            const cx = (x0 + x1) / 2;
            d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
        }
        return d;
    };

    const makeArea = (vals: number[]) => {
        const line = makeLine(vals);
        if (!line) return '';
        const pts = vals.map<[number, number]>((v, i) => [xOf(i), yOf(v)]);
        const bot = PAD.t + H + 1;
        return `${line} L ${pts[pts.length - 1][0]} ${bot} L ${pts[0][0]} ${bot} Z`;
    };

    const series: { key: MesNumKey; label: string; color: string }[] = [
        { key: 'entregadas', label: 'Entrega completa', color: C.complete },
        { key: 'parciales',  label: 'Entrega parcial',  color: C.partial  },
        { key: 'pendientes', label: 'Pendientes',        color: C.pending  },
        { key: 'canceladas', label: 'Canceladas',        color: C.cancel   },
    ];

    const yTicks = maxVal <= 2
        ? [0, maxVal]
        : [0, Math.round(maxVal / 2), maxVal];

    const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
        onMove(e);
        const rect = e.currentTarget.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * VW - PAD.l;
        const step = n > 1 ? W / (n - 1) : W;
        const idx = Math.max(0, Math.min(n - 1, Math.round(svgX / step)));
        setHoverIdx(idx);
        const m = data[idx];
        if (!m) return;
        const tot = m.entregadas + m.parciales + m.pendientes + m.canceladas;
        onShow(e, m.mes, [
            { label: 'Total',            value: tot },
            { label: 'Entrega completa', value: m.entregadas, color: C.complete },
            { label: 'Entrega parcial',  value: m.parciales,  color: C.partial  },
            { label: 'Pendientes',       value: m.pendientes, color: C.pending  },
            { label: 'Canceladas',       value: m.canceladas, color: C.cancel   },
        ]);
    };

    return (
        <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            onMouseMove={handleMove}
            onMouseLeave={() => { onHide(); setHoverIdx(null); }}
        >
            <defs>
                {series.map(s => (
                    <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={s.color} stopOpacity="0.22"/>
                        <stop offset="100%" stopColor={s.color} stopOpacity="0.01"/>
                    </linearGradient>
                ))}
                <linearGradient id="g-base" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#94a3b8" stopOpacity="0.07"/>
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0"/>
                </linearGradient>
            </defs>

            {/* Y-axis grid */}
            {yTicks.map(t => (
                <g key={t}>
                    <line x1={PAD.l} y1={yOf(t)} x2={PAD.l + W} y2={yOf(t)}
                        stroke="var(--line-1)" strokeWidth={t === 0 ? 1 : 0.5}
                        strokeDasharray={t === 0 ? undefined : '4 4'}/>
                    <text x={PAD.l - 5} y={yOf(t)} textAnchor="end" dominantBaseline="middle"
                        fill="var(--ink-4)" fontSize={9}>{t}</text>
                </g>
            ))}

            {/* Areas */}
            {series.map(s => {
                const vals = data.map(m => m[s.key]);
                if (vals.every(v => v === 0)) return null;
                return <path key={`a-${s.key}`} d={makeArea(vals)} fill={`url(#g-${s.key})`}/>;
            })}

            {/* Lines */}
            {series.map(s => {
                const vals = data.map(m => m[s.key]);
                if (vals.every(v => v === 0)) return null;
                return (
                    <path key={`l-${s.key}`} d={makeLine(vals)}
                        fill="none" stroke={s.color} strokeWidth={2}
                        strokeLinejoin="round" strokeLinecap="round"/>
                );
            })}

            {/* Dots on data points */}
            {series.map(s =>
                data.map((m, i) => {
                    const v = m[s.key];
                    if (v === 0) return null;
                    const isHov = hoverIdx === i;
                    return (
                        <circle key={`d-${s.key}-${i}`}
                            cx={xOf(i)} cy={yOf(v)}
                            r={isHov ? 4 : 2.5}
                            fill={s.color} stroke="white" strokeWidth={1.5}
                            style={{ transition: 'r 0.1s' }}/>
                    );
                })
            )}

            {/* Hover vertical line */}
            {hoverIdx !== null && (
                <line x1={xOf(hoverIdx)} y1={PAD.t} x2={xOf(hoverIdx)} y2={PAD.t + H}
                    stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3"
                    pointerEvents="none"/>
            )}

            {/* X-axis labels */}
            {data.map((m, i) => {
                const skip = n > 8 && i % 2 !== 0;
                if (skip) return null;
                return (
                    <text key={i} x={xOf(i)} y={VH - 4} textAnchor="middle"
                        fill="var(--ink-4)" fontSize={9}>
                        {m.mes}
                    </text>
                );
            })}
        </svg>
    );
}

function EmptyState({ icon, text, positive }: { icon: string; text: string; positive?: boolean }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '24px 0', gap: 8,
            color: positive ? '#059669' : 'var(--ink-4)',
        }}>
            <Icon name={icon} size={22} style={{ opacity: 0.4 }}/>
            <span style={{ fontSize: 12 }}>{text}</span>
        </div>
    );
}
