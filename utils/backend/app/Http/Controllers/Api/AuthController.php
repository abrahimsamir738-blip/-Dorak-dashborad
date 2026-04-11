<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Check if doctor exists with this email
            $doctor = Doctor::where('email', $request->email)->first();

            if (!$doctor) {
                return response()->json([
                    'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                    'errors' => ['email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة']]
                ], 401);
            }

            // Verify password
            if (!Hash::check($request->password, $doctor->password)) {
                return response()->json([
                    'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                    'errors' => ['email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة']]
                ], 401);
            }

            // Create token
            $token = $doctor->createToken('auth-token')->plainTextToken;

            return response()->json([
                'doctor' => $doctor->load('clinics'),
                'token' => $token,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'التحقق من البيانات فشل',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء تسجيل الدخول',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('clinics'));
    }
}
