/// Session manager using SharedPreferences
/// Handles employee session persistence for login state
import 'package:shared_preferences/shared_preferences.dart';

class SessionManager {
  SessionManager._(); // Prevent instantiation

  static String? _empId;
  static String? _empName;
  static String? _plant;
  static bool _isLoggedIn = false;

  /// Save login session
  static Future<void> saveSession({
    required String empId,
    String? empName,
    String? plant,
  }) async {
    _empId = empId;
    _isLoggedIn = true;
    if (empName != null) _empName = empName;
    if (plant != null) _plant = plant;
  }

  /// Get stored Employee ID
  static Future<String?> getEmployeeId() async {
    return _empId;
  }

  /// Get stored Employee Name
  static Future<String?> getEmployeeName() async {
    return _empName;
  }

  /// Get stored Plant
  static Future<String?> getPlant() async {
    return _plant;
  }

  /// Check if user is logged in
  static Future<bool> isLoggedIn() async {
    return _isLoggedIn;
  }

  /// Clear session (logout)
  static Future<void> clearSession() async {
    _empId = null;
    _empName = null;
    _plant = null;
    _isLoggedIn = false;
  }
}
