<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Adjunto extends Model
{
    protected $table = 'sic_muestras_adjuntos';

    public $timestamps = false;

    protected $fillable = [
        'documento_tipo', 'documento_id',
        'nombre_archivo', 'ruta_archivo', 'tipo_archivo',
        'usuario_subio', 'fecha_subida',
    ];

    protected $casts = ['fecha_subida' => 'datetime'];
}
