/// Work Orders Provider
/// Lists open work orders (MaintWorkOrderSet) plus closed (I0046 from MaintWorkOrderSet).
import 'package:flutter/material.dart';
import 'package:maintenance_proj/models/index.dart';
import 'package:maintenance_proj/services/odata_service.dart';

class WorkOrdersProvider extends ChangeNotifier {
  final ODataService _odataService;

  List<WorkOrderModel> _workOrders = [];
  List<WorkOrderModel> _filteredWorkOrders = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';

  List<WorkOrderModel> get workOrders =>
      _searchQuery.isEmpty ? _workOrders : _filteredWorkOrders;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;

  int get totalCount => _workOrders.length;
  int get openCount => _workOrders.where((wo) => wo.isOpen).length;
  int get closedCount => _workOrders.where((wo) => wo.isClosed).length;

  List<WorkOrderModel> workOrdersFor(WorkOrderListFilter filter) {
    final source = _searchQuery.isEmpty ? _workOrders : _filteredWorkOrders;
    return _filterWorkOrders(source, filter);
  }

  int countFor(WorkOrderListFilter filter) =>
      _filterWorkOrders(_workOrders, filter).length;

  WorkOrdersProvider({required ODataService odataService})
    : _odataService = odataService;

  /// Fetch open + closed work orders for the main Work Orders screen.
  Future<void> fetchWorkOrders(String empId) async {
    _isLoading = true;
    _errorMessage = null;
    Future.microtask(() => notifyListeners());

    try {
      final openOrders = await _odataService.fetchWorkOrders(empId);
      final history = await _odataService.fetchWorkOrderHistory(empId);

      final closedOrders = history
          .where((h) => h.isClosed)
          .map(_workOrderFromHistory)
          .toList();

      _workOrders = _mergeWorkOrders(openOrders, closedOrders);
      _workOrders.sort((a, b) {
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
    _filteredWorkOrders = [];
    notifyListeners();
  }

  WorkOrderModel? getWorkOrderById(String aufnr) {
    try {
      return _workOrders.firstWhere((wo) => wo.aufnr == aufnr);
    } catch (_) {
      return null;
    }
  }

  List<WorkOrderModel> _mergeWorkOrders(
    List<WorkOrderModel> openOrders,
    List<WorkOrderModel> closedOrders,
  ) {
    final seen = <String>{};
    final merged = <WorkOrderModel>[];

    for (final wo in openOrders) {
      final id = wo.aufnr;
      if (id == null || id.isEmpty) continue;
      seen.add(id);
      merged.add(wo);
    }

    for (final wo in closedOrders) {
      final id = wo.aufnr;
      if (id == null || id.isEmpty || seen.contains(id)) continue;
      seen.add(id);
      merged.add(wo);
    }

    return merged;
  }

  WorkOrderModel _workOrderFromHistory(WorkOrderHistoryModel history) {
    return WorkOrderModel(
      aufnr: history.aufnr,
      erdat: history.erdat,
      ernam: history.ernam,
      ktext: history.ktext,
      empId: history.empId,
      auart: history.auart,
      plant: history.plant,
      gltrp: history.gltrp,
      equnr: history.equnr,
      tplnr: history.tplnr,
      qmnum: history.qmnum,
      priority: history.priority,
      status: history.status,
      statusText: history.statusText,
    );
  }

  void _applySearch() {
    if (_searchQuery.isEmpty) {
      _filteredWorkOrders = [];
      return;
    }

    final query = _searchQuery.toLowerCase();
    _filteredWorkOrders = _workOrders.where((wo) {
      return (wo.aufnr?.toLowerCase().contains(query) ?? false) ||
          (wo.ktext?.toLowerCase().contains(query) ?? false) ||
          (wo.auart?.toLowerCase().contains(query) ?? false) ||
          (wo.plant?.toLowerCase().contains(query) ?? false) ||
          (wo.equnr?.toLowerCase().contains(query) ?? false) ||
          (wo.tplnr?.toLowerCase().contains(query) ?? false) ||
          (wo.qmnum?.toLowerCase().contains(query) ?? false) ||
          (wo.statusText?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  List<WorkOrderModel> _filterWorkOrders(
    List<WorkOrderModel> source,
    WorkOrderListFilter filter,
  ) {
    switch (filter) {
      case WorkOrderListFilter.open:
        return source.where((wo) => wo.isOpen).toList();
      case WorkOrderListFilter.all:
        return source;
    }
  }
}
