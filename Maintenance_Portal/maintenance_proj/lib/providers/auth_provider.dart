/// Authentication Provider
/// Manages login state, credentials, and session persistence
import 'package:flutter/material.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/services/odata_service.dart';
import 'package:maintenance_proj/utils/session_manager.dart';

class AuthProvider extends ChangeNotifier {
  final ODataService _odataService;

  // ─── State ────────────────────────────────────────────────────────
  bool _isLoading = false;
  bool _isLoggedIn = false;
  String? _empId;
  String? _empName;
  String? _plant;
  String? _errorMessage;
  LoginModel? _loginData;

  // ─── Getters ──────────────────────────────────────────────────────
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get empId => _empId;
  String? get empName => _empName;
  String? get plant => _plant;
  String? get errorMessage => _errorMessage;
  LoginModel? get loginData => _loginData;

  AuthProvider({required ODataService odataService})
    : _odataService = odataService;

  /// Initialize auth state from stored session
  Future<void> initializeAuth() async {
    final isLoggedIn = await SessionManager.isLoggedIn();
    if (isLoggedIn) {
      _empId = await SessionManager.getEmployeeId();
      _empName = await SessionManager.getEmployeeName();
      _plant = await SessionManager.getPlant();
      _isLoggedIn = true;
      notifyListeners();
    }
  }

  /// Login with Employee ID and Password
  Future<bool> login(String empId, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Authenticate via SAP OData
      final loginResult = await _odataService.login(empId, password);

      _loginData = loginResult;
      _empId = empId;
      _empName = loginResult.empName?.trim();
      _plant = null; // New backend doesn't return plant in login
      _isLoggedIn = true;

      await SessionManager.saveSession(
        empId: empId,
        empName: loginResult.empName?.trim(),
        plant: null,
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Forgot Password
  Future<bool> forgotPassword(String empId, String newPassword, String confirmPassword) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _odataService.forgotPassword(empId, newPassword, confirmPassword);
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Logout and clear session
  Future<void> logout() async {
    _odataService.clearCredentials();
    await SessionManager.clearSession();

    _isLoggedIn = false;
    _empId = null;
    _empName = null;
    _plant = null;
    _loginData = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
