<?php

namespace App\Http\Controllers;

use App\Exports\SolicitudesExport;
use App\Models\Solicitud;
use App\Models\SolicitudDetalle;
use App\Models\Articulo;
use App\Models\Almacen;
use App\Models\Autorizacion;
use App\Models\Movimiento;
use App\Models\Existencia;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class SolicitudController extends Controller
{
    public function index(Request $req): Response
    {
        $q = Solicitud::with('lineas', 'entregas')
            ->orderBy('created_at', 'desc');

        if ($req->filled('folio'))   $q->where('folio', 'like', '%'.$req->folio.'%');
        if ($req->filled('cliente')) $q->where('cliente_nombre', 'like', '%'.$req->cliente.'%');
        if ($req->filled('estatus')) $q->where('estatus', $req->estatus);
        if ($req->filled('vendedor'))$q->where('vendedor', 'like', '%'.$req->vendedor.'%');

        $solicitudes = $q->paginate(10)->withQueryString();

        return Inertia::render('Solicitudes/Index', [
            'solicitudes' => $solicitudes,
            'filtros'     => (object) array_merge(
                ['folio' => null, 'cliente' => null, 'estatus' => null, 'vendedor' => null, 'sel' => null],
                $req->only(['folio','cliente','estatus','vendedor','sel'])
            ),
        ]);
    }

    public function store(Request $req): RedirectResponse
    {
        $req->validate([
            'cliente_nombre'   => 'required|string|max:250',
            'vendedor'         => 'nullable|string|max:150',
            'autorizador'      => 'nullable|string|max:150',
            'direccion_entrega'=> 'nullable|string|max:500',
            'motivo'           => 'nullable|string|max:500',
            'lineas'                   => 'required|array|min:1',
            'lineas.*.codigo_articulo' => 'nullable|string|max:100',
            'lineas.*.descripcion'     => 'required|string|max:250',
            'lineas.*.cantidad'        => 'required|numeric|min:0.001',
            'lineas.*.unidad'          => 'nullable|string|max:50',
            'lineas.*.costo_unitario'  => 'nullable|numeric|min:0',
            'lineas.*.almacen_codigo'  => 'nullable|string|max:50',
            'lineas.*.lote'            => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($req) {
            $folio = Solicitud::generarFolio();

            $subtotal = collect($req->lineas)->sum(function ($l) {
                return (float) ($l['costo_unitario'] ?? 0) * (float) $l['cantidad'];
            });
            $iva   = $subtotal * 0.16;
            $total = $subtotal + $iva;

            $nivel = $this->calcularNivelAutorizacion($total, $req->lineas);

            $sol = Solicitud::create([
                'folio'               => $folio,
                'cliente_codigo'      => $req->cliente_codigo,
                'cliente_nombre'      => $req->cliente_nombre,
                'orden_compra'        => $req->orden_compra,
                'vendedor'            => $req->vendedor,
                'proyecto'            => $req->proyecto,
                'direccion_entrega'   => $req->direccion_entrega,
                'motivo'              => $req->motivo,
                'comentarios'         => $req->comentarios,
                'autorizador'         => $req->autorizador,
                'estatus'             => 'Pendiente',
                'autorizacion_requerida' => $nivel,
                'usuario_solicita'    => $req->user()?->name ?? $req->header('X-Usuario', 'Sistema'),
                'subtotal'            => $subtotal,
                'iva'                 => $iva,
                'total'               => $total,
            ]);

            foreach ($req->lineas as $l) {
                $costo    = (float) ($l['costo_unitario'] ?? 0);
                $linTotal = $costo * (float) $l['cantidad'];
                SolicitudDetalle::create([
                    'solicitud_id'    => $sol->id,
                    'articulo_id'     => null,
                    'almacen_id'      => null,
                    'codigo_articulo' => $l['codigo_articulo'] ?? null,
                    'descripcion'     => $l['descripcion'],
                    'proveedor'       => $l['proveedor'] ?? null,
                    'cantidad'        => $l['cantidad'],
                    'unidad'          => $l['unidad'] ?? '',
                    'costo_unitario'  => $costo,
                    'almacen_codigo'  => $l['almacen_codigo'] ?? null,
                    'impuesto'        => 'IVA16',
                    'total_linea'     => $linTotal,
                    'lote'            => $l['lote'] ?? null,
                ]);
            }
        });

        return redirect()->route('solicitudes.index')
            ->with('success', 'Solicitud creada correctamente.');
    }

    public function update(Request $req, Solicitud $solicitud): RedirectResponse
    {
        $req->validate([
            'orden_compra'    => 'nullable|string|max:100',
            'fecha_solicitud' => 'required|date',
            'autorizador'     => 'nullable|string|max:150',
            'lineas'          => 'required|array|min:1',
            'lineas.*.id'                => 'nullable|integer',
            'lineas.*.codigo_articulo'   => 'nullable|string|max:100',
            'lineas.*.descripcion'       => 'required|string|max:250',
            'lineas.*.cantidad'          => 'required|numeric|min:0.001',
            'lineas.*.unidad'            => 'nullable|string|max:50',
            'lineas.*.costo_unitario'    => 'nullable|numeric|min:0',
            'lineas.*.almacen_codigo'    => 'nullable|string|max:50',
            'lineas.*.lote'              => 'nullable|string|max:100',
            'lineas.*.proveedor'         => 'nullable|string|max:200',
        ]);

        DB::transaction(function () use ($req, $solicitud) {
            $solicitud->update([
                'orden_compra'    => $req->orden_compra,
                'fecha_solicitud' => \Carbon\Carbon::parse($req->fecha_solicitud),
                'autorizador'     => $req->autorizador,
            ]);

            $existingIds   = $solicitud->lineas()->pluck('id')->toArray();
            $submittedIds  = collect($req->lineas)->pluck('id')->filter()->values()->toArray();
            $toDelete      = array_diff($existingIds, $submittedIds);

            if (!empty($toDelete)) {
                $solicitud->lineas()->whereIn('id', $toDelete)->delete();
            }

            $subtotal = 0;
            foreach ($req->lineas as $l) {
                $costo      = (float) ($l['costo_unitario'] ?? 0);
                $totalLinea = $costo * (float) $l['cantidad'];
                $subtotal  += $totalLinea;

                $data = [
                    'codigo_articulo' => $l['codigo_articulo'] ?? null,
                    'descripcion'     => $l['descripcion'],
                    'cantidad'        => $l['cantidad'],
                    'unidad'          => $l['unidad'] ?? '',
                    'costo_unitario'  => $costo,
                    'total_linea'     => $totalLinea,
                    'almacen_codigo'  => $l['almacen_codigo'] ?? null,
                    'lote'            => $l['lote'] ?? null,
                    'proveedor'       => $l['proveedor'] ?? null,
                ];

                if (!empty($l['id'])) {
                    $solicitud->lineas()->where('id', $l['id'])->update($data);
                } else {
                    $solicitud->lineas()->create(array_merge($data, [
                        'solicitud_id' => $solicitud->id,
                        'impuesto'     => 'IVA16',
                    ]));
                }
            }

            $iva = $subtotal * 0.16;
            $solicitud->update([
                'subtotal' => $subtotal,
                'iva'      => $iva,
                'total'    => $subtotal + $iva,
                'autorizacion_requerida' => $this->calcularNivelAutorizacion($subtotal + $iva, $req->lineas),
            ]);
        });

        return redirect()->route('solicitudes.index', ['sel' => $solicitud->folio])
            ->with('success', 'Solicitud actualizada correctamente.');
    }

    public function show(Solicitud $solicitud): Response
    {
        $solicitud->load([
            'lineas.articulo.existencias.almacen',
            'lineas.almacen',
            'autorizaciones',
            'entregas.lineas',
            'seguimientos',
            'adjuntos',
        ]);

        return Inertia::render('Solicitudes/Show', [
            'solicitud' => $solicitud,
        ]);
    }

    public function aprobar(Request $req, Solicitud $solicitud): RedirectResponse
    {
        $req->validate(['comentarios' => 'nullable|string|max:500']);

        $solicitud->update(['estatus' => 'Aprobada']);
        Autorizacion::create([
            'solicitud_id'      => $solicitud->id,
            'usuario_autoriza'  => $req->header('X-Usuario', 'Sistema'),
            'nivel_autorizacion'=> $solicitud->autorizacion_requerida,
            'estatus'           => 'Aprobada',
            'comentarios'       => $req->comentarios,
        ]);

        return back()->with('success', 'Solicitud aprobada.');
    }

    public function rechazar(Request $req, Solicitud $solicitud): RedirectResponse
    {
        $req->validate(['comentarios' => 'required|string|max:500']);

        $solicitud->update(['estatus' => 'Rechazada']);
        Autorizacion::create([
            'solicitud_id'      => $solicitud->id,
            'usuario_autoriza'  => $req->header('X-Usuario', 'Sistema'),
            'nivel_autorizacion'=> $solicitud->autorizacion_requerida,
            'estatus'           => 'Rechazada',
            'comentarios'       => $req->comentarios,
        ]);

        return back()->with('success', 'Solicitud rechazada.');
    }

    public function export(Request $req): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $filters = $req->only([
            'fecha_ini', 'fecha_fin', 'cliente', 'estatus',
            'vendedor', 'autorizador', 'producto', 'almacen', 'tipo_envio',
        ]);

        $filename = 'control-muestras-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(new SolicitudesExport($filters), $filename);
    }

    public function cancelar(Request $req, Solicitud $solicitud): RedirectResponse
    {
        $solicitud->update(['estatus' => 'Cancelada']);
        return back()->with('success', 'Solicitud cancelada.');
    }

    private function calcularNivelAutorizacion(float $total, array $lineas): string
    {
        if ($total > 1000) return 'Dirección';
        if ($total > 300)  return 'Gerente';
        return 'Vendedor';
    }
}
