<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\AutorizacionController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\SapController;

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');

// Solicitudes
Route::prefix('solicitudes')->name('solicitudes.')->group(function () {
    Route::get('/',  [SolicitudController::class, 'index'])->name('index');
    Route::get('/export', [SolicitudController::class, 'export'])->name('export');
    Route::post('/', [SolicitudController::class, 'store'])->name('store');
    Route::get('/{solicitud}',  [SolicitudController::class, 'show'])->name('show');
    Route::put('/{solicitud}',  [SolicitudController::class, 'update'])->name('update');
    Route::post('/{solicitud}/aprobar',  [SolicitudController::class, 'aprobar'])->name('aprobar');
    Route::post('/{solicitud}/rechazar', [SolicitudController::class, 'rechazar'])->name('rechazar');
    Route::post('/{solicitud}/cancelar', [SolicitudController::class, 'cancelar'])->name('cancelar');
    Route::get('/{solicitud}/entrega/nueva',        [EntregaController::class, 'create'])->name('entrega.create');
    Route::post('/{solicitud}/entrega',             [EntregaController::class, 'store'])->name('entrega.store');
    Route::get('/{solicitud}/entrega/{entregaId}',    [EntregaController::class, 'show'])->name('entrega.show');
    Route::put('/{solicitud}/entrega/{entregaId}',    [EntregaController::class, 'update'])->name('entrega.update');
    Route::post('/{solicitud}/entrega/{entregaId}/cancelar', [EntregaController::class, 'cancelar'])->name('entrega.cancelar');
});

// Autorizaciones
Route::prefix('autorizaciones')->name('autorizaciones.')->group(function () {
    Route::get('/', [AutorizacionController::class, 'index'])->name('index');
});

// SAP B1 Service Layer (solo lectura)
Route::prefix('api/sap')->name('sap.')->group(function () {
    Route::get('/clientes',  [SapController::class, 'clientes'])->name('clientes');
    Route::get('/articulos', [SapController::class, 'articulos'])->name('articulos');
});
