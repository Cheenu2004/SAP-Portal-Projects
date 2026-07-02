/// SAP status helpers aligned with ABAP backend logic.
class SapStatusUtils {
  SapStatusUtils._();

  // ─── Work order JEST codes (MaintWorkOrderSet) ─────────────────

  static bool isTechnicallyCompleted(String? status, String? statusText) {
    final s = (status ?? '').toUpperCase();
    final st = (statusText ?? '').toUpperCase();
    return s == 'I0045' ||
        s == 'TECO' ||
        s.contains('TECO') ||
        st.contains('TECHNICALLY COMPLETED') ||
        st.contains('TECO');
  }

  static bool isOnlyTechnicallyCompletedWorkOrder(
    String? status,
    String? statusText,
  ) {
    return isTechnicallyCompleted(status, statusText) &&
        !isClosedWorkOrder(status, statusText);
  }

  /// Closed work order — I0046 / CLSD (history entity set).
  static bool isClosedWorkOrder(String? status, String? statusText) {
    final s = (status ?? '').toUpperCase();
    final st = (statusText ?? '').toUpperCase();
    return s == 'I0046' ||
        s == 'CLOSED' ||
        s.contains('CLSD') ||
        st.contains('CLSD') ||
        (st.contains('CLOSED') && !st.contains('WORK ORDER CREATED'));
  }

  /// Completed entries for work order history screens only.
  static bool isCompletedWorkOrderHistory(String? status, String? statusText) {
    return isTechnicallyCompleted(status, statusText) ||
        isClosedWorkOrder(status, statusText);
  }

  static bool isOpenWorkOrder(String? status, String? statusText) {
    final s = (status ?? '').toUpperCase();
    final st = (statusText ?? '').toUpperCase();
    if (isTechnicallyCompleted(s, st) || isClosedWorkOrder(s, st)) {
      return false;
    }
    return s == 'OPEN' ||
        s.contains('REL') ||
        st.contains('WORK ORDER OPEN') ||
        st.contains('OPEN') ||
        st.contains('RELEASED');
  }

  // ─── Notification QMEL logic (MaintNotificationSet) ─

  /// CLOSED when AUFNR exists — Status field is "CLOSED" per ABAP.
  static bool isClosedNotification(String? status, String? statusText) {
    final s = (status ?? '').toUpperCase();
    final st = (statusText ?? '').toUpperCase();
    return s == 'CLOSED' ||
        s.contains('CLOSED') ||
        st.contains('WORK ORDER CREATED');
  }

  /// OPEN when AUFNR is empty — Status field is "OPEN" per ABAP.
  static bool isOpenNotification(String? status, String? statusText) {
    if (isClosedNotification(status, statusText)) return false;
    final s = (status ?? '').toUpperCase();
    final st = (statusText ?? '').toUpperCase();
    return s == 'OPEN' ||
        s.contains('OSNO') ||
        st.contains('NOTIFICATION OPEN') ||
        st.contains('OPEN') ||
        st.contains('OUTSTANDING');
  }

  /// History entity set only returns processed/closed notifications.
  static bool isCompletedNotificationHistory(
    String? status,
    String? statusText,
  ) {
    return isClosedNotification(status, statusText);
  }
}
