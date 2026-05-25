<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE sic_muestras_solicitudes MODIFY COLUMN estatus ENUM('Pendiente','Aprobada','Rechazada','Entregada','Cancelada','Devuelta','Cerrada','Parcial') DEFAULT 'Pendiente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE sic_muestras_solicitudes MODIFY COLUMN estatus ENUM('Pendiente','Aprobada','Rechazada','Entregada','Cancelada','Devuelta','Cerrada') DEFAULT 'Pendiente'");
    }
};
