/// Notification History Provider — completed/closed only (MaintNotificationSet).
import 'package:flutter/material.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/services/odata_service.dart';
import 'package:maintenance_proj/utils/sap_status_utils.dart';

class NotificationHistoryProvider extends ChangeNotifier {
  final ODataService _odataService;

  List<NotificationHistoryModel> _history = [];
  List<NotificationHistoryModel> _filteredHistory = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';

  List<NotificationHistoryModel> get _completedHistory => _history
      .where(
        (n) => SapStatusUtils.isCompletedNotificationHistory(
          n.status,
          n.statusText,
        ),
      )
      .toList();

  List<NotificationHistoryModel> get history =>
      _searchQuery.isEmpty ? _completedHistory : _filteredHistory;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get totalCount => _completedHistory.length;
  int get closedCount => _completedHistory.length;

  NotificationHistoryProvider({required ODataService odataService})
      : _odataService = odataService;

  Future<void> fetchHistory(String empId) async {
    _isLoading = true;
    _errorMessage = null;
    Future.microtask(() => notifyListeners());

    try {
      _history = await _odataService.fetchNotificationHistory(empId);
      _history.sort((a, b) {
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

  void search(String query) {
    _searchQuery = query;
    _applySearch();
    notifyListeners();
  }

  void clearSearch() {
    _searchQuery = '';
    _filteredHistory = [];
    notifyListeners();
  }

  NotificationHistoryModel? getHistoryById(String qmnum) {
    try {
      return _completedHistory.firstWhere((n) => n.qmnum == qmnum);
    } catch (_) {
      return null;
    }
  }

  void _applySearch() {
    if (_searchQuery.isEmpty) {
      _filteredHistory = [];
      return;
    }

    final query = _searchQuery.toLowerCase();
    _filteredHistory = _completedHistory.where((n) {
      return (n.qmnum?.toLowerCase().contains(query) ?? false) ||
          (n.qmtxt?.toLowerCase().contains(query) ?? false) ||
          (n.qmart?.toLowerCase().contains(query) ?? false) ||
          (n.statusText?.toLowerCase().contains(query) ?? false) ||
          (n.plant?.toLowerCase().contains(query) ?? false) ||
          (n.ernam?.toLowerCase().contains(query) ?? false);
    }).toList();
  }
}
