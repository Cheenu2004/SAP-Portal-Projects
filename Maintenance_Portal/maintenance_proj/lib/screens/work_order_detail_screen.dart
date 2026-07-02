import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class WorkOrderDetailScreen extends StatelessWidget {
  final String? aufnr;

  const WorkOrderDetailScreen({super.key, this.aufnr});

  @override
  Widget build(BuildContext context) {
    final String resolvedAufnr =
        aufnr ?? (ModalRoute.of(context)?.settings.arguments as String? ?? '');

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: const CustomAppBar(
        title: 'Work Order Details',
        showBackButton: true,
      ),
      body: Consumer<WorkOrdersProvider>(
        builder: (context, provider, _) {
          WorkOrderModel? workOrder;
          try {
            workOrder = provider.workOrders.firstWhere(
              (w) => w.aufnr == resolvedAufnr,
            );
          } catch (_) {}

          if (workOrder == null) {
            return const EmptyStateWidget(
              title: 'Not Found',
              subtitle: 'The selected work order details could not be found.',
              icon: Icons.error_outline_rounded,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(context, workOrder),
                const SizedBox(height: 16),
                DetailSectionCard(
                  title: 'Core Information',
                  titleIcon: Icons.info_outline_rounded,
                  children: [
                    DetailRow(
                      label: 'Employee ID',
                      value: workOrder.empId ?? 'N/A',
                      icon: Icons.badge_outlined,
                    ),
                    DetailRow(
                      label: 'Notification Number',
                      value: workOrder.qmnum?.isNotEmpty == true
                          ? workOrder.qmnum!
                          : 'N/A',
                      icon: Icons.notifications_outlined,
                    ),
                    DetailRow(
                      label: 'Order Type',
                      value: workOrder.auart ?? 'N/A',
                      icon: Icons.category_rounded,
                    ),
                    DetailRow(
                      label: 'Plant',
                      value: workOrder.plant ?? 'N/A',
                      icon: Icons.business_rounded,
                    ),
                    DetailRow(
                      label: 'Basic Finish Date',
                      value: DateTimeUtils.formatSapDateTime(workOrder.gltrp),
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
                      value: workOrder.equnr?.isNotEmpty == true
                          ? workOrder.equnr!
                          : 'N/A',
                      icon: Icons.settings_rounded,
                    ),
                    DetailRow(
                      label: 'Functional Location',
                      value: workOrder.tplnr?.isNotEmpty == true
                          ? workOrder.tplnr!
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

  Widget _buildHeaderCard(BuildContext context, WorkOrderModel workOrder) {
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
                      '#${workOrder.aufnr ?? 'N/A'}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
                PriorityBadge(priority: workOrder.priority),
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
              workOrder.ktext?.isNotEmpty == true
                  ? workOrder.ktext!
                  : 'No description provided.',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),
            StatusBadge(
              status: workOrder.status,
              statusText: workOrder.statusText,
            ),
          ],
        ),
      ),
    );
  }
}
