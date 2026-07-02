/// App Routes definition and router configuration
import 'package:flutter/material.dart';
import 'package:maintenance_proj/screens/index.dart';
import 'package:maintenance_proj/widgets/index.dart';

class AppRoutes {
  static const String login = '/login';
  static const String forgotPassword = '/forgot-password';
  static const String main = '/main';
  static const String dashboard = '/dashboard';
  static const String notifications = '/notifications';
  static const String notificationDetail = '/notification-detail';
  static const String workOrders = '/work-orders';
  static const String workOrderDetail = '/work-order-detail';
  static const String notificationHistory = '/notification-history';
  static const String notificationHistoryDetail = '/notification-history-detail';
  static const String workOrderHistory = '/work-order-history';
  static const String workOrderHistoryDetail = '/work-order-history-detail';

  /// Get routes map for static routing
  static Map<String, WidgetBuilder> getRoutes() {
    return {
      login: (context) => const LoginScreen(),
      forgotPassword: (context) => const ForgotPasswordScreen(),
      main: (context) => const AuthGuard(child: MainScreen()),
      dashboard: (context) => const AuthGuard(child: DashboardScreen()),
      notifications: (context) => const AuthGuard(child: NotificationsScreen()),
      notificationDetail: (context) => const AuthGuard(child: NotificationDetailScreen()),
      workOrders: (context) => const AuthGuard(child: WorkOrdersScreen()),
      workOrderDetail: (context) => const AuthGuard(child: WorkOrderDetailScreen()),
      notificationHistory: (context) => const AuthGuard(child: NotificationHistoryScreen()),
      notificationHistoryDetail: (context) => const AuthGuard(child: NotificationHistoryDetailScreen()),
      workOrderHistory: (context) => const AuthGuard(child: WorkOrderHistoryScreen()),
      workOrderHistoryDetail: (context) => const AuthGuard(child: WorkOrderHistoryDetailScreen()),
    };
  }
}
