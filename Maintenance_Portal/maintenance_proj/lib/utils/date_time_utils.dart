/// Date/Time utility functions
/// Handles SAP OData date format parsing and display formatting
import 'package:intl/intl.dart';

class DateTimeUtils {
  DateTimeUtils._(); // Prevent instantiation

  /// Format SAP OData datetime string to readable format
  /// SAP OData returns dates in formats like:
  /// - /Date(1234567890000)/  (milliseconds since epoch)
  /// - 2024-01-15T00:00:00   (ISO format)
  /// - 20240115               (YYYYMMDD compact format)
  static String formatSapDateTime(String? dateString) {
    if (dateString == null || dateString.isEmpty || dateString == 'null') {
      return 'N/A';
    }

    try {
      DateTime? dateTime;

      // Handle SAP /Date(...)/ format
      final sapDateRegex = RegExp(r'/Date\((\d+)([+-]\d+)?\)/');
      final match = sapDateRegex.firstMatch(dateString);
      if (match != null) {
        final milliseconds = int.parse(match.group(1)!);
        dateTime = DateTime.fromMillisecondsSinceEpoch(milliseconds);
      }

      // Handle ISO 8601 format
      if (dateTime == null && dateString.contains('T')) {
        dateTime = DateTime.tryParse(dateString);
      }

      // Handle compact YYYYMMDD format
      if (dateTime == null && dateString.length == 8) {
        dateTime = DateTime.tryParse(
          '${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}',
        );
      }

      // Handle YYYY-MM-DD format
      if (dateTime == null && dateString.length >= 10) {
        dateTime = DateTime.tryParse(dateString.substring(0, 10));
      }

      if (dateTime != null) {
        return DateFormat('dd MMM yyyy').format(dateTime);
      }

      // Return the original string if no format matched
      return dateString;
    } catch (e) {
      return dateString;
    }
  }

  /// Format date with time
  static String formatSapDateTimeWithTime(String? dateString) {
    if (dateString == null || dateString.isEmpty || dateString == 'null') {
      return 'N/A';
    }

    try {
      DateTime? dateTime;

      final sapDateRegex = RegExp(r'/Date\((\d+)([+-]\d+)?\)/');
      final match = sapDateRegex.firstMatch(dateString);
      if (match != null) {
        final milliseconds = int.parse(match.group(1)!);
        dateTime = DateTime.fromMillisecondsSinceEpoch(milliseconds);
      }

      dateTime ??= DateTime.tryParse(dateString);

      if (dateTime != null) {
        return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
      }

      return dateString;
    } catch (e) {
      return dateString;
    }
  }

  /// Get relative time string (e.g., "2 hours ago")
  static String getRelativeTime(String? dateString) {
    if (dateString == null || dateString.isEmpty) return '';

    try {
      DateTime? dateTime;

      final sapDateRegex = RegExp(r'/Date\((\d+)([+-]\d+)?\)/');
      final match = sapDateRegex.firstMatch(dateString);
      if (match != null) {
        final milliseconds = int.parse(match.group(1)!);
        dateTime = DateTime.fromMillisecondsSinceEpoch(milliseconds);
      }

      dateTime ??= DateTime.tryParse(dateString);

      if (dateTime == null) return '';

      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 365) {
        return '${(difference.inDays / 365).floor()}y ago';
      } else if (difference.inDays > 30) {
        return '${(difference.inDays / 30).floor()}mo ago';
      } else if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return '';
    }
  }
}
