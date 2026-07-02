/// Work Order History Screen
/// Displays historical work orders with TECO/Closed status indicators
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class WorkOrderHistoryScreen extends StatefulWidget {
  const WorkOrderHistoryScreen({super.key});

  @override
  State<WorkOrderHistoryScreen> createState() => _WorkOrderHistoryScreenState();
}

class _WorkOrderHistoryScreenState extends State<WorkOrderHistoryScreen> {
  WorkOrderHistoryListFilter get _filter {
    final args = ModalRoute.of(context)?.settings.arguments;
    return args is WorkOrderHistoryListFilter
        ? args
        : WorkOrderHistoryListFilter.all;
  }

  String get _title {
    switch (_filter) {
      case WorkOrderHistoryListFilter.closed:
        return AppStrings.closedWorkOrders;
      case WorkOrderHistoryListFilter.all:
        return AppStrings.workOrderHistory;
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
      await context.read<WorkOrderHistoryProvider>().fetchHistory(empId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: CustomAppBar(
        title: _title,
        actions: [
          Consumer<WorkOrderHistoryProvider>(
            builder: (context, prov, _) {
              final history = prov.historyFor(_filter);
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
                      '${history.length}',
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
          SearchBarWidget(
            hintText: 'Search work order history...',
            onChanged: (query) {
              context.read<WorkOrderHistoryProvider>().search(query);
            },
            onClear: () {
              context.read<WorkOrderHistoryProvider>().clearSearch();
            },
          ),
          Expanded(
            child: Consumer<WorkOrderHistoryProvider>(
              builder: (context, provider, _) {
                if (provider.isLoading) return const LoadingShimmer();

                if (provider.errorMessage != null) {
                  return EmptyStateWidget(
                    title: AppStrings.error,
                    subtitle: provider.errorMessage,
                    icon: Icons.error_outline_rounded,
                    onRetry: _loadData,
                  );
                }

                final history = provider.historyFor(_filter);

                if (history.isEmpty) {
                  return EmptyStateWidget(
                    title: AppStrings.noData,
                    subtitle: AppStrings.noDataSubtitle,
                    icon: Icons.history_toggle_off_rounded,
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
                    itemCount: history.length,
                    itemBuilder: (context, index) {
                      final item = history[index];
                      return _WorkOrderHistoryCard(item: item);
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

/// Work order history card widget
class _WorkOrderHistoryCard extends StatelessWidget {
  final WorkOrderHistoryModel item;

  const _WorkOrderHistoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            AppRoutes.workOrderHistoryDetail,
            arguments: item.aufnr,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '#${item.aufnr ?? 'N/A'}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  PriorityBadge(priority: item.priority),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                item.ktext ?? 'No description',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Equipment info
              if (item.equnr != null && item.equnr!.isNotEmpty ||
                  item.tplnr != null && item.tplnr!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      if (item.equnr != null && item.equnr!.isNotEmpty) ...[
                        Icon(
                          Icons.precision_manufacturing_rounded,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          item.equnr!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                      if (item.tplnr != null && item.tplnr!.isNotEmpty) ...[
                        const SizedBox(width: 12),
                        Icon(
                          Icons.location_on_outlined,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.tplnr!,
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

              // Bottom Row
              Row(
                children: [
                  StatusBadge(status: item.status, statusText: item.statusText),
                  const Spacer(),
                  Icon(
                    Icons.schedule_rounded,
                    size: 13,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    DateTimeUtils.formatSapDateTime(item.gltrp),
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
