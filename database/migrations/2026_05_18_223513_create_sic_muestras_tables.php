<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_articulos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo_sic VARCHAR(50) NOT NULL UNIQUE,
            sap_itemcode VARCHAR(50) NULL,
            descripcion VARCHAR(250) NOT NULL,
            unidad VARCHAR(50) NOT NULL,
            costo_unitario DECIMAL(18,6) DEFAULT 0,
            activo TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_almacenes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(50) NOT NULL UNIQUE,
            nombre VARCHAR(150) NOT NULL,
            ubicacion VARCHAR(250) NULL,
            activo TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_existencias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            articulo_id INT NOT NULL,
            almacen_id INT NOT NULL,
            cantidad_disponible DECIMAL(18,6) DEFAULT 0,
            cantidad_apartada DECIMAL(18,6) DEFAULT 0,
            cantidad_entregada DECIMAL(18,6) DEFAULT 0,
            updated_at DATETIME NULL,
            UNIQUE KEY uk_articulo_almacen (articulo_id, almacen_id),
            CONSTRAINT fk_exist_articulo FOREIGN KEY (articulo_id) REFERENCES sic_muestras_articulos(id),
            CONSTRAINT fk_exist_almacen  FOREIGN KEY (almacen_id)  REFERENCES sic_muestras_almacenes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_solicitudes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folio VARCHAR(50) NOT NULL UNIQUE,
            cliente_codigo VARCHAR(50) NULL,
            cliente_nombre VARCHAR(250) NOT NULL,
            vendedor VARCHAR(150) NULL,
            proyecto VARCHAR(250) NULL,
            direccion_entrega VARCHAR(500) NULL,
            motivo VARCHAR(500) NULL,
            comentarios TEXT NULL,
            estatus ENUM('Pendiente','Aprobada','Rechazada','Entregada','Cancelada','Devuelta','Cerrada') DEFAULT 'Pendiente',
            autorizacion_requerida VARCHAR(100) NULL,
            usuario_solicita VARCHAR(100) NOT NULL,
            fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
            subtotal DECIMAL(18,6) DEFAULT 0,
            iva DECIMAL(18,6) DEFAULT 0,
            total DECIMAL(18,6) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_solicitudes_detalle (
            id INT AUTO_INCREMENT PRIMARY KEY,
            solicitud_id INT NOT NULL,
            articulo_id INT NOT NULL,
            almacen_id INT NOT NULL,
            cantidad DECIMAL(18,6) NOT NULL,
            unidad VARCHAR(50) NOT NULL,
            costo_unitario DECIMAL(18,6) DEFAULT 0,
            impuesto VARCHAR(50) NULL,
            total_linea DECIMAL(18,6) DEFAULT 0,
            sap_itemcode VARCHAR(50) NULL,
            CONSTRAINT fk_sol_det_solicitud FOREIGN KEY (solicitud_id) REFERENCES sic_muestras_solicitudes(id),
            CONSTRAINT fk_sol_det_articulo  FOREIGN KEY (articulo_id)  REFERENCES sic_muestras_articulos(id),
            CONSTRAINT fk_sol_det_almacen   FOREIGN KEY (almacen_id)   REFERENCES sic_muestras_almacenes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_autorizaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            solicitud_id INT NOT NULL,
            usuario_autoriza VARCHAR(100) NOT NULL,
            nivel_autorizacion VARCHAR(100) NULL,
            estatus ENUM('Aprobada','Rechazada') NOT NULL,
            comentarios TEXT NULL,
            fecha_autorizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_aut_solicitud FOREIGN KEY (solicitud_id) REFERENCES sic_muestras_solicitudes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_entregas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folio VARCHAR(50) NOT NULL UNIQUE,
            solicitud_id INT NOT NULL,
            estatus ENUM('Por entregar','Entregada','Cancelada') DEFAULT 'Por entregar',
            almacenista VARCHAR(150) NULL,
            fecha_entrega DATETIME NULL,
            comentarios TEXT NULL,
            subtotal DECIMAL(18,6) DEFAULT 0,
            iva DECIMAL(18,6) DEFAULT 0,
            total DECIMAL(18,6) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            CONSTRAINT fk_ent_solicitud FOREIGN KEY (solicitud_id) REFERENCES sic_muestras_solicitudes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_entregas_detalle (
            id INT AUTO_INCREMENT PRIMARY KEY,
            entrega_id INT NOT NULL,
            solicitud_detalle_id INT NOT NULL,
            articulo_id INT NOT NULL,
            almacen_id INT NOT NULL,
            cantidad_solicitada DECIMAL(18,6) NOT NULL,
            cantidad_entregada DECIMAL(18,6) NOT NULL,
            unidad VARCHAR(50) NOT NULL,
            costo_unitario DECIMAL(18,6) DEFAULT 0,
            total_linea DECIMAL(18,6) DEFAULT 0,
            CONSTRAINT fk_ent_det_entrega  FOREIGN KEY (entrega_id)          REFERENCES sic_muestras_entregas(id),
            CONSTRAINT fk_ent_det_sol_det  FOREIGN KEY (solicitud_detalle_id) REFERENCES sic_muestras_solicitudes_detalle(id),
            CONSTRAINT fk_ent_det_articulo FOREIGN KEY (articulo_id)          REFERENCES sic_muestras_articulos(id),
            CONSTRAINT fk_ent_det_almacen  FOREIGN KEY (almacen_id)           REFERENCES sic_muestras_almacenes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_movimientos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            articulo_id INT NOT NULL,
            almacen_id INT NOT NULL,
            tipo_movimiento ENUM('Entrada','Salida','Apartado','Cancelacion','Devolucion','Ajuste') NOT NULL,
            documento_tipo VARCHAR(50) NULL,
            documento_folio VARCHAR(50) NULL,
            cantidad DECIMAL(18,6) NOT NULL,
            costo_unitario DECIMAL(18,6) DEFAULT 0,
            costo_total DECIMAL(18,6) DEFAULT 0,
            usuario VARCHAR(100) NOT NULL,
            comentarios TEXT NULL,
            fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_mov_articulo FOREIGN KEY (articulo_id) REFERENCES sic_muestras_articulos(id),
            CONSTRAINT fk_mov_almacen  FOREIGN KEY (almacen_id)  REFERENCES sic_muestras_almacenes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_adjuntos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            documento_tipo ENUM('Solicitud','Entrega','Devolucion') NOT NULL,
            documento_id INT NOT NULL,
            nombre_archivo VARCHAR(250) NOT NULL,
            ruta_archivo VARCHAR(500) NOT NULL,
            tipo_archivo VARCHAR(100) NULL,
            usuario_subio VARCHAR(100) NOT NULL,
            fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");

        DB::unprepared("
        CREATE TABLE IF NOT EXISTS sic_muestras_seguimiento (
            id INT AUTO_INCREMENT PRIMARY KEY,
            solicitud_id INT NOT NULL,
            resultado ENUM('En proceso','Exitosa','No aprobada','Convertida en venta','Sin seguimiento') DEFAULT 'En proceso',
            comentarios TEXT NULL,
            usuario VARCHAR(100) NOT NULL,
            fecha_seguimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_seg_solicitud FOREIGN KEY (solicitud_id) REFERENCES sic_muestras_solicitudes(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        ");
    }

    public function down(): void
    {
        $tables = [
            'sic_muestras_seguimiento',
            'sic_muestras_adjuntos',
            'sic_muestras_movimientos',
            'sic_muestras_entregas_detalle',
            'sic_muestras_entregas',
            'sic_muestras_autorizaciones',
            'sic_muestras_solicitudes_detalle',
            'sic_muestras_solicitudes',
            'sic_muestras_existencias',
            'sic_muestras_almacenes',
            'sic_muestras_articulos',
        ];
        foreach ($tables as $t) {
            DB::statement("DROP TABLE IF EXISTS {$t}");
        }
    }
};
