<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movimiento extends Model
{
    protected $table = 'sic_muestras_movimientos';

    public $timestamps = false;

    protected $fillable = [
        'articulo_id', 'almacen_id', 'tipo_movimiento',
        'documento_tipo', 'documento_folio',
        'cantidad', 'costo_unitario', 'costo_total',
        'usuario', 'comentarios', 'fecha_movimiento',
    ];

    protected $casts = [
        'fecha_movimiento' => 'datetime',
        'cantidad'         => 'decimal:6',
        'costo_unitario'   => 'decimal:6',
        'costo_total'      => 'decimal:6',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }
}
