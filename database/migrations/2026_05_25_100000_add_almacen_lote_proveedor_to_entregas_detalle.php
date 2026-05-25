<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sic_muestras_entregas_detalle', function (Blueprint $table) {
            $table->string('almacen_codigo', 50)->nullable()->after('almacen_id');
            $table->string('lote', 100)->nullable()->after('almacen_codigo');
            $table->string('proveedor', 200)->nullable()->after('lote');
        });
    }

    public function down(): void
    {
        Schema::table('sic_muestras_entregas_detalle', function (Blueprint $table) {
            $table->dropColumn(['almacen_codigo', 'lote', 'proveedor']);
        });
    }
};
