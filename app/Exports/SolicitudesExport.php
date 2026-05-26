<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class SolicitudesExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(protected array $filters = []) {}

    public function title(): string
    {
        return 'Control de Muestras';
    }

    public function headings(): array
    {
        return [
            'Folio Solicitud', 'Folio Entrega', 'Fecha Solicitud', 'Fecha Entrega',
            'Días de Entrega', 'Cliente', 'Vendedor', 'Código Artículo',
            'Descripción', 'Cant. Solicitada', 'Cant. Entregada', 'Unidad',
            'Almacén', 'Lote', 'Proveedor', 'Estatus', 'Autorizador',
            'Tipo de Envío', 'Comentarios', 'Costo Unitario', 'Costo Total',
        ];
    }

    public function collection(): Collection
    {
        $f = $this->filters;

        $rows = DB::table('sic_muestras_solicitudes_detalle as sd')
            ->join('sic_muestras_solicitudes as s', 's.id', '=', 'sd.solicitud_id')
            ->leftJoin('sic_muestras_entregas_detalle as ed', 'ed.solicitud_detalle_id', '=', 'sd.id')
            ->leftJoin('sic_muestras_entregas as ent', function ($join) {
                $join->on('ent.id', '=', 'ed.entrega_id')
                     ->where('ent.estatus', '!=', 'Cancelada');
            })
            ->select([
                's.folio as folio_solicitud',
                DB::raw("COALESCE(ent.folio, '') as folio_entrega"),
                's.fecha_solicitud',
                'ent.fecha_entrega',
                DB::raw("CASE WHEN ent.fecha_entrega IS NOT NULL THEN DATEDIFF(ent.fecha_entrega, s.fecha_solicitud) ELSE '' END as dias_entrega"),
                's.cliente_nombre',
                DB::raw("COALESCE(s.vendedor, '') as vendedor"),
                DB::raw("COALESCE(sd.codigo_articulo, '') as codigo_articulo"),
                DB::raw("COALESCE(sd.descripcion, '') as descripcion"),
                'sd.cantidad as cantidad_solicitada',
                DB::raw("COALESCE(ed.cantidad_entregada, '') as cantidad_entregada"),
                DB::raw("COALESCE(sd.unidad, '') as unidad"),
                DB::raw("COALESCE(ed.almacen_codigo, sd.almacen_codigo, '') as almacen"),
                DB::raw("COALESCE(ed.lote, sd.lote, '') as lote"),
                DB::raw("COALESCE(ed.proveedor, sd.proveedor, '') as proveedor"),
                's.estatus',
                DB::raw("COALESCE(ent.autorizador, s.autorizador, '') as autorizador"),
                DB::raw("COALESCE(ent.forma_envio, '') as tipo_envio"),
                DB::raw("COALESCE(ent.comentarios, s.comentarios, '') as comentarios"),
                DB::raw("COALESCE(ed.costo_unitario, sd.costo_unitario, 0) as costo_unitario"),
                DB::raw("COALESCE(ed.total_linea, 0) as costo_total"),
            ])
            ->when(!empty($f['fecha_ini']), fn($q) => $q->where('s.fecha_solicitud', '>=', $f['fecha_ini']))
            ->when(!empty($f['fecha_fin']), fn($q) => $q->where('s.fecha_solicitud', '<=', $f['fecha_fin'] . ' 23:59:59'))
            ->when(!empty($f['cliente']),   fn($q) => $q->where('s.cliente_nombre', 'like', '%' . $f['cliente'] . '%'))
            ->when(!empty($f['estatus']),   fn($q) => $q->where('s.estatus', $f['estatus']))
            ->when(!empty($f['vendedor']),  fn($q) => $q->where('s.vendedor', 'like', '%' . $f['vendedor'] . '%'))
            ->when(!empty($f['autorizador']), fn($q) => $q->where(fn($s) =>
                $s->where('s.autorizador', 'like', '%' . $f['autorizador'] . '%')
                  ->orWhere('ent.autorizador', 'like', '%' . $f['autorizador'] . '%')
            ))
            ->when(!empty($f['producto']),  fn($q) => $q->where('sd.descripcion', 'like', '%' . $f['producto'] . '%'))
            ->when(!empty($f['almacen']),   fn($q) => $q->where(fn($s) =>
                $s->where('ed.almacen_codigo', 'like', '%' . $f['almacen'] . '%')
                  ->orWhere('sd.almacen_codigo', 'like', '%' . $f['almacen'] . '%')
            ))
            ->when(!empty($f['tipo_envio']), fn($q) => $q->where('ent.forma_envio', $f['tipo_envio']))
            ->orderByDesc('s.fecha_solicitud')
            ->orderBy('s.folio')
            ->orderBy('ent.folio')
            ->orderBy('sd.id')
            ->get();

        return $rows->map(fn($r) => [
            $r->folio_solicitud,
            $r->folio_entrega,
            $r->fecha_solicitud ? date('d/m/Y', strtotime($r->fecha_solicitud)) : '',
            $r->fecha_entrega   ? date('d/m/Y', strtotime($r->fecha_entrega))   : '',
            $r->dias_entrega,
            $r->cliente_nombre,
            $r->vendedor,
            $r->codigo_articulo,
            $r->descripcion,
            $r->cantidad_solicitada,
            $r->cantidad_entregada,
            $r->unidad,
            $r->almacen,
            $r->lote,
            $r->proveedor,
            $r->estatus,
            $r->autorizador,
            $r->tipo_envio,
            $r->comentarios,
            (float) $r->costo_unitario,
            (float) $r->costo_total,
        ]);
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1d4ed8']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }
}
