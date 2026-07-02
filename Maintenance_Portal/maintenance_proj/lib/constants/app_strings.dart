/// Application-wide string constants
/// Centralizes all user-facing text to support future localization

class AppStrings {
  AppStrings._(); // Prevent instantiation

  // ─── App Info ─────────────────────────────────────────────────────
  static const String appName = 'Maintenance Portal';
  static const String appSubtitle = 'SAP Plant Maintenance';
  static const String appVersion = 'v1.0.0';

  // ─── Login Screen ─────────────────────────────────────────────────
  static const String loginTitle = 'Welcome Back';
  static const String loginSubtitle = 'Sign in to your maintenance portal';
  static const String employeeIdLabel = 'Employee ID';
  static const String employeeIdHint = 'Enter your Employee ID';
  static const String passwordLabel = 'Password';
  static const String passwordHint = 'Enter your password';
  static const String loginButton = 'Sign In';
  static const String loggingIn = 'Signing in...';
  static const String loginError = 'Invalid credentials. Please try again.';
  static const String loginNetworkError = 'Network error. Please check your connection.';
  static const String employeeIdRequired = 'Employee ID is required';
  static const String passwordRequired = 'Password is required';

  // ─── Dashboard ────────────────────────────────────────────────────
  static const String dashboard = 'Dashboard';
  static const String totalNotifications = 'Total Notifications';
  static const String totalWorkOrders = 'Total Work Orders';
  static const String openNotifications = 'Open Notifications';
  static const String closedNotifications = 'Closed Notifications';
  static const String openWorkOrders = 'Open Work Orders';
  static const String techCompleted = 'Technically Completed';
  static const String closedWorkOrders = 'Closed Work Orders';
  static const String quickActions = 'Quick Actions';
  static const String recentActivity = 'Recent Activity';

  // ─── Navigation ───────────────────────────────────────────────────
  static const String notifications = 'Notifications';
  static const String workOrders = 'Work Orders';
  static const String notificationHistory = 'Notification History';
  static const String workOrderHistory = 'Work Order History';
  static const String notificationDetails = 'Notification Details';
  static const String workOrderDetails = 'Work Order Details';

  // ─── Common ───────────────────────────────────────────────────────
  static const String search = 'Search...';
  static const String noData = 'No Data Available';
  static const String noDataSubtitle = 'Pull down to refresh';
  static const String retry = 'Retry';
  static const String loading = 'Loading...';
  static const String error = 'Something went wrong';
  static const String logout = 'Logout';
  static const String logoutConfirm = 'Are you sure you want to logout?';
  static const String cancel = 'Cancel';
  static const String confirm = 'Confirm';
  static const String pullToRefresh = 'Pull to refresh';
  static const String refreshing = 'Refreshing...';

  // ─── Status Labels ────────────────────────────────────────────────
  static const String statusOpen = 'Open';
  static const String statusProcessed = 'Processed';
  static const String statusTechCompleted = 'Technically Completed';
  static const String statusClosed = 'Closed';

  // ─── Priority Labels ──────────────────────────────────────────────
  static const String priorityHigh = 'High';
  static const String priorityMedium = 'Medium';
  static const String priorityLow = 'Low';
}
