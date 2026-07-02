import 'package:flutter_test/flutter_test.dart';
import 'package:maintenance_proj/constants/api_constants.dart';
import 'package:maintenance_proj/models/login_model.dart';
import 'package:maintenance_proj/models/notification_model.dart';
import 'package:maintenance_proj/models/work_order_history_model.dart';

void main() {
  test('NotificationModel detects CLOSED status from ABAP ZNotif_110Set', () {
    final closed = NotificationModel.fromJson({
      'EmpId': '30001003',
      'Qmnum': '10000040',
      'Status': 'CLOSED',
      'StatusText': 'Work Order Created',
    });
    final open = NotificationModel.fromJson({
      'EmpId': '30001003',
      'Qmnum': '10000041',
      'Status': 'OPEN',
      'StatusText': 'Notification Open',
    });

    expect(closed.isClosed, isTrue);
    expect(closed.isOpen, isFalse);
    expect(open.isOpen, isTrue);
    expect(open.isClosed, isFalse);
  });

  test('WorkOrderHistoryModel maps ZMaintWOHist_110Set I0045 status', () {
    final wo = WorkOrderHistoryModel.fromJson({
      'Aufnr': '4000005',
      'EmpId': '30001003',
      'Status': 'I0045',
      'StatusText': 'Technically Completed',
    });

    expect(wo.isTechnicallyCompleted, isTrue);
    expect(wo.isClosed, isFalse);
  });

  test('Login endpoint uses EmployeeSet collection path', () {
    expect(ApiConstants.loginCollectionPath, '/EmployeeSet');
    expect(
      ApiConstants.loginUrl,
      '${ApiConstants.serviceUrl}/EmployeeSet',
    );
    expect(ApiConstants.sapGatewayUrl, 'http://AZKTLDS5CP.kcloud.com:8000');
    expect(ApiConstants.localWebProxyUrl, 'http://localhost:8080');
    expect(ApiConstants.hasSapBasicCredentials, isTrue);
  });

  test('LoginModel parses SAP OData login response', () {
    final model = LoginModel.fromJson({
      'EmpId': 'EMP001',
      'EmpName': 'SRINIDHI',
      'Password': '1234',
      'Role': 'ADMIN',
    });

    expect(model.empId, 'EMP001');
    expect(model.name, 'SRINIDHI');
    expect(model.password, '1234');
    expect(model.role, 'ADMIN');
    expect(model.isSuccess, isTrue);
  });
}
