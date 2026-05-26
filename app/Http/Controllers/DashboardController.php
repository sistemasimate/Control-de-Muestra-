<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $solicitudes = Solicitud::with('lineas')->get();

        $entregadas        = $solicitudes->whereIn('estatus', ['Entrega completa', 'Entregada'])->count();
        $parciales         = $solicitudes->whereIn('estatus', ['Entrega parcial', 'Parcial'])->count();
        $pendientes        = $solicitudes->where('estatus', 'Pendiente')->count();
        $canceladas        = $solicitudes->where('estatus', 'Cancelada')->count();
        $totalSolicitudes  = $solicitudes->count();
        $convertidas       = $solicitudes->whereNotNull('conversion_ov_sap')->count();
        $clientesAtendidos = $solicitudes->pluck('cliente_nombre')->filter()->unique()->count();

        $costoTotal = $solicitudes->whereIn('estatus', ['Entrega completa', 'Entregada', 'Entrega parcial', 'Parcial', 'Devuelta', 'Aprobada'])
            ->sum(fn($s) => (float) $s->total);
        $conversion = $entregadas > 0 ? round(($convertidas / $entregadas) * 100) : 0;

        // Kilos entregados
        $kilosEntregados = (float) (DB::table('sic_muestras_entregas_detalle as ed')
            ->join('sic_muestras_solicitudes_detalle as sd', 'sd.id', '=', 'ed.solicitud_detalle_id')
            ->join('sic_muestras_entregas as e', 'e.id', '=', 'ed.entrega_id')
            ->where('e.estatus', '!=', 'Cancelada')
            ->whereRaw("UPPER(sd.unidad) = 'KG'")
            ->sum('ed.cantidad_entregada') ?? 0);

        // Producto más solicitado
        $topProductoRow = DB::table('sic_muestras_solicitudes_detalle')
            ->whereNotNull('descripcion')->where('descripcion', '!=', '')
            ->selectRaw('descripcion, ROUND(SUM(cantidad), 2) as total_qty, COUNT(*) as veces')
            ->groupBy('descripcion')
            ->orderByDesc('total_qty')
            ->first();
        $topProducto = $topProductoRow
            ? ['descripcion' => $topProductoRow->descripcion, 'qty' => (float) $topProductoRow->total_qty, 'veces' => (int) $topProductoRow->veces]
            : null;

        // Almacén con mayor movimiento
        $topAlmacenRow = DB::table('sic_muestras_solicitudes_detalle')
            ->whereNotNull('almacen_codigo')->where('almacen_codigo', '!=', '')
            ->selectRaw('almacen_codigo, COUNT(*) as total')
            ->groupBy('almacen_codigo')
            ->orderByDesc('total')
            ->first();
        $topAlmacen = $topAlmacenRow
            ? ['codigo' => $topAlmacenRow->almacen_codigo, 'total' => (int) $topAlmacenRow->total]
            : null;

        // Tendencia mensual — últimos 12 meses
        $meses = collect(range(0, 11))->map(function ($i) {
            $start = now()->startOfMonth()->subMonths(11 - $i);
            $end   = $start->copy()->endOfMonth();
            return [
                'mes'        => ucfirst($start->locale('es')->isoFormat('MMM YY')),
                'entregadas' => Solicitud::whereBetween('fecha_solicitud', [$start, $end])->whereIn('estatus', ['Entrega completa', 'Entregada'])->count(),
                'parciales'  => Solicitud::whereBetween('fecha_solicitud', [$start, $end])->whereIn('estatus', ['Entrega parcial', 'Parcial'])->count(),
                'pendientes' => Solicitud::whereBetween('fecha_solicitud', [$start, $end])->where('estatus', 'Pendiente')->count(),
                'canceladas' => Solicitud::whereBetween('fecha_solicitud', [$start, $end])->where('estatus', 'Cancelada')->count(),
            ];
        });

        // Top clientes
        $topClientes = $solicitudes->groupBy('cliente_nombre')->map(fn($g, $nombre) => [
            'nombre' => $nombre ?: '(sin nombre)',
            'n'      => $g->count(),
            'monto'  => round($g->sum(fn($s) => (float) $s->total), 2),
        ])->sortByDesc('n')->take(6)->values();

        // Por vendedor
        $porVendedor = $solicitudes->groupBy('vendedor')->map(fn($g, $v) => [
            'nombre'     => $v ?: '(sin asignar)',
            'total'      => $g->count(),
            'entregadas' => $g->whereIn('estatus', ['Entrega completa', 'Entregada'])->count(),
            'monto'      => round($g->sum(fn($s) => (float) $s->total), 2),
        ])->sortByDesc('total')->take(6)->values();

        // Solicitudes pendientes recientes
        $solicitudesPendientes = $solicitudes->where('estatus', 'Pendiente')
            ->sortByDesc('fecha_solicitud')->take(5)->values();

        // Actividad reciente
        $recientes = $solicitudes->sortByDesc('fecha_solicitud')->take(6)->map(fn($s) => [
            'folio'   => $s->folio,
            'cliente' => $s->cliente_nombre,
            'estatus' => $s->estatus,
            'total'   => (float) $s->total,
            'fecha'   => $s->fecha_solicitud,
        ])->values();

        return Inertia::render('Dashboard', [
            'kpis' => [
                'totalSolicitudes'  => $totalSolicitudes,
                'entregadas'        => $entregadas,
                'parciales'         => $parciales,
                'pendientes'        => $pendientes,
                'canceladas'        => $canceladas,
                'costoTotal'        => $costoTotal,
                'clientesAtendidos' => $clientesAtendidos,
                'kilosEntregados'   => $kilosEntregados,
                'conversion'        => $conversion,
                'convertidas'       => $convertidas,
            ],
            'meses'                 => $meses,
            'topClientes'           => $topClientes,
            'porVendedor'           => $porVendedor,
            'solicitudesPendientes' => $solicitudesPendientes,
            'recientes'             => $recientes,
            'topProducto'           => $topProducto,
            'topAlmacen'            => $topAlmacen,
        ]);
    }
}
