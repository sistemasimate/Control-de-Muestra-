<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Entrega extends Model
{
    protected $table = 'sic_muestras_entregas';

    protected $fillable = [
        'folio', 'solicitud_id', 'estatus', 'autorizador',
        'fecha_entrega', 'comentarios', 'subtotal', 'iva', 'total',
        'destinatario', 'direccion_envio', 'ciudad', 'estado', 'cp',
        'telefono', 'forma_envio', 'paqueteria', 'numero_guia',
    ];

    protected $casts = [
        'fecha_entrega' => 'datetime',
        'subtotal' => 'decimal:6',
        'iva'      => 'decimal:6',
        'total'    => 'decimal:6',
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    public function lineas(): HasMany
    {
        return $this->hasMany(EntregaDetalle::class, 'entrega_id');
    }

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class, 'documento_id')
            ->where('documento_tipo', 'Entrega');
    }

    public static function generarFolio(Solicitud $solicitud): string
    {
        $base  = 'ENT-' . substr($solicitud->folio, 4);
        $count = static::where('solicitud_id', $solicitud->id)->count();
        return $base . '-' . ($count + 1);
    }
}
