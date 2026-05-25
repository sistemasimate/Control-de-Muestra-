<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Existencia extends Model
{
    protected $table = 'sic_muestras_existencias';

    public $timestamps = false;

    protected $fillable = [
        'articulo_id', 'almacen_id',
        'cantidad_disponible', 'cantidad_apartada', 'cantidad_entregada',
    ];

    protected $casts = [
        'cantidad_disponible' => 'float',
        'cantidad_apartada'   => 'float',
        'cantidad_entregada'  => 'float',
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
