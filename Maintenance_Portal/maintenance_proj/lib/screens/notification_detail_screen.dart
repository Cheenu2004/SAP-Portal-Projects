import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class NotificationDetailScreen extends StatelessWidget {
  final String? qmnum;

  const NotificationDetailScreen({super.key, this.qmnum});

  @override
  Widget build(BuildContext context) {
    final String resolvedQmnum =
        qmnum ?? (ModalRoute.of(context)?.settings.arguments as String? ?? '');

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: const CustomAppBar(
        title: 'Notification Details',
        showBackButton: true,
      ),
      body: Consumer<NotificationsProvider>(
        builder: (context, provider, _) {
          NotificationModel? notification;
          try {
            notification = provider.notifications.firstWhere(
              (n) => n.qmnum == resolvedQmnum,
            );
          } catch (_) {}

          if (notification == null) {
            return const EmptyStateWidget(
              title: 'Not Found',
              subtitle: 'The selected notification details could not be found.',
              icon: Icons.error_outline_rounded,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(context, notification),
                const SizedBox(height: 16),
                DetailSectionCard(
                  title: 'Core Information',
                  titleIcon: Icons.info_outline_rounded,
                  children: [
                    DetailRow(
                      label: 'Employee ID',
                      value: notification.empId ?? 'N/A',
                      icon: Icons.badge_outlined,
                    ),
                    DetailRow(
                      label: 'Notification Type',
                      value: notification.qmart ?? 'N/A',
                      icon: Icons.category_rounded,
                    ),
                    DetailRow(
                      label: 'Created By',
                      value: notification.ernam ?? 'N/A',
                      icon: Icons.person_outline_rounded,
                    ),
                    DetailRow(
                      label: 'Created Date',
                      value: DateTimeUtils.formatSapDateTime(notification.erdat),
                      icon: Icons.calendar_today_rounded,
                    ),
                    DetailRow(
                      label: 'Plant',
                      value: notification.plant ?? 'N/A',
                      icon: Icons.business_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCard(BuildContext context, NotificationModel notification) {
    return Card(
      elevation: 2,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.cardBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notification Number',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textTertiary,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '#${notification.qmnum ?? 'N/A'}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
                PriorityBadge(priority: notification.priority),
              ],
            ),
            const Divider(height: 32),
            Text(
              'Description',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              notification.qmtxt ?? 'No description provided.',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),
            StatusBadge(
              status: notification.status,
              statusText: notification.statusText,
            ),
          ],
        ),
      ),
    );
  }
}
