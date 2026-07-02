import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class WorkOrderHistoryDetailScreen extends StatelessWidget {
  final String? aufnr;

  const WorkOrderHistoryDetailScreen({super.key, this.aufnr});

  @override
  Widget build(BuildContext context) {
    final String resolvedAufnr =
        aufnr ?? (ModalRoute.of(context)?.settings.arguments as String? ?? '');

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: const CustomAppBar(
        title: 'Historical Work Order Details',
        showBackButton: true,
      ),
      body: Consumer<WorkOrderHistoryProvider>(
        builder: (context, provider, _) {
          WorkOrderHistoryModel? historyItem;
          try {
            historyItem = provider.history.firstWhere(
              (h) => h.aufnr == resolvedAufnr,
            );
          } catch (_) {}

          if (historyItem == null) {
            return const EmptyStateWidget(
              title: 'Not Found',
              subtitle:
                  'The selected historical work order details could not be found.',
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
                      label: 'Notification Number',
                      value: historyItem.qmnum?.isNotEmpty == true
                          ? historyItem.qmnum!
                          : 'N/A',
                      icon: Icons.notifications_outlined,
                    ),
                    DetailRow(
                      label: 'Order Type',
                      value: historyItem.auart ?? 'N/A',
                      icon: Icons.category_rounded,
                    ),
                    DetailRow(
                      label: 'Plant',
                      value: historyItem.plant ?? 'N/A',
                      icon: Icons.business_rounded,
                    ),
                    DetailRow(
                      label: 'Basic Finish Date',
                      value: DateTimeUtils.formatSapDateTime(historyItem.gltrp),
                      icon: Icons.event_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                DetailSectionCard(
                  title: 'Technical Object',
                  titleIcon: Icons.precision_manufacturing_rounded,
                  children: [
                    DetailRow(
                      label: 'Equipment',
                      value: historyItem.equnr?.isNotEmpty == true
                          ? historyItem.equnr!
                          : 'N/A',
                      icon: Icons.settings_rounded,
                    ),
                    DetailRow(
                      label: 'Functional Location',
                      value: historyItem.tplnr?.isNotEmpty == true
                          ? historyItem.tplnr!
                          : 'N/A',
                      icon: Icons.location_on_outlined,
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
      BuildContext context, WorkOrderHistoryModel historyItem) {
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
                      'Work Order Number',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textTertiary,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '#${historyItem.aufnr ?? 'N/A'}',
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
              historyItem.ktext?.isNotEmpty == true
                  ? historyItem.ktext!
                  : 'No description provided.',
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
