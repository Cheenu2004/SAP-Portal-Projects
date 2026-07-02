/// Status Badge widget
/// Displays status with color-coded chip for work orders and notifications
import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';
import 'package:maintenance_proj/utils/sap_status_utils.dart';

class StatusBadge extends StatelessWidget {
  final String? status;
  final String? statusText;

  const StatusBadge({
    super.key,
    this.status,
    this.statusText,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getStatusConfig();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: config.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (config.dotColor != Colors.transparent) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: config.dotColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
          ],
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

  /// Determine status configuration based on SAP status codes
  _StatusConfig _getStatusConfig() {
    final displayText = statusText ?? status ?? 'Unknown';

    // Closed (I0046)
    if (SapStatusUtils.isClosedWorkOrder(status, statusText) ||
        SapStatusUtils.isClosedNotification(status, statusText)) {
      return _StatusConfig(
        label: displayText,
        dotColor: Colors.transparent,
        textColor: Colors.white,
        backgroundColor: AppColors.textSecondary,
        borderColor: Colors.transparent,
      );
    }

    // Technically Completed (I0045)
    if (SapStatusUtils.isTechnicallyCompleted(status, statusText)) {
      return _StatusConfig(
        label: displayText,
        dotColor: Colors.transparent,
        textColor: Colors.white,
        backgroundColor: AppColors.info,
        borderColor: Colors.transparent,
      );
    }

    // Processed / completed notifications
    final st = (statusText ?? '').toUpperCase();
    final s = (status ?? '').toUpperCase();
    if (st.contains('PROCESSED') ||
        st.contains('COMPLETED') ||
        s.contains('NOPR')) {
      return _StatusConfig(
        label: displayText,
        dotColor: Colors.transparent,
        textColor: Colors.white,
        backgroundColor: AppColors.success,
        borderColor: Colors.transparent,
      );
    }

    // Open / Outstanding
    if (SapStatusUtils.isOpenNotification(status, statusText) ||
        SapStatusUtils.isOpenWorkOrder(status, statusText)) {
      return _StatusConfig(
        label: displayText,
        dotColor: Colors.transparent,
        textColor: Colors.white,
        backgroundColor: AppColors.warning,
        borderColor: Colors.transparent,
      );
    }

    // Default
    return _StatusConfig(
      label: displayText,
      dotColor: Colors.transparent,
      textColor: Colors.white,
      backgroundColor: AppColors.textSecondary,
      borderColor: Colors.transparent,
    );
  }
}

/// Internal config class for status badge styling
class _StatusConfig {
  final String label;
  final Color dotColor;
  final Color textColor;
  final Color backgroundColor;
  final Color borderColor;

  _StatusConfig({
    required this.label,
    required this.dotColor,
    required this.textColor,
    required this.backgroundColor,
    required this.borderColor,
  });
}
