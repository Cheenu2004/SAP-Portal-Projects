/// Custom AppBar widget
/// Reusable app bar with consistent SAP-style branding
import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showBackButton;
  final VoidCallback? onBackPressed;

  const CustomAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBackButton = true,
    this.onBackPressed,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      leading: showBackButton && Navigator.canPop(context)
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: onBackPressed ?? () => Navigator.pop(context),
            )
          : null,
      automaticallyImplyLeading: showBackButton,
      actions: actions,
      elevation: 0,
      scrolledUnderElevation: 1,
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.textOnPrimary,
    );
  }
}
