/// Work Orders Screen
/// Displays active work orders with search, refresh, and detail navigation
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class WorkOrdersScreen extends StatefulWidget {
  const WorkOrdersScreen({super.key});

  @override
  State<WorkOrdersScreen> createState() => _WorkOrdersScreenState();
}

class _WorkOrdersScreenState extends State<WorkOrdersScreen> {
  WorkOrderListFilter get _filter {
    final args = ModalRoute.of(context)?.settings.arguments;
    return args is WorkOrderListFilter ? args : WorkOrderListFilter.all;
  }

  String get _title {
    switch (_filter) {
      case WorkOrderListFilter.open:
        return AppStrings.openWorkOrders;
      case WorkOrderListFilter.all:
        return AppStrings.workOrders;
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
      await context.read<WorkOrdersProvider>().fetchWorkOrders(empId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: CustomAppBar(
        title: _title,
        actions: [
          Consumer<WorkOrdersProvider>(
            builder: (context, prov, _) {
              final workOrders = prov.workOrdersFor(_filter);
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
                      '${workOrders.length}',
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
            hintText: 'Search work orders...',
            onChanged: (query) {
              context.read<WorkOrdersProvider>().search(query);
            },
            onClear: () {
              context.read<WorkOrdersProvider>().clearSearch();
            },
          ),

          // Work Order List
          Expanded(
            child: Consumer<WorkOrdersProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) {
                  return const LoadingShimmer();
                }

                if (provider.errorMessage != null) {
                  return EmptyStateWidget(
                    title: AppStrings.error,
                    subtitle: provider.errorMessage,
                    icon: Icons.error_outline_rounded,
                    onRetry: _loadData,
                  );
                }

                final workOrders = provider.workOrdersFor(_filter);

                if (workOrders.isEmpty) {
                  return EmptyStateWidget(
                    title: AppStrings.noData,
                    subtitle: AppStrings.noDataSubtitle,
                    icon: Icons.assignment_late_rounded,
                    onRetry: _loadData,
                  );
                }

                return RefreshIndicator(
                  onRefresh: _loadData,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    itemCount: workOrders.length,
                    itemBuilder: (context, index) {
                      final workOrder = workOrders[index];
                      return _WorkOrderCard(workOrder: workOrder);
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

/// Individual work order card widget
class _WorkOrderCard extends StatelessWidget {
  final WorkOrderModel workOrder;

  const _WorkOrderCard({required this.workOrder});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            AppRoutes.workOrderDetail,
            arguments: workOrder.aufnr,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: WO Number + Priority
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '#${workOrder.aufnr ?? 'N/A'}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  PriorityBadge(priority: workOrder.priority),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                workOrder.ktext ?? 'No description',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Equipment & Location row
              if (workOrder.equnr != null && workOrder.equnr!.isNotEmpty ||
                  workOrder.tplnr != null && workOrder.tplnr!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      if (workOrder.equnr != null &&
                          workOrder.equnr!.isNotEmpty) ...[
                        Icon(
                          Icons.precision_manufacturing_rounded,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          workOrder.equnr!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      if (workOrder.tplnr != null &&
                          workOrder.tplnr!.isNotEmpty) ...[
                        Icon(
                          Icons.location_on_outlined,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            workOrder.tplnr!,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

              // Bottom Row: Status + Type + Date
              Row(
                children: [
                  StatusBadge(
                    status: workOrder.status,
                    statusText: workOrder.statusText,
                  ),
                  const SizedBox(width: 8),
                  if (workOrder.auart != null)
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
                        workOrder.auart!,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  const Spacer(),
                  // Plant
                  if (workOrder.plant != null) ...[
                    Icon(
                      Icons.business_rounded,
                      size: 13,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      workOrder.plant!,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Start Date
                  Icon(
                    Icons.schedule_rounded,
                    size: 13,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    DateTimeUtils.formatSapDateTime(workOrder.gltrp),
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
