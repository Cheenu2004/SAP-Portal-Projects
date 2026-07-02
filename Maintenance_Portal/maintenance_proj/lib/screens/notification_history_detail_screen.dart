import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class NotificationHistoryDetailScreen extends StatelessWidget {
  final String? qmnum;

  const NotificationHistoryDetailScreen({super.key, this.qmnum});

  @override
  Widget build(BuildContext context) {
    final String resolvedQmnum =
        qmnum ?? (ModalRoute.of(context)?.settings.arguments as String? ?? '');

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: const CustomAppBar(
        title: 'Historical Notification Details',
        showBackButton: true,
      ),
      body: Consumer<NotificationHistoryProvider>(
        builder: (context, provider, _) {
          NotificationHistoryModel? historyItem;
          try {
            historyItem = provider.history.firstWhere(
              (h) => h.qmnum == resolvedQmnum,
            );
          } catch (_) {}

          if (historyItem == null) {
            return const EmptyStateWidget(
              title: 'Not Found',
              subtitle:
                  'The selected historical notification details could not be found.',
              icon: Icons.error_outline_rounded,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(context, historyItem),
                const SizedBox(height: 16),
                DetailSectionCard(
                  title: 'Core Information',
                  titleIcon: Icons.history_rounded,
                  children: [
                    DetailRow(
                      label: 'Employee ID',
                      value: historyItem.empId ?? 'N/A',
                      icon: Icons.badge_outlined,
                    ),
                    DetailRow(
                      label: 'Notification Type',
                      value: historyItem.qmart ?? 'N/A',
                      icon: Icons.category_rounded,
                    ),
                    DetailRow(
                      label: 'Created By',
                      value: historyItem.ernam ?? 'N/A',
                      icon: Icons.person_outline_rounded,
                    ),
                    DetailRow(
                      label: 'Created Date',
                      value: DateTimeUtils.formatSapDateTime(historyItem.erdat),
                      icon: Icons.calendar_today_rounded,
                    ),
                    DetailRow(
                      label: 'Plant',
                      value: historyItem.plant ?? 'N/A',
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

  Widget _buildHeaderCard(
      BuildContext context, NotificationHistoryModel historyItem) {
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
                      '#${historyItem.qmnum ?? 'N/A'}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
                PriorityBadge(priority: historyItem.priority),
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
              historyItem.qmtxt ?? 'No description provided.',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),
            StatusBadge(
              status: historyItem.status,
              statusText: historyItem.statusText,
            ),
          ],
        ),
      ),
    );
  }
}
