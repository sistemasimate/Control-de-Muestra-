<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use App\Models\Entrega;
use App\Models\EntregaDetalle;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class EntregaController extends Controller
{
    public function show(Solicitud $solicitud, int $entregaId): Response
    {
        $solicitud->load('lineas');
        $entrega = $solicitud->entregas()->findOrFail($entregaId);
        $entrega->load('lineas');
        $todasEntregas = $solicitud->entregas()->orderBy('id')->get(['id','folio','fecha_entrega','total','estatus']);
        return Inertia::render('Entregas/Show', [
            'solicitud'       => $solicitud,
            'entrega'         => $entrega,
            'todas_entregas'  => $todasEntregas,
        ]);
    }

    public function create(Solicitud $solicitud): Response
    {
        $solicitud->load('lineas');

        // Solo suma entregas NO canceladas
        $entregadoPorLinea = EntregaDetalle::whereHas('entrega', fn($q) =>
            $q->where('solicitud_id', $solicitud->id)->where('estatus', '!=', 'Cancelada')
        )
            ->selectRaw('solicitud_detalle_id, SUM(cantidad_entregada) as total_entregado')
            ->groupBy('solicitud_detalle_id')
            ->pluck('total_entregado', 'solicitud_detalle_id');

        $solicitud->lineas->each(function ($linea) use ($entregadoPorLinea) {
            $entregado = (float) ($entregadoPorLinea[$linea->id] ?? 0);
            $linea->cantidad_pendiente = max(0, $linea->cantidad - $entregado);
        });

        return Inertia::render('Entregas/Create', [
            'solicitud'     => $solicitud,
            'folio_entrega' => Entrega::generarFolio($solicitud),
        ]);
    }

    public function store(Request $req, Solicitud $solicitud): RedirectResponse
    {
        $req->validate([
            'autorizador'    => 'nullable|string|max:150',
            'fecha_entrega'  => 'nullable|date',
            'comentarios'    => 'nullable|string',
            'destinatario'   => 'nullable|string|max:250',
            'direccion_envio'=> 'nullable|string|max:500',
            'ciudad'         => 'nullable|string|max:150',
            'estado'         => 'nullable|string|max:100',
            'cp'             => 'nullable|string|max:10',
            'telefono'       => 'nullable|string|max:50',
            'forma_envio'    => 'nullable|string|max:100',
            'paqueteria'     => 'nullable|string|max:100',
            'numero_guia'    => 'nullable|string|max:100',
            'lineas'         => 'required|array|min:1',
            'lineas.*.solicitud_detalle_id' => 'required|integer',
            'lineas.*.cantidad_entregada'   => 'required|numeric|min:0',
            'lineas.*.almacen_codigo'       => 'nullable|string|max:50',
            'lineas.*.lote'                 => 'nullable|string|max:100',
            'lineas.*.proveedor'            => 'nullable|string|max:200',
        ]);

        $entregaId = null;

        DB::transaction(function () use ($req, $solicitud, &$entregaId) {
            $folio = Entrega::generarFolio($solicitud);

            $subtotal = 0;
            foreach ($req->lineas as $l) {
                if ((float) $l['cantidad_entregada'] <= 0) continue;
                $det = $solicitud->lineas()->findOrFail($l['solicitud_detalle_id']);
                $subtotal += (float) $det->costo_unitario * (float) $l['cantidad_entregada'];
            }
            $iva   = $subtotal * 0.16;
            $total = $subtotal + $iva;

            $entrega = Entrega::create([
                'folio'          => $folio,
                'solicitud_id'   => $solicitud->id,
                'estatus'        => 'Entregada',
                'autorizador'    => $req->autorizador,
                'fecha_entrega'  => $req->fecha_entrega ? \Carbon\Carbon::parse($req->fecha_entrega) : now(),
                'comentarios'    => $req->comentarios,
                'subtotal'       => $subtotal,
                'iva'            => $iva,
                'total'          => $total,
                'destinatario'   => $req->destinatario,
                'direccion_envio'=> $req->direccion_envio,
                'ciudad'         => $req->ciudad,
                'estado'         => $req->estado,
                'cp'             => $req->cp,
                'telefono'       => $req->telefono,
                'forma_envio'    => $req->forma_envio,
                'paqueteria'     => $req->paqueteria,
                'numero_guia'    => $req->numero_guia,
            ]);

            foreach ($req->lineas as $l) {
                if ((float) $l['cantidad_entregada'] <= 0) continue;
                $det = $solicitud->lineas()->findOrFail($l['solicitud_detalle_id']);

                EntregaDetalle::create([
                    'entrega_id'           => $entrega->id,
                    'solicitud_detalle_id' => $det->id,
                    'articulo_id'          => $det->articulo_id,
                    'almacen_id'           => $det->almacen_id,
                    'cantidad_solicitada'  => $det->cantidad,
                    'cantidad_entregada'   => $l['cantidad_entregada'],
                    'unidad'               => $det->unidad,
                    'costo_unitario'       => $det->costo_unitario,
                    'total_linea'          => (float) $det->costo_unitario * (float) $l['cantidad_entregada'],
                    'almacen_codigo'       => $l['almacen_codigo'] ?? $det->almacen_codigo,
                    'lote'                 => $l['lote'] ?? $det->lote,
                    'proveedor'            => $l['proveedor'] ?? $det->proveedor,
                ]);
            }

            // Solo cuenta entregas NO canceladas para decidir el estatus
            $solicitud->load('lineas');
            $entregadoPorLinea = EntregaDetalle::whereHas('entrega', fn($q) =>
                $q->where('solicitud_id', $solicitud->id)->where('estatus', '!=', 'Cancelada')
            )
                ->selectRaw('solicitud_detalle_id, SUM(cantidad_entregada) as total_entregado')
                ->groupBy('solicitud_detalle_id')
                ->pluck('total_entregado', 'solicitud_detalle_id');

            $todoEntregado = $solicitud->lineas->every(fn($linea) =>
                (float) ($entregadoPorLinea[$linea->id] ?? 0) >= (float) $linea->cantidad
            );

            $solicitud->update(['estatus' => $todoEntregado ? 'Entrega completa' : 'Entrega parcial']);
            $entregaId = $entrega->id;
        });

        return redirect()->route('solicitudes.entrega.show', [$solicitud->folio, $entregaId])
            ->with('success', 'Entrega registrada correctamente.');
    }

    public function cancelar(Request $req, Solicitud $solicitud, int $entregaId): RedirectResponse
    {
        $entrega = $solicitud->entregas()->findOrFail($entregaId);

        DB::transaction(function () use ($solicitud, $entrega) {
            $entrega->update(['estatus' => 'Cancelada']);

            $solicitud->load('lineas');

            // Suma solo entregas activas (no canceladas)
            $entregadoPorLinea = EntregaDetalle::whereHas('entrega', fn($q) =>
                $q->where('solicitud_id', $solicitud->id)->where('estatus', '!=', 'Cancelada')
            )
                ->selectRaw('solicitud_detalle_id, SUM(cantidad_entregada) as total_entregado')
                ->groupBy('solicitud_detalle_id')
                ->pluck('total_entregado', 'solicitud_detalle_id');

            // Si no queda ninguna entrega activa → Pendiente
            if ($entregadoPorLinea->sum() == 0) {
                $nuevoEstatus = 'Pendiente';
            } else {
                $todoEntregado = $solicitud->lineas->every(fn($linea) =>
                    (float) ($entregadoPorLinea[$linea->id] ?? 0) >= (float) $linea->cantidad
                );
                $nuevoEstatus = $todoEntregado ? 'Entrega completa' : 'Entrega parcial';
            }

            $solicitud->update(['estatus' => $nuevoEstatus]);
        });

        return redirect()->route('solicitudes.entrega.show', [$solicitud->folio, $entregaId])
            ->with('success', 'Entrega cancelada. La solicitud volvió a Pendiente.');
    }

    public function update(Request $req, Solicitud $solicitud, int $entregaId): RedirectResponse
    {
        $req->validate([
            'fecha_entrega'  => 'nullable|date',
            'destinatario'   => 'nullable|string|max:250',
            'direccion_envio'=> 'nullable|string|max:500',
            'ciudad'         => 'nullable|string|max:150',
            'estado'         => 'nullable|string|max:100',
            'cp'             => 'nullable|string|max:10',
            'telefono'       => 'nullable|string|max:50',
            'forma_envio'    => 'nullable|string|max:100',
            'paqueteria'     => 'nullable|string|max:100',
            'numero_guia'    => 'nullable|string|max:100',
        ]);

        $entrega = $solicitud->entregas()->findOrFail($entregaId);

        $entrega->update([
            'fecha_entrega'  => $req->fecha_entrega ? \Carbon\Carbon::parse($req->fecha_entrega) : $entrega->fecha_entrega,
            'destinatario'   => $req->destinatario,
            'direccion_envio'=> $req->direccion_envio,
            'ciudad'         => $req->ciudad,
            'estado'         => $req->estado,
            'cp'             => $req->cp,
            'telefono'       => $req->telefono,
            'forma_envio'    => $req->forma_envio,
            'paqueteria'     => $req->paqueteria,
            'numero_guia'    => $req->numero_guia,
        ]);

        return redirect()->route('solicitudes.entrega.show', [$solicitud->folio, $entregaId])
            ->with('success', 'Entrega actualizada correctamente.');
    }
}
