/// Dashboard Screen
/// Main hub displaying KPI cards, quick actions, and navigation tiles
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/widgets/index.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isInitialLoad = true;

  @override
  void initState() {
    super.initState();
    // Fetch all data on dashboard load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAllData();
    });
  }

  /// Load all data from SAP OData
  Future<void> _loadAllData() async {
    final authProvider = context.read<AuthProvider>();
    final empId = authProvider.empId;

    if (empId == null) return;

    // Fetch all data in parallel
    await Future.wait([
      context.read<NotificationsProvider>().fetchNotifications(empId),
      context.read<WorkOrdersProvider>().fetchWorkOrders(empId),
      context.read<NotificationHistoryProvider>().fetchHistory(empId),
      context.read<WorkOrderHistoryProvider>().fetchHistory(empId),
    ]);

    if (mounted) {
      setState(() => _isInitialLoad = false);
    }
  }

  /// Handle logout
  Future<void> _handleLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.rectangle,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.logout_rounded,
                  color: AppColors.error,
                  size: 32,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                AppStrings.logout,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                AppStrings.logoutConfirm,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        side: const BorderSide(color: Color(0xFFD0D5DD)),
                        foregroundColor: AppColors.textPrimary,
                      ),
                      child: const Text(
                        AppStrings.cancel,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.error,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        AppStrings.logout,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (shouldLogout == true && mounted) {
      await context.read<AuthProvider>().logout();
      if (mounted) {
        Navigator.pushReplacementNamed(context, AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: _isInitialLoad
            ? const DashboardShimmer()
            : RefreshIndicator(
                onRefresh: _loadAllData,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ─── Welcome Header ────────────────────────────
                      _buildWelcomeHeader(),
                      const SizedBox(height: 32),

                      const SizedBox(height: 16),
                      // ─── KPI Cards Grid ────────────────────────────
                      _buildKpiGrid(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  /// Welcome header with employee info
  Widget _buildWelcomeHeader() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return Row(
          children: [
            // Avatar
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: const Icon(Icons.person_rounded, color: AppColors.textSecondary),
            ),
            const SizedBox(width: 16),
            // Welcome text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hello, ${auth.empName ?? 'Employee'}',
                    style: const TextStyle(
                      color: AppColors.textOnBackground,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            // Logout / Bell icon
            IconButton(
              icon: const Icon(Icons.logout_rounded, color: AppColors.textOnBackground),
              onPressed: _handleLogout,
            ),
          ],
        );
      },
    );
  }

  /// KPI metrics grid (6 tiles)
  Widget _buildKpiGrid() {
    return Consumer4<
      NotificationsProvider,
      WorkOrdersProvider,
      NotificationHistoryProvider,
      WorkOrderHistoryProvider
    >(
      builder: (context, notifProv, woProv, notifHistProv, woHistProv, _) {
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.15,
          children: [
            // Total Notifications
            DashboardCard(
              title: AppStrings.totalNotifications,
              value: '${notifProv.totalCount}',
              icon: Icons.notifications_active_rounded,
              color: AppColors.primary,
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.notifications),
            ),
            // Total Work Orders
            DashboardCard(
              title: AppStrings.totalWorkOrders,
              value: '${woProv.totalCount}',
              icon: Icons.assignment_rounded,
              color: AppColors.primary,
              onTap: () => Navigator.pushNamed(context, AppRoutes.workOrders),
            ),
            // Open Notifications
            DashboardCard(
              title: AppStrings.openNotifications,
              value: '${notifProv.openCount}',
              icon: Icons.notifications_none_rounded,
              color: AppColors.warning,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.notifications,
                arguments: NotificationListFilter.open,
              ),
            ),
            // Closed Notifications
            DashboardCard(
              title: AppStrings.closedNotifications,
              value: '${notifProv.closedCount}',
              icon: Icons.check_circle_outline_rounded,
              color: AppColors.success,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.notifications,
                arguments: NotificationListFilter.closed,
              ),
            ),
            // Open Work Orders
            DashboardCard(
              title: AppStrings.openWorkOrders,
              value: '${woProv.openCount}',
              icon: Icons.build_circle_outlined,
              color: AppColors.warning,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.workOrders,
                arguments: WorkOrderListFilter.open,
              ),
            ),
            // Closed Work Orders
            DashboardCard(
              title: AppStrings.closedWorkOrders,
              value: '${woHistProv.closedCount}',
              icon: Icons.lock_outline_rounded,
              color: AppColors.success,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.workOrderHistory,
                arguments: WorkOrderHistoryListFilter.closed,
              ),
            ),
          ],
        );
      },
    );
  }
}
