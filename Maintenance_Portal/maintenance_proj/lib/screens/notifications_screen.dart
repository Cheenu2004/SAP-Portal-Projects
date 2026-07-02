/// Notifications Screen
/// Displays active notifications with search, pull-to-refresh, and detail navigation
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  NotificationListFilter get _filter {
    final args = ModalRoute.of(context)?.settings.arguments;
    return args is NotificationListFilter ? args : NotificationListFilter.all;
  }

  String get _title {
    switch (_filter) {
      case NotificationListFilter.open:
        return AppStrings.openNotifications;
      case NotificationListFilter.closed:
        return AppStrings.closedNotifications;
      case NotificationListFilter.all:
        return AppStrings.notifications;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final empId = context.read<AuthProvider>().empId;
    if (empId != null) {
      await context.read<NotificationsProvider>().fetchNotifications(empId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: CustomAppBar(
        title: _title,
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, prov, _) {
              final notifications = prov.notificationsFor(_filter);
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${notifications.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          SearchBarWidget(
            hintText: 'Search notifications...',
            onChanged: (query) {
              context.read<NotificationsProvider>().search(query);
            },
            onClear: () {
              context.read<NotificationsProvider>().clearSearch();
            },
          ),

          // Notification List
          Expanded(
            child: Consumer<NotificationsProvider>(
              builder: (context, provider, _) {
                // Loading state
                if (provider.isLoading) {
                  return const LoadingShimmer();
                }

                // Error state
                if (provider.errorMessage != null) {
                  return EmptyStateWidget(
                    title: AppStrings.error,
                    subtitle: provider.errorMessage,
                    icon: Icons.error_outline_rounded,
                    onRetry: _loadData,
                  );
                }

                // Empty state
                final notifications = provider.notificationsFor(_filter);

                if (notifications.isEmpty) {
                  return EmptyStateWidget(
                    title: AppStrings.noData,
                    subtitle: AppStrings.noDataSubtitle,
                    icon: Icons.notifications_off_rounded,
                    onRetry: _loadData,
                  );
                }

                // Data list
                return RefreshIndicator(
                  onRefresh: _loadData,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return _NotificationCard(notification: notification);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Individual notification card widget
class _NotificationCard extends StatelessWidget {
  final NotificationModel notification;

  const _NotificationCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            AppRoutes.notificationDetail,
            arguments: notification.qmnum,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Notification Number + Priority
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '#${notification.qmnum ?? 'N/A'}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  PriorityBadge(priority: notification.priority),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                notification.qmtxt ?? 'No description',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),

              // Bottom Row: Status + Type + Date
              Row(
                children: [
                  StatusBadge(
                    status: notification.status,
                    statusText: notification.statusText,
                  ),
                  const SizedBox(width: 8),
                  if (notification.qmart != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        notification.qmart!,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  const Spacer(),
                  // Plant
                  if (notification.plant != null) ...[
                    Icon(
                      Icons.business_rounded,
                      size: 13,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      notification.plant!,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Date
                  Icon(
                    Icons.schedule_rounded,
                    size: 13,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    DateTimeUtils.formatSapDateTime(notification.erdat),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
