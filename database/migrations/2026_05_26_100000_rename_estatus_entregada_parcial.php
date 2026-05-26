<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ampliar el ENUM para incluir los nuevos valores antes de actualizar los registros
        Schema::table('sic_muestras_solicitudes', function (Blueprint $table) {
            $table->enum('estatus', [
                'Pendiente', 'Aprobada', 'Parcial', 'Rechazada',
                'Entregada', 'Cancelada', 'Devuelta', 'Cerrada',
                'Entrega completa', 'Entrega parcial',
            ])->default('Pendiente')->change();
        });

        DB::table('sic_muestras_solicitudes')
            ->where('estatus', 'Entregada')
            ->update(['estatus' => 'Entrega completa']);

        DB::table('sic_muestras_solicitudes')
            ->where('estatus', 'Parcial')
            ->update(['estatus' => 'Entrega parcial']);

        // Dejar el ENUM solo con los valores vigentes
        Schema::table('sic_muestras_solicitudes', function (Blueprint $table) {
            $table->enum('estatus', [
                'Pendiente', 'Aprobada', 'Rechazada',
                'Entrega completa', 'Entrega parcial',
                'Cancelada', 'Devuelta', 'Cerrada',
            ])->default('Pendiente')->change();
        });
    }

    public function down(): void
    {
        Schema::table('sic_muestras_solicitudes', function (Blueprint $table) {
            $table->enum('estatus', [
                'Pendiente', 'Aprobada', 'Parcial', 'Rechazada',
                'Entregada', 'Cancelada', 'Devuelta', 'Cerrada',
                'Entrega completa', 'Entrega parcial',
            ])->default('Pendiente')->change();
        });

        DB::table('sic_muestras_solicitudes')
            ->where('estatus', 'Entrega completa')
            ->update(['estatus' => 'Entregada']);

        DB::table('sic_muestras_solicitudes')
            ->where('estatus', 'Entrega parcial')
            ->update(['estatus' => 'Parcial']);

        Schema::table('sic_muestras_solicitudes', function (Blueprint $table) {
            $table->enum('estatus', [
                'Pendiente', 'Aprobada', 'Parcial', 'Rechazada',
                'Entregada', 'Cancelada', 'Devuelta', 'Cerrada',
            ])->default('Pendiente')->change();
        });
    }
};
