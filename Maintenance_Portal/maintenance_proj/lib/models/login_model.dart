/// Login response model — maps to SAP structure Z26_MAINT_PORTAL_902065_SRV / EmployeeSet
class LoginModel {
  final String empId;
  final String? empName;
  final String? password;
  final String? role;
  final String? plant;
  final String? message;
  final String? status;

  LoginModel({
    required this.empId,
    this.empName,
    this.password,
    this.role,
    this.plant,
    this.message,
    this.status,
  });

  factory LoginModel.fromJson(Map<String, dynamic> json) {
    return LoginModel(
      empId: json['EmpId']?.toString() ?? '',
      empName: json['EmpName']?.toString() ?? json['Name']?.toString(),
      password: json['Password']?.toString(),
      role: json['Role']?.toString(),
      plant: json['Plant']?.toString(),
      message: json['Message']?.toString(),
      status: json['Status']?.toString() ?? 'SUCCESS',
    );
  }

  String? get name => empName;

  bool get isSuccess =>
      (status?.toUpperCase() == 'SUCCESS' || status == null) && empId.isNotEmpty;

  Map<String, dynamic> toJson() => {
        'EmpId': empId,
        'EmpName': empName,
        'Password': password,
        'Role': role,
        'Plant': plant,
        'Message': message,
        'Status': status,
      };

  @override
  String toString() => 'LoginModel(empId: $empId, empName: $empName, status: $status)';
}
