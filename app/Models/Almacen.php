<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Almacen extends Model
{
    protected $table = 'sic_muestras_almacenes';

    protected $fillable = ['codigo', 'nombre', 'ubicacion', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public function existencias(): HasMany
    {
        return $this->hasMany(Existencia::class, 'almacen_id');
    }
}
