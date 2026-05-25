<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Autorizacion extends Model
{
    protected $table = 'sic_muestras_autorizaciones';

    public $timestamps = false;

    protected $fillable = [
        'solicitud_id', 'usuario_autoriza', 'nivel_autorizacion',
        'estatus', 'comentarios', 'fecha_autorizacion',
    ];

    protected $casts = ['fecha_autorizacion' => 'datetime'];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }
}
