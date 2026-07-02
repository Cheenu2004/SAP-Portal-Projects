import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/constants/index.dart';
import 'package:maintenance_proj/providers/index.dart';
import 'package:maintenance_proj/routes/app_routes.dart';
import 'package:maintenance_proj/services/index.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final odataService = ODataService();
  final authProvider = AuthProvider(odataService: odataService);
  await authProvider.initializeAuth();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(
          create: (_) => NotificationsProvider(odataService: odataService),
        ),
        ChangeNotifierProvider(
          create: (_) => WorkOrdersProvider(odataService: odataService),
        ),
        ChangeNotifierProvider(
          create: (_) =>
              NotificationHistoryProvider(odataService: odataService),
        ),
        ChangeNotifierProvider(
          create: (_) => WorkOrderHistoryProvider(odataService: odataService),
        ),
      ],
      child: const MaintenanceApp(),
    ),
  );
}

class MaintenanceApp extends StatelessWidget {
  const MaintenanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return MaterialApp(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: authProvider.isLoggedIn
          ? AppRoutes.dashboard
          : AppRoutes.login,
      routes: AppRoutes.getRoutes(),
    );
  }
}
