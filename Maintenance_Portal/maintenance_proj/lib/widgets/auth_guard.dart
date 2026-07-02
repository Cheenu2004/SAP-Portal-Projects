import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maintenance_proj/providers/auth_provider.dart';
import 'package:maintenance_proj/routes/app_routes.dart';

class AuthGuard extends StatelessWidget {
  final Widget child;

  const AuthGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AuthProvider>().isLoggedIn;

    if (!isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final currentRoute = ModalRoute.of(context)?.settings.name;
        if (currentRoute != AppRoutes.login) {
          Navigator.of(context).pushNamedAndRemoveUntil(
            AppRoutes.login,
            (route) => false,
          );
        }
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return child;
  }
}
