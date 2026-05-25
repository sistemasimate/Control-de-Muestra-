<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE sic_muestras_solicitudes ADD COLUMN autorizador VARCHAR(150) NULL AFTER comentarios');
        DB::statement('ALTER TABLE sic_muestras_entregas ADD COLUMN autorizador VARCHAR(150) NULL AFTER almacenista');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE sic_muestras_solicitudes DROP COLUMN autorizador');
        DB::statement('ALTER TABLE sic_muestras_entregas DROP COLUMN autorizador');
    }
};
