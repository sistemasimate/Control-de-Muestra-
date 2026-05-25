<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudDetalle extends Model
{
    protected $table = 'sic_muestras_solicitudes_detalle';

    public $timestamps = false;

    protected $fillable = [
        'solicitud_id', 'articulo_id', 'almacen_id',
        'cantidad', 'unidad', 'costo_unitario', 'impuesto', 'total_linea', 'lote',
        'codigo_articulo', 'descripcion', 'proveedor', 'almacen_codigo',
    ];

    protected $casts = [
        'cantidad'       => 'float',
        'costo_unitario' => 'float',
        'total_linea'    => 'float',
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }
}
