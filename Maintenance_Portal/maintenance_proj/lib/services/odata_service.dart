/// OData API Service
/// Handles all HTTP communication with SAP OData backend
/// Implements retry mechanism, error handling, and response parsing

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:maintenance_proj/constants/api_constants.dart';
import 'package:maintenance_proj/models/index.dart';

class ODataService {
  late final Dio _dio;

  ODataService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.serviceUrl,
        connectTimeout: Duration(milliseconds: ApiConstants.connectTimeout),
        receiveTimeout: Duration(milliseconds: ApiConstants.receiveTimeout),
        sendTimeout: Duration(milliseconds: ApiConstants.sendTimeout),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        responseType: ResponseType.plain,
      ),
    );

    _applyConfiguredSapBasicAuth();

    // Add interceptor for logging and error handling
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add format=json query parameter for SAP OData
          if (options.extra['skipFormatJson'] != true) {
            options.queryParameters['\$format'] = 'json';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          // Log error details for debugging
          // ignore: avoid_print
          print('OData API Error: ${error.message}');
          // ignore: avoid_print
          print('URL: ${error.requestOptions.uri}');
          handler.next(error);
        },
      ),
    );
  }

  /// Set Basic Auth credentials for SAP authentication
  void setCredentials(String username, String password) {
    final credentials = base64Encode(utf8.encode('$username:$password'));
    _dio.options.headers['Authorization'] = 'Basic $credentials';
  }

  void _applyConfiguredSapBasicAuth() {
    if (ApiConstants.hasSapBasicCredentials) {
      setCredentials(ApiConstants.sapBasicUser, ApiConstants.sapBasicPassword);
    }
  }

  /// Clear authentication credentials
  void clearCredentials() {
    _dio.options.headers.remove('Authorization');
  }

  // ─── Login ────────────────────────────────────────────────────────

  /// Authenticate user against SAP OData login entity set
  Future<LoginModel> login(String empId, String password) async {
    try {
      _applyConfiguredSapBasicAuth();

      final response = await _retryRequest(
        () => _dio.post(
          ApiConstants.loginCollectionPath,
          data: {
            'EmpId': empId.trim(),
            'Password': password,
          },
          options: Options(
            responseType: ResponseType.plain,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            extra: {'skipFormatJson': true},
          ),
        ),
      );

      final data = _parseODataResponse(response.data);
      if (data.isNotEmpty) {
        final loginResult = LoginModel.fromJson(data.first);
        if (!loginResult.isSuccess) {
          throw Exception('Invalid password/user id');
        }
        return loginResult;
      }

      throw Exception('Invalid password/user id');
    } on DioException catch (e) {
      if (e.response?.statusCode == 400 ||
          e.response?.statusCode == 401 ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.response?.statusCode == 500) {
        throw Exception('Invalid password/user id');
      }
      _logDioException(e);
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Invalid password/user id');
    }
  }

  // ─── Forgot Password ──────────────────────────────────────────────

  /// Reset password via SAP OData
  Future<bool> forgotPassword(String empId, String newPassword, String confirmPassword) async {
    try {
      _applyConfiguredSapBasicAuth();

      final response = await _retryRequest(
        () => _dio.post(
          ApiConstants.loginCollectionPath,
          data: {
            'EmpId': empId.trim(),
            'Action': 'FORGOT',
            'NewPassword': newPassword,
            'ConfirmPassword': confirmPassword,
          },
          options: Options(
            responseType: ResponseType.plain,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            extra: {'skipFormatJson': true},
          ),
        ),
      );

      final data = _parseODataResponse(response.data);
      if (data.isNotEmpty) {
        final loginResult = LoginModel.fromJson(data.first);
        if (loginResult.role?.toUpperCase() == 'PASSWORD UPDATED' ||
            loginResult.message?.toUpperCase() == 'PASSWORD UPDATED' ||
            loginResult.status?.toUpperCase() == 'PASSWORD UPDATED') {
          return true;
        }
        if (!loginResult.isSuccess) {
          throw Exception(
            loginResult.message ?? 'Failed to update password.',
          );
        }
        return true;
      }
      return false;
    } on DioException catch (e) {
      _logDioException(e);
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Forgot password failed: ${e.toString()}');
    }
  }

  // ─── Notifications ────────────────────────────────────────────────

  /// Fetch active notifications for an employee
  Future<List<NotificationModel>> fetchNotifications(String empId) async {
    try {
      final response = await _retryRequest(
        () => _dio.get('/${ApiConstants.notificationEntitySet}'),
      );

      final data = _parseODataResponse(response.data);
      return data.map((json) => NotificationModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Failed to fetch notifications: ${e.toString()}');
    }
  }

  // ─── Work Orders ──────────────────────────────────────────────────

  /// Fetch active work orders for an employee
  Future<List<WorkOrderModel>> fetchWorkOrders(String empId) async {
    try {
      final response = await _retryRequest(
        () => _dio.get('/${ApiConstants.workOrderEntitySet}'),
      );

      final data = _parseODataResponse(response.data);
      return data.map((json) => WorkOrderModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Failed to fetch work orders: ${e.toString()}');
    }
  }

  // ─── Notification History ─────────────────────────────────────────

  /// Fetch notification history for an employee
  Future<List<NotificationHistoryModel>> fetchNotificationHistory(
    String empId,
  ) async {
    try {
      final response = await _retryRequest(
        () => _dio.get('/${ApiConstants.notificationHistoryEntitySet}'),
      );

      final data = _parseODataResponse(response.data);
      return data
          .map((json) => NotificationHistoryModel.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Failed to fetch notification history: ${e.toString()}');
    }
  }

  // ─── Work Order History ───────────────────────────────────────────

  /// Fetch work order history for an employee
  Future<List<WorkOrderHistoryModel>> fetchWorkOrderHistory(
    String empId,
  ) async {
    try {
      final response = await _retryRequest(
        () => _dio.get('/${ApiConstants.workOrderHistoryEntitySet}'),
      );

      final data = _parseODataResponse(response.data);
      return data.map((json) => WorkOrderHistoryModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    } catch (e) {
      throw Exception('Failed to fetch work order history: ${e.toString()}');
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  /// Parse SAP OData JSON response format
  /// OData responses are wrapped in: { "d": { "results": [...] } }
  /// or for single entities: { "d": { ... } }
  List<Map<String, dynamic>> _parseODataResponse(dynamic responseData) {
    if (responseData == null) return [];

    Map<String, dynamic> data;

    // Handle string response
    if (responseData is String) {
      if (responseData.trimLeft().startsWith('<')) {
        return _parseAtomXmlEntities(responseData);
      }
      data = json.decode(responseData) as Map<String, dynamic>;
    } else if (responseData is Map<String, dynamic>) {
      data = responseData;
    } else {
      return [];
    }

    // Navigate OData response structure: d -> results
    final dWrapper = data[ApiConstants.odataResultsKey];
    if (dWrapper == null) return [];

    if (dWrapper is Map<String, dynamic>) {
      final results = dWrapper[ApiConstants.odataResultsArrayKey];
      if (results is List) {
        return results.cast<Map<String, dynamic>>();
      }
      // Single entity response
      return [dWrapper];
    }

    return [];
  }

  List<Map<String, dynamic>> _parseAtomXmlEntities(String xml) {
    final entries = RegExp(
      '<(?:[A-Za-z_][\\w.-]*:)?entry(?:\\s[^>]*)?>(.*?)</(?:[A-Za-z_][\\w.-]*:)?entry>',
      dotAll: true,
    ).allMatches(xml).map((match) => match.group(1) ?? '').toList();

    if (entries.isEmpty) {
      final entity = _parseAtomXmlProperties(xml);
      return entity == null ? [] : [entity];
    }

    return entries
        .map(_parseAtomXmlProperties)
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  Map<String, dynamic>? _parseAtomXmlProperties(String xml) {
    final fields = <String, dynamic>{};
    const names = [
      'EmpId',
      'Password',
      'Name',
      'EmpName',
      'Plant',
      'Role',
      'Message',
      'Qmnum',
      'Qmtxt',
      'Priority',
      'Priok',
      'Erdat',
      'Ernam',
      'Qmart',
      'Aufnr',
      'Auart',
      'Gltrp',
      'Equnr',
      'Tplnr',
      'Ktext',
      'StatusText',
      'StatusTxt',
      'Status',
    ];

    for (final name in names) {
      final value = _readXmlElement(xml, name);
      if (value != null) {
        fields[name] = value;
      }
    }
    return fields.isEmpty ? null : fields;
  }

  String? _readXmlElement(String xml, String localName) {
    final escapedName = RegExp.escape(localName);
    final match = RegExp(
      '<(?:[A-Za-z_][\\w.-]*:)?$escapedName(?:\\s[^>]*)?>(.*?)</(?:[A-Za-z_][\\w.-]*:)?$escapedName>',
      dotAll: true,
    ).firstMatch(xml);
    if (match == null) return null;
    return _decodeXmlText(match.group(1) ?? '');
  }

  String _decodeXmlText(String value) {
    return value
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&apos;', "'")
        .replaceAll('&amp;', '&');
  }

  /// Retry mechanism with exponential backoff
  Future<Response> _retryRequest(
    Future<Response> Function() request, {
    int maxRetries = ApiConstants.maxRetries,
  }) async {
    int attempt = 0;
    while (true) {
      try {
        attempt++;
        return await request();
      } on DioException catch (e) {
        // Don't retry auth errors or client errors
        if (e.response?.statusCode != null &&
            e.response!.statusCode! >= 400 &&
            e.response!.statusCode! < 500) {
          rethrow;
        }

        if (attempt >= maxRetries) rethrow;

        // Exponential backoff
        final delay = ApiConstants.retryDelayMs * attempt;
        await Future.delayed(Duration(milliseconds: delay));
      }
    }
  }

  /// Extract user-friendly error message from DioException
  String _getErrorMessage(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please check your network and try again.';
      case DioExceptionType.connectionError:
        if (kIsWeb) {
          if (ApiConstants.baseUrl == ApiConstants.localWebProxyUrl) {
            return 'Browser could not reach the local SAP proxy. Start it with npm run sap-proxy, then try signing in again.';
          }
          return 'Browser could not reach SAP Gateway. Verify CORS is enabled for ${ApiConstants.baseUrl}, the app is not served from HTTPS while SAP uses HTTP, and the SAP host is reachable from this machine/VPN.';
        }
        return 'Unable to connect to SAP Gateway at ${ApiConstants.baseUrl}. Please check VPN/DNS/network connectivity.';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 0;
        if (statusCode == 401) {
          return 'Authentication failed. Please login again.';
        } else if (statusCode == 403) {
          return 'Access denied. You do not have permission.';
        } else if (statusCode == 404) {
          return 'Resource not found. Please contact your administrator.';
        } else if (statusCode >= 500) {
          return 'Server error. Please try again later.';
        }
        return 'Request failed with status: $statusCode';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  void _logDioException(DioException e) {
    // ignore: avoid_print
    print('OData request failed');
    // ignore: avoid_print
    print('Method: ${e.requestOptions.method}');
    // ignore: avoid_print
    print('URL: ${e.requestOptions.uri}');
    // ignore: avoid_print
    print('Type: ${e.type}');
    // ignore: avoid_print
    print('Status: ${e.response?.statusCode ?? 'no HTTP response'}');
    // ignore: avoid_print
    print('Cause: ${e.error ?? e.message}');
  }
}
