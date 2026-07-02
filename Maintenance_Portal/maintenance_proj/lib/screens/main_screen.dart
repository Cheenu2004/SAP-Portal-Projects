import 'package:flutter/material.dart';
import 'package:maintenance_proj/constants/app_colors.dart';
import 'package:maintenance_proj/screens/dashboard_screen.dart';
import 'package:maintenance_proj/screens/notifications_screen.dart';
import 'package:maintenance_proj/screens/work_orders_screen.dart';
import 'package:maintenance_proj/screens/notification_history_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const WorkOrdersScreen(),
    const NotificationsScreen(),
    const NotificationHistoryScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.scaffoldBackground,
          border: Border(
            top: BorderSide(
              color: AppColors.cardBorder.withOpacity(0.1),
              width: 1,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          backgroundColor: AppColors.scaffoldBackground,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.textOnBackground,
          unselectedItemColor: AppColors.textSecondary,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_rounded),
              label: 'Work Orders',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_rounded),
              label: 'Notifications',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history_rounded),
              label: 'History',
            ),
          ],
        ),
      ),
    );
  }
}
