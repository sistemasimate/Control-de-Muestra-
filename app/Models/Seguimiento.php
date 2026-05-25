<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seguimiento extends Model
{
    protected $table = 'sic_muestras_seguimiento';

    public $timestamps = false;

    protected $fillable = [
        'solicitud_id', 'resultado', 'comentarios', 'usuario', 'fecha_seguimiento',
    ];

    protected $casts = ['fecha_seguimiento' => 'datetime'];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }
}
