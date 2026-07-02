import 'package:maintenance_proj/utils/sap_status_utils.dart';

/// Work Order model — maps to SAP structure Z26_MAINT_PORTAL_902065_SRV / MaintWorkOrderSet
class WorkOrderModel {
  final String? aufnr;
  final String? erdat;
  final String? ernam;
  final String? ktext;
  final String? empId;
  final String? auart;
  final String? plant;
  final String? gltrp;
  final String? equnr;
  final String? tplnr;
  final String? qmnum;
  final String? priority;
  final String? status;
  final String? statusText;

  WorkOrderModel({
    this.aufnr,
    this.erdat,
    this.ernam,
    this.ktext,
    this.empId,
    this.auart,
    this.plant,
    this.gltrp,
    this.equnr,
    this.tplnr,
    this.qmnum,
    this.priority,
    this.status,
    this.statusText,
  });

  factory WorkOrderModel.fromJson(Map<String, dynamic> json) {
    return WorkOrderModel(
      aufnr: json['Aufnr']?.toString(),
      erdat: json['Erdat']?.toString(),
      ernam: json['Ernam']?.toString(),
      ktext: json['Ktext']?.toString(),
      empId: json['EmpId']?.toString(),
      auart: json['Auart']?.toString(),
      plant: json['Plant']?.toString(),
      gltrp: json['Gltrp']?.toString(),
      equnr: json['Equnr']?.toString(),
      tplnr: json['Tplnr']?.toString(),
      qmnum: json['Qmnum']?.toString(),
      priority: json['Priority']?.toString() ?? json['Priok']?.toString(),
      status: json['Status']?.toString(),
      statusText:
          json['StatusText']?.toString() ?? json['StatusTxt']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'Aufnr': aufnr,
        'Erdat': erdat,
        'Ernam': ernam,
        'Ktext': ktext,
        'EmpId': empId,
        'Auart': auart,
        'Plant': plant,
        'Gltrp': gltrp,
        'Equnr': equnr,
        'Tplnr': tplnr,
        'Qmnum': qmnum,
        'Priority': priority,
        'Status': status,
        'StatusText': statusText,
      };

  bool get isOpen => SapStatusUtils.isOpenWorkOrder(status, null);

  bool get isTechnicallyCompleted =>
      SapStatusUtils.isTechnicallyCompleted(status, null);

  bool get isClosed => SapStatusUtils.isClosedWorkOrder(status, null);

  String get normalizedPriority {
    final p = priority?.toUpperCase();
    if (p == '1' || p == 'HIGH' || p == 'VERY HIGH') return 'HIGH';
    if (p == '3' || p == 'LOW') return 'LOW';
    return 'MEDIUM';
  }

  @override
  String toString() =>
      'WorkOrderModel(aufnr: $aufnr, status: $status)';
}
