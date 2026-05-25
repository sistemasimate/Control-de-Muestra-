<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Articulo extends Model
{
    protected $table = 'sic_muestras_articulos';

    protected $fillable = [
        'codigo_sic', 'sap_itemcode', 'descripcion', 'proveedor', 'unidad', 'costo_unitario', 'activo',
    ];

    protected $casts = [
        'costo_unitario' => 'float',
        'activo' => 'boolean',
    ];

    public function existencias(): HasMany
    {
        return $this->hasMany(Existencia::class, 'articulo_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'articulo_id');
    }

    public function existenciaEnAlmacen(int $almacenId): ?Existencia
    {
        return $this->existencias()->where('almacen_id', $almacenId)->first();
    }
}
