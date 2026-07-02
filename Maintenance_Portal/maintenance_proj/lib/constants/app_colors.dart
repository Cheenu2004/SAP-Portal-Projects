/// Application-wide color constants
/// Defines the SAP-inspired enterprise color palette
import 'package:flutter/material.dart';

class AppColors {
  AppColors._(); // Prevent instantiation

  // ─── Primary Brand Colors ─────────────────────────────────────────
  static const Color primary = Color(0xFF4F46E5); // Vivid Indigo/Purple
  static const Color primaryDark = Color(0xFF312E81); 
  static const Color primaryLight = Color(0xFF818CF8); 
  static const Color accent = Color(0xFF0EA5E9); // Light Blue/Cyan

  // ─── Background & Surface ─────────────────────────────────────────
  static const Color background = Color(0xFF0B0F19); // Dark almost black
  static const Color surface = Color(0xFFFFFFFF); // White cards
  static const Color surfaceVariant = Color(0xFFF1F5F9); // Light gray for chips
  static const Color scaffoldBackground = Color(0xFF0B0F19); // Main background

  // ─── Text Colors ──────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A); // Dark text on white cards
  static const Color textSecondary = Color(0xFF475569);
  static const Color textTertiary = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF); // White text on dark/colored background
  static const Color textOnBackground = Color(0xFFFFFFFF); // White text on scaffold

  // ─── Status Colors ────────────────────────────────────────────────
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF475569);
  static const Color infoLight = Color(0xFFF1F5F9);

  // ─── Priority Colors ──────────────────────────────────────────────
  static const Color priorityHigh = Color(0xFFEF4444);
  static const Color priorityHighBg = Color(0xFFFEE2E2);
  static const Color priorityMedium = Color(0xFFF59E0B);
  static const Color priorityMediumBg = Color(0xFFFEF3C7);
  static const Color priorityLow = Color(0xFF10B981);
  static const Color priorityLowBg = Color(0xFFD1FAE5);

  // ─── Card & Border Colors ─────────────────────────────────────────
  static const Color cardBorder = Color(0xFFE4E7EC);
  static const Color divider = Color(0xFFEAECF0);
  static const Color shadow = Color(0x0D101828);

  // ─── Dashboard Card Gradients ─────────────────────────────────────
  // ─── Dashboard Card Gradients ─────────────────────────────────────
  static const List<Color> gradientBlue = [
    Color(0xFF6366F1),
    Color(0xFF8B5CF6),
  ];
  static const List<Color> gradientGreen = [
    Color(0xFF10B981),
    Color(0xFF34D399),
  ];
  static const List<Color> gradientOrange = [
    Color(0xFFF59E0B),
    Color(0xFFFBBF24),
  ];
  static const List<Color> gradientRed = [
    Color(0xFFEF4444),
    Color(0xFFF87171),
  ];
  static const List<Color> gradientPurple = [
    Color(0xFF4F46E5),
    Color(0xFF312E81),
  ];
  static const List<Color> gradientTeal = [
    Color(0xFF0EA5E9),
    Color(0xFF38BDF8),
  ];
}
