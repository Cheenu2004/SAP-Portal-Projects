/// API configuration constants for SAP OData integration
import 'package:flutter/foundation.dart';

class ApiConstants {
  ApiConstants._();

  static const String sapGatewayUrl = 'http://AZKTLDS5CP.kcloud.com:8000';
  static const String localWebProxyUrl = 'http://localhost:8080';
  static const String sapBasicUser = String.fromEnvironment(
    'SAP_BASIC_USER',
    defaultValue: 'K902065',
  );
  static const String sapBasicPassword = String.fromEnvironment(
    'SAP_BASIC_PASSWORD',
    defaultValue: 'Srini@0611',
  );

  /// Web browsers require CORS preflight support for SAP OData POST requests.
  /// The local proxy forwards requests to SAP and adds the CORS response headers.
  static const String _defaultBaseUrl = kIsWeb
      ? localWebProxyUrl
      : sapGatewayUrl;
  static const String baseUrl = String.fromEnvironment(
    'SAP_BASE_URL',
    defaultValue: _defaultBaseUrl,
  );
  static const String odataBasePath = '/sap/opu/odata/sap';
  static const String serviceName = 'Z26_MAINT_PORTAL_902065_SRV';

  static String get serviceUrl => '$baseUrl$odataBasePath/$serviceName';

  static const String loginEntitySet = 'EmployeeSet';
  static const String notificationEntitySet = 'MaintNotificationSet';
  static const String workOrderEntitySet = 'MaintWorkOrderSet';
  static const String notificationHistoryEntitySet = 'MaintNotificationSet';
  static const String workOrderHistoryEntitySet = 'MaintWorkOrderSet';

  static String get loginCollectionPath => '/$loginEntitySet';

  static String get loginUrl => '$serviceUrl$loginCollectionPath';

  static String notificationsUrl(String empId) =>
      '$serviceUrl/$notificationEntitySet?\$filter=EmpId eq \'$empId\'';

  static String workOrdersUrl(String empId) =>
      '$serviceUrl/$workOrderEntitySet?\$filter=EmpId eq \'$empId\'';

  static String notificationHistoryUrl(String empId) =>
      '$serviceUrl/$notificationHistoryEntitySet?\$filter=EmpId eq \'$empId\'';

  static String workOrderHistoryUrl(String empId) =>
      '$serviceUrl/$workOrderHistoryEntitySet?\$filter=EmpId eq \'$empId\'';

  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  static const String odataResultsKey = 'd';
  static const String odataResultsArrayKey = 'results';

  static const int maxRetries = 3;
  static const int retryDelayMs = 1000;

  static bool get hasSapBasicCredentials =>
      sapBasicUser.isNotEmpty || sapBasicPassword.isNotEmpty;
}
