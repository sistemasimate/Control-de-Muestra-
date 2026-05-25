<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sic_muestras_entregas', function (Blueprint $table) {
            $table->dropColumn('almacenista');
        });
    }

    public function down(): void
    {
        Schema::table('sic_muestras_entregas', function (Blueprint $table) {
            $table->string('almacenista', 150)->nullable();
        });
    }
};
