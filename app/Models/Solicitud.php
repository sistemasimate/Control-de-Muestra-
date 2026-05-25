<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Solicitud extends Model
{
    protected $table = 'sic_muestras_solicitudes';

    const UPDATED_AT = 'updated_at';
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'folio', 'cliente_codigo', 'cliente_nombre', 'orden_compra', 'vendedor', 'proyecto',
        'direccion_entrega', 'motivo', 'comentarios', 'autorizador', 'estatus',
        'autorizacion_requerida', 'usuario_solicita', 'fecha_solicitud',
        'subtotal', 'iva', 'total',
    ];

    protected $casts = [
        'fecha_solicitud' => 'datetime',
        'subtotal' => 'float',
        'iva'      => 'float',
        'total'    => 'float',
    ];

    public function lineas(): HasMany
    {
        return $this->hasMany(SolicitudDetalle::class, 'solicitud_id');
    }

    public function autorizaciones(): HasMany
    {
        return $this->hasMany(Autorizacion::class, 'solicitud_id');
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class, 'solicitud_id');
    }

    public function seguimientos(): HasMany
    {
        return $this->hasMany(Seguimiento::class, 'solicitud_id');
    }

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class, 'documento_id')
            ->where('documento_tipo', 'Solicitud');
    }

    public function getRouteKeyName(): string
    {
        return 'folio';
    }

    public static function generarFolio(): string
    {
        $anio = date('Y');
        $last = DB::table('sic_muestras_solicitudes')
            ->where('folio', 'like', "SOL-{$anio}-%")
            ->orderByDesc('id')
            ->value('folio');

        $num = $last ? (int) substr($last, -4) + 1 : 1;
        return sprintf('SOL-%s-%04d', $anio, $num);
    }
}
