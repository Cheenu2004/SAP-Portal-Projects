/// Loading Shimmer widget
/// Skeleton loader for list screens while data is being fetched
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:maintenance_proj/constants/app_colors.dart';

class LoadingShimmer extends StatelessWidget {
  final int itemCount;

  const LoadingShimmer({super.key, this.itemCount = 6});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: itemCount,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: title + badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _shimmerBox(width: 120, height: 14),
                    _shimmerBox(width: 60, height: 20, radius: 10),
                  ],
                ),
                const SizedBox(height: 12),
                // Description line
                _shimmerBox(width: double.infinity, height: 12),
                const SizedBox(height: 8),
                _shimmerBox(width: 200, height: 12),
                const SizedBox(height: 12),
                // Bottom row: status + date
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _shimmerBox(width: 80, height: 20, radius: 10),
                    _shimmerBox(width: 90, height: 12),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Helper to create a shimmer placeholder box
  Widget _shimmerBox({
    required double height,
    double? width,
    double radius = 4,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

/// Dashboard shimmer for loading state
class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceVariant,
      highlightColor: AppColors.surface,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 120, height: 18, color: AppColors.surface),
                    const SizedBox(height: 8),
                    Container(width: 80, height: 14, color: AppColors.surface),
                  ],
                ),
              ],
            ),
            // Grid of 6 tiles
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.15,
              children: List.generate(
                6,
                (index) => Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
