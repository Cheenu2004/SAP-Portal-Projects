/// Notifications Provider
/// Manages notification data, search, and refresh state
import 'package:flutter/material.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/services/odata_service.dart';

class NotificationsProvider extends ChangeNotifier {
  final ODataService _odataService;

  // ─── State ────────────────────────────────────────────────────────
  List<NotificationModel> _notifications = [];
  List<NotificationModel> _filteredNotifications = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';

  // ─── Getters ──────────────────────────────────────────────────────
  List<NotificationModel> get notifications =>
      _searchQuery.isEmpty ? _notifications : _filteredNotifications;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;

  /// Total count of notifications
  int get totalCount => _notifications.length;

  /// Open notifications (AUFNR empty — ABAP MaintNotificationSet)
  int get openCount => _notifications.where((n) => n.isOpen).length;

  /// Closed notifications (AUFNR set — ABAP Status CLOSED)
  int get closedCount => _notifications.where((n) => n.isClosed).length;

  List<NotificationModel> notificationsFor(NotificationListFilter filter) {
    final source = _searchQuery.isEmpty
        ? _notifications
        : _filteredNotifications;
    return _filterNotifications(source, filter);
  }

  int countFor(NotificationListFilter filter) =>
      _filterNotifications(_notifications, filter).length;

  NotificationsProvider({required ODataService odataService})
    : _odataService = odataService;

  /// Fetch notifications from SAP OData
  Future<void> fetchNotifications(String empId) async {
    _isLoading = true;
    _errorMessage = null;
    Future.microtask(() => notifyListeners());

    try {
      _notifications = await _odataService.fetchNotifications(empId);
      _notifications.sort((a, b) {
        int priorityWeight(String p) {
          if (p == 'HIGH') return 1;
          if (p == 'MEDIUM') return 2;
          if (p == 'LOW') return 3;
          return 4;
        }
        return priorityWeight(a.normalizedPriority)
            .compareTo(priorityWeight(b.normalizedPriority));
      });
      _applySearch();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  /// Search/filter notifications by query
  void search(String query) {
    _searchQuery = query;
    _applySearch();
    notifyListeners();
  }

  /// Clear search filter
  void clearSearch() {
    _searchQuery = '';
    _filteredNotifications = [];
    notifyListeners();
  }

  /// Get a specific notification by notification number
  NotificationModel? getNotificationById(String qmnum) {
    try {
      return _notifications.firstWhere((n) => n.qmnum == qmnum);
    } catch (_) {
      return null;
    }
  }

  /// Apply search filter to notifications
  void _applySearch() {
    if (_searchQuery.isEmpty) {
      _filteredNotifications = [];
      return;
    }

    final query = _searchQuery.toLowerCase();
    _filteredNotifications = _notifications.where((n) {
      return (n.qmnum?.toLowerCase().contains(query) ?? false) ||
          (n.qmtxt?.toLowerCase().contains(query) ?? false) ||
          (n.qmart?.toLowerCase().contains(query) ?? false) ||
          (n.plant?.toLowerCase().contains(query) ?? false) ||
          (n.statusText?.toLowerCase().contains(query) ?? false) ||
          (n.ernam?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  List<NotificationModel> _filterNotifications(
    List<NotificationModel> source,
    NotificationListFilter filter,
  ) {
    switch (filter) {
      case NotificationListFilter.open:
        return source.where((n) => n.isOpen).toList();
      case NotificationListFilter.closed:
        return source.where((n) => n.isClosed).toList();
      case NotificationListFilter.all:
        return source;
    }
  }
}
