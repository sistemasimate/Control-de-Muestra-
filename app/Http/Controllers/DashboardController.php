<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use App\Models\Articulo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $solicitudes = Solicitud::with('lineas')->get();

        $entregadas        = $solicitudes->where('estatus', 'Entregada')->count();
        $pendientes        = $solicitudes->where('estatus', 'Pendiente')->count();
        $canceladas        = $solicitudes->where('estatus', 'Cancelada')->count();
        $totalSolicitudes  = $solicitudes->count();
        $convertidas       = $solicitudes->whereNotNull('conversion_ov_sap')->count();
        $conversion        = $entregadas ? round(($convertidas / $entregadas) * 100) : 0;
        $clientesAtendidos = $solicitudes->pluck('cliente_nombre')->filter()->unique()->count();

        $costoTotal   = $solicitudes->whereIn('estatus', ['Entregada', 'Devuelta', 'Aprobada'])
            ->sum(fn($s) => (float) $s->total);
        $costoPromedio = $entregadas > 0 ? round($costoTotal / $entregadas, 2) : 0;

        // Entregas por mes — últimos 12 meses (entregadas + pendientes + canceladas)
        $meses = collect(range(0, 11))->map(function ($i) {
            $start = now()->startOfMonth()->subMonths(11 - $i);
            $end   = $start->copy()->endOfMonth();
            return [
                'mes'        => ucfirst($start->locale('es')->isoFormat('MMM YY')),
                'entregadas' => Solicitud::whereBetween('fecha_solicitud', [$start, $end])->where('estatus', 'Entregada')->count(),
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
            'entregadas' => $g->where('estatus', 'Entregada')->count(),
            'monto'      => round($g->sum(fn($s) => (float) $s->total), 2),
        ])->sortByDesc('total')->take(6)->values();

        // Solicitudes pendientes recientes
        $solicitudesPendientes = $solicitudes->where('estatus', 'Pendiente')
            ->sortByDesc('fecha_solicitud')->take(5)->values();

        // Actividad reciente (últimas 6 solicitudes)
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
                'pendientes'        => $pendientes,
                'canceladas'        => $canceladas,
                'costoTotal'        => $costoTotal,
                'costoPromedio'     => $costoPromedio,
                'clientesAtendidos' => $clientesAtendidos,
                'conversion'        => $conversion,
                'convertidas'       => $convertidas,
            ],
            'meses'                 => $meses,
            'topClientes'           => $topClientes,
            'porVendedor'           => $porVendedor,
            'solicitudesPendientes' => $solicitudesPendientes,
            'recientes'             => $recientes,
        ]);
    }
}
