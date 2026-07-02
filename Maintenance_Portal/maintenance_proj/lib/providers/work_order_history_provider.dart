/// Work Order History Provider — completed only (I0045 / I0046).
import 'package:flutter/material.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/services/odata_service.dart';
import 'package:maintenance_proj/utils/sap_status_utils.dart';

class WorkOrderHistoryProvider extends ChangeNotifier {
  final ODataService _odataService;

  List<WorkOrderHistoryModel> _history = [];
  List<WorkOrderHistoryModel> _filteredHistory = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';

  List<WorkOrderHistoryModel> get _completedHistory => _history
      .where(
        (wo) => SapStatusUtils.isCompletedWorkOrderHistory(
          wo.status,
          wo.statusText,
        ),
      )
      .toList();

  List<WorkOrderHistoryModel> get history =>
      _searchQuery.isEmpty ? _completedHistory : _filteredHistory;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get totalCount => _completedHistory.length;

  int get closedCount => _completedHistory.length;

  List<WorkOrderHistoryModel> historyFor(WorkOrderHistoryListFilter filter) {
    final source = _searchQuery.isEmpty ? _completedHistory : _filteredHistory;
    return _filterHistory(source, filter);
  }

  int countFor(WorkOrderHistoryListFilter filter) =>
      _filterHistory(_completedHistory, filter).length;

  WorkOrderHistoryProvider({required ODataService odataService})
    : _odataService = odataService;

  Future<void> fetchHistory(String empId) async {
    _isLoading = true;
    _errorMessage = null;
    Future.microtask(() => notifyListeners());

    try {
      _history = await _odataService.fetchWorkOrderHistory(empId);
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

  WorkOrderHistoryModel? getHistoryById(String aufnr) {
    try {
      return _completedHistory.firstWhere((wo) => wo.aufnr == aufnr);
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
    _filteredHistory = _completedHistory.where((wo) {
      return (wo.aufnr?.toLowerCase().contains(query) ?? false) ||
          (wo.ktext?.toLowerCase().contains(query) ?? false) ||
          (wo.auart?.toLowerCase().contains(query) ?? false) ||
          (wo.statusText?.toLowerCase().contains(query) ?? false) ||
          (wo.plant?.toLowerCase().contains(query) ?? false) ||
          (wo.equnr?.toLowerCase().contains(query) ?? false) ||
          (wo.tplnr?.toLowerCase().contains(query) ?? false) ||
          (wo.qmnum?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  List<WorkOrderHistoryModel> _filterHistory(
    List<WorkOrderHistoryModel> source,
    WorkOrderHistoryListFilter filter,
  ) {
    switch (filter) {
      case WorkOrderHistoryListFilter.closed:
        return source;
      case WorkOrderHistoryListFilter.all:
        return source;
    }
  }
}
