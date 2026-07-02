/// Notification History Screen
/// Displays historical notifications with search and detail navigation
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/utils/date_time_utils.dart';
import 'package:maintenance_proj/widgets/index.dart';

class NotificationHistoryScreen extends StatefulWidget {
  const NotificationHistoryScreen({super.key});

  @override
  State<NotificationHistoryScreen> createState() => _NotificationHistoryScreenState();
}

class _NotificationHistoryScreenState extends State<NotificationHistoryScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final empId = context.read<AuthProvider>().empId;
    if (empId != null) {
      await context.read<NotificationHistoryProvider>().fetchHistory(empId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: CustomAppBar(
        title: AppStrings.notificationHistory,
        actions: [
          Consumer<NotificationHistoryProvider>(
            builder: (context, prov, _) {
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${prov.totalCount}',
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
            hintText: 'Search history...',
            onChanged: (query) {
              context.read<NotificationHistoryProvider>().search(query);
            },
            onClear: () {
              context.read<NotificationHistoryProvider>().clearSearch();
            },
          ),
          Expanded(
            child: Consumer<NotificationHistoryProvider>(
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

                if (provider.history.isEmpty) {
                  return EmptyStateWidget(
                    title: AppStrings.noData,
                    subtitle: AppStrings.noDataSubtitle,
                    icon: Icons.history_rounded,
                    onRetry: _loadData,
                  );
                }

                return RefreshIndicator(
                  onRefresh: _loadData,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: provider.history.length,
                    itemBuilder: (context, index) {
                      final item = provider.history[index];
                      return _NotificationHistoryCard(item: item);
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

/// Notification history card widget
class _NotificationHistoryCard extends StatelessWidget {
  final NotificationHistoryModel item;

  const _NotificationHistoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context,
            AppRoutes.notificationHistoryDetail,
            arguments: item.qmnum,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '#${item.qmnum ?? 'N/A'}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                  ),
                  PriorityBadge(priority: item.priority),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item.qmtxt ?? 'No description',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  StatusBadge(
                    status: item.status,
                    statusText: item.statusText,
                  ),
                  const Spacer(),
                  Icon(Icons.schedule_rounded,
                      size: 13, color: AppColors.textTertiary),
                  const SizedBox(width: 3),
                  Text(
                    DateTimeUtils.formatSapDateTime(item.erdat),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textTertiary),
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
