<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntregaDetalle extends Model
{
    protected $table = 'sic_muestras_entregas_detalle';

    public $timestamps = false;

    protected $fillable = [
        'entrega_id', 'solicitud_detalle_id', 'articulo_id', 'almacen_id',
        'cantidad_solicitada', 'cantidad_entregada', 'unidad',
        'costo_unitario', 'total_linea',
        'almacen_codigo', 'lote', 'proveedor',
    ];

    protected $casts = [
        'cantidad_solicitada' => 'decimal:6',
        'cantidad_entregada'  => 'decimal:6',
        'costo_unitario'      => 'decimal:6',
        'total_linea'         => 'decimal:6',
    ];

    public function entrega(): BelongsTo
    {
        return $this->belongsTo(Entrega::class, 'entrega_id');
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
