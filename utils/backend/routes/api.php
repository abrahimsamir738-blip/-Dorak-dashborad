<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ScheduleController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Doctor routes
    Route::get('/doctor', [DoctorController::class, 'index']);
    Route::put('/doctor', [DoctorController::class, 'update']);
    
    // Clinic routes
    Route::get('/clinics', [ClinicController::class, 'index']);
    Route::post('/clinics', [ClinicController::class, 'store']);
    Route::put('/clinics/{id}', [ClinicController::class, 'update']);
    Route::delete('/clinics/{id}', [ClinicController::class, 'destroy']);
    
    // Order routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
    
    // Schedule routes
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::put('/schedules/{id}', [ScheduleController::class, 'update']);
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);
});
