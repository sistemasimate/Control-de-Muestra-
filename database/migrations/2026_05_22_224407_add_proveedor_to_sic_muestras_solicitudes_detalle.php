<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sic_muestras_solicitudes_detalle', function (Blueprint $table) {
            $table->string('proveedor', 250)->nullable()->after('descripcion');
        });
    }

    public function down(): void
    {
        Schema::table('sic_muestras_solicitudes_detalle', function (Blueprint $table) {
            $table->dropColumn('proveedor');
        });
    }
};
