import 'package:maintenance_proj/utils/sap_status_utils.dart';

/// Notification History model — maps to SAP structure Z26_MAINT_PORTAL_902065_SRV / MaintNotificationSet
class NotificationHistoryModel {
  final String? qmnum;
  final String? qmart;
  final String? qmtxt;
  final String? erdat;
  final String? ernam;
  final String? empId;
  final String? plant;
  final String? priority;
  final String? status;
  final String? statusText;

  NotificationHistoryModel({
    this.qmnum,
    this.qmart,
    this.qmtxt,
    this.erdat,
    this.ernam,
    this.empId,
    this.plant,
    this.priority,
    this.status,
    this.statusText,
  });

  factory NotificationHistoryModel.fromJson(Map<String, dynamic> json) {
    return NotificationHistoryModel(
      qmnum: json['Qmnum']?.toString(),
      qmart: json['Qmart']?.toString(),
      qmtxt: json['Qmtxt']?.toString(),
      erdat: json['Erdat']?.toString(),
      ernam: json['Ernam']?.toString(),
      empId: json['EmpId']?.toString(),
      plant: json['Plant']?.toString(),
      priority: json['Priority']?.toString() ?? json['Priok']?.toString(),
      status: json['Status']?.toString(),
      statusText:
          json['StatusText']?.toString() ?? json['StatusTxt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'Qmnum': qmnum,
        'Qmart': qmart,
        'Qmtxt': qmtxt,
        'Erdat': erdat,
        'Ernam': ernam,
        'EmpId': empId,
        'Plant': plant,
        'Priority': priority,
        'Status': status,
        'StatusText': statusText,
      };

  bool get isClosed =>
      SapStatusUtils.isClosedNotification(status, null);

  bool get isProcessed =>
      SapStatusUtils.isCompletedNotificationHistory(status, null);

  String get normalizedPriority {
    final p = priority?.toUpperCase();
    if (p == '1' || p == 'HIGH' || p == 'VERY HIGH') return 'HIGH';
    if (p == '3' || p == 'LOW') return 'LOW';
    return 'MEDIUM';
  }

  @override
  String toString() =>
      'NotificationHistoryModel(qmnum: $qmnum, status: $status)';
}
