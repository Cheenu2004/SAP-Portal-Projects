/// Detail Row widget
/// Reusable label-value row for detail screens
import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';

class DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;

  const DetailRow({
    super.key,
    required this.label,
    required this.value,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          if (icon != null) ...[
            Icon(icon, size: 16, color: AppColors.textTertiary),
            const SizedBox(width: 8),
          ],
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          // Value
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

/// Detail Section Card widget
/// Groups related detail rows into a titled card
class DetailSectionCard extends StatelessWidget {
  final String title;
  final IconData? titleIcon;
  final List<Widget> children;

  const DetailSectionCard({
    super.key,
    required this.title,
    this.titleIcon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Title
            Row(
              children: [
                if (titleIcon != null) ...[
                  Icon(titleIcon, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                ],
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
            const Divider(height: 24),
            // Children (detail rows)
            ...children,
          ],
        ),
      ),
    );
  }
}
