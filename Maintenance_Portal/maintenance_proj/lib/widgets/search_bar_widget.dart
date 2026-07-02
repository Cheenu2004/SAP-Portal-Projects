/// Search Bar widget
/// Reusable search input for list screens
import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';

class SearchBarWidget extends StatefulWidget {
  final String hintText;
  final ValueChanged<String> onChanged;
  final VoidCallback? onClear;

  const SearchBarWidget({
    super.key,
    this.hintText = 'Search...',
    required this.onChanged,
    this.onClear,
  });

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final _controller = TextEditingController();
  bool _hasText = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _controller,
        onChanged: (value) {
          setState(() => _hasText = value.isNotEmpty);
          widget.onChanged(value);
        },
        decoration: InputDecoration(
          hintText: widget.hintText,
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: AppColors.textTertiary,
            size: 20,
          ),
          suffixIcon: _hasText
              ? IconButton(
                  icon: const Icon(
                    Icons.close_rounded,
                    color: AppColors.textTertiary,
                    size: 20,
                  ),
                  onPressed: () {
                    _controller.clear();
                    setState(() => _hasText = false);
                    widget.onChanged('');
                    widget.onClear?.call();
                  },
                )
              : null,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          filled: false,
        ),
      ),
    );
  }
}
