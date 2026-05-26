<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Inertia\Inertia;
use Inertia\Response;

class AutorizacionController extends Controller
{
    public function index(): Response
    {
        $pendientes = Solicitud::with('lineas.articulo')
            ->where('estatus', 'Pendiente')
            ->orderBy('fecha_solicitud')
            ->get();

        $historial = Solicitud::with('autorizaciones')
            ->whereIn('estatus', ['Aprobada','Rechazada','Entrega completa','Entrega parcial','Entregada','Devuelta'])
            ->orderByDesc('updated_at')
            ->take(20)->get();

        return Inertia::render('Autorizaciones/Index', [
            'pendientes' => $pendientes,
            'historial'  => $historial,
        ]);
    }
}
