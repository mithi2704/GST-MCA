class AppConfig {
  /// Update this value to point to your backend REST API base URL.
  static const String apiBaseUrl = String.fromEnvironment(
    /*'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api',*/
    
    /*'API_BASE_URL',
    defaultValue: 'https://team-management-intern-s-pzly.vercel.app/api',*/

 'API_BASE_URL',
    defaultValue: 'https://gst-mca-backend.onrender.com/api',
  );
}
