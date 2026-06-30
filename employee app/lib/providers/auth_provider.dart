import 'package:flutter/material.dart';
import '../models/auth_user.dart';
import '../services/auth_service.dart';

/// The AuthProvider manages authentication state including login, logout, and session persistence.
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  AuthUser? _currentUser;
  String? _error;
  bool _isLoading = false;

  AuthProvider();

  // Getters
  AuthUser? get currentUser => _currentUser;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;

  /// Initializes the provider with a clean frontend state.
  Future<void> initializeAuth() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentUser = await _authService.getProfile();
    } catch (e) {
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Signs in with email and password using the auth service.
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (email.trim().isEmpty || password.isEmpty) {
      _error = 'Please provide valid credentials.';
      _isLoading = false;
      notifyListeners();
      return false;
    }

    try {
      final response = await _authService.login(email.trim(), password);
      _currentUser = response.user;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      final errMsg = e.toString().replaceAll('HttpException: ', '');
      if (errMsg == 'Invalid credentials' ||
          errMsg.toLowerCase().contains('credentials') ||
          errMsg.toLowerCase().contains('unauthorized')) {
        _error = 'wrong password or incorrect email id';
      } else {
        _error = errMsg;
      }
      _isLoading = false;
      _currentUser = null;
      notifyListeners();
      return false;
    }
  }

  /// Signs out the current user.
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logout();
    } catch (_) {
      // Allow local logout even if network fails
    } finally {
      _currentUser = null;
      _error = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clears the error message.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
