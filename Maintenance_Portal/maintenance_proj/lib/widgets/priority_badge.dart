/// Priority Badge widget
/// Displays priority level with color-coded chip
import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';

class PriorityBadge extends StatelessWidget {
  final String? priority;

  const PriorityBadge({super.key, this.priority});

  @override
  Widget build(BuildContext context) {
    final normalized = _normalizePriority(priority);
    final config = _getPriorityConfig(normalized);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config.icon, size: 12, color: config.textColor),
          const SizedBox(width: 4),
          Text(
            config.label,
            style: TextStyle(
              color: config.textColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// Normalize priority value from SAP
  String _normalizePriority(String? value) {
    final p = (value ?? '').trim().toUpperCase();
    if (p == '1' || p == 'HIGH' || p == 'VERY HIGH') return 'HIGH';
    if (p == '2' || p == 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  /// Get visual configuration for priority level
  _PriorityConfig _getPriorityConfig(String priority) {
    switch (priority) {
      case 'HIGH':
        return _PriorityConfig(
          label: 'High',
          textColor: AppColors.priorityHigh,
          backgroundColor: AppColors.priorityHighBg,
          icon: Icons.arrow_upward_rounded,
        );
      case 'MEDIUM':
        return _PriorityConfig(
          label: 'Medium',
          textColor: AppColors.priorityMedium,
          backgroundColor: AppColors.priorityMediumBg,
          icon: Icons.remove_rounded,
        );
      default:
        return _PriorityConfig(
          label: 'Low',
          textColor: AppColors.priorityLow,
          backgroundColor: AppColors.priorityLowBg,
          icon: Icons.arrow_downward_rounded,
        );
    }
  }
}

/// Internal config class for priority badge styling
class _PriorityConfig {
  final String label;
  final Color textColor;
  final Color backgroundColor;
  final IconData icon;

  _PriorityConfig({
    required this.label,
    required this.textColor,
    required this.backgroundColor,
    required this.icon,
  });
}
