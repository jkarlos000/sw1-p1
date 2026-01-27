/**
 * Advanced Theme Generator Service (Sprint 4 - Phase 2)
 * 
 * Generates production-ready Material Design 3 themes with animations,
 * color schemes, typography, and platform-specific customizations
 */

import {
  ThemeConfig,
  ScreenStyling,
  TextStyle,
  BorderConfig,
  EdgeInsetsConfig,
  ShapeConfig
} from '../models/dart-generation.models';

export class ThemeGeneratorService {
  /**
   * Generate complete theme with Material 3 design
   */
  generateAdvancedTheme(styling: ScreenStyling = {}): string {
    const primaryColor = styling.primaryColor || '#2196F3';
    const accentColor = styling.accentColor || '#FF4081';
    const backgroundColor = styling.backgroundColor || '#FFFFFF';
    const surfaceColor = styling.backgroundColor || '#F5F5F5';

    return `class AppTheme {
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: Color(0xFF${this.hexToRGB(primaryColor)}),
    primarySwatch: _createMaterialColor(Color(0xFF${this.hexToRGB(primaryColor)})),
    secondaryHeaderColor: Color(0xFF${this.hexToRGB(accentColor)}),
    scaffoldBackgroundColor: Color(0xFF${this.hexToRGB(backgroundColor)}),
    surfaceColor: Color(0xFF${this.hexToRGB(surfaceColor)}),
    
    appBarTheme: AppBarTheme(
      backgroundColor: Color(0xFF${this.hexToRGB(primaryColor)}),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF${this.hexToRGB(backgroundColor)}),
      selectedItemColor: Color(0xFF${this.hexToRGB(primaryColor)}),
      unselectedItemColor: Colors.grey[600],
      elevation: 8,
    ),
    
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Color(0xFF${this.hexToRGB(primaryColor)}),
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Color(0xFF${this.hexToRGB(primaryColor)}),
        side: BorderSide(
          color: Color(0xFF${this.hexToRGB(primaryColor)}),
          width: 2,
        ),
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Color(0xFF${this.hexToRGB(primaryColor)}),
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        textStyle: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Colors.grey[300] ?? Colors.grey,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Colors.grey[300] ?? Colors.grey,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Color(0xFF${this.hexToRGB(primaryColor)}),
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Colors.red[400] ?? Colors.red,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Colors.red[400] ?? Colors.red,
          width: 2,
        ),
      ),
      labelStyle: TextStyle(
        color: Colors.grey[700],
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      hintStyle: TextStyle(
        color: Colors.grey[500],
        fontSize: 14,
      ),
      filled: true,
      fillColor: Colors.grey[50],
    ),
    
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
        height: 1.25,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
        height: 1.3,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
        height: 1.4,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.black87,
        height: 1.4,
      ),
      headlineSmall: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Colors.black87,
        height: 1.5,
      ),
      titleLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
        height: 1.5,
      ),
      titleMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
        height: 1.5,
      ),
      titleSmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
        height: 1.66,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: Colors.black87,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: Colors.black87,
        height: 1.43,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: Colors.black87,
        height: 1.33,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: Colors.black87,
        height: 1.43,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: Colors.black87,
        height: 1.33,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: Colors.black87,
        height: 1.45,
        letterSpacing: 0.5,
      ),
    ),
    
    colorScheme: ColorScheme.light(
      primary: Color(0xFF${this.hexToRGB(primaryColor)}),
      onPrimary: Colors.white,
      secondary: Color(0xFF${this.hexToRGB(accentColor)}),
      onSecondary: Colors.white,
      surface: Color(0xFF${this.hexToRGB(surfaceColor)}),
      onSurface: Colors.black87,
      background: Color(0xFF${this.hexToRGB(backgroundColor)}),
      onBackground: Colors.black87,
      error: Colors.red[400] ?? Colors.red,
      onError: Colors.white,
    ),
  );

  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: Color(0xFF${this.hexToRGB(this.lightenColor(this.hexToRGB(primaryColor), 0.2))}),
    scaffoldBackgroundColor: Color(0xFF121212),
    surfaceColor: Color(0xFF1E1E1E),
    appBarTheme: AppBarTheme(
      backgroundColor: Color(0xFF1F1F1F),
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: Colors.grey[700] ?? Colors.grey,
        ),
      ),
      filled: true,
      fillColor: Colors.grey[900],
    ),
  );

  static MaterialColor _createMaterialColor(Color color) {
    final int red = color.red;
    final int green = color.green;
    final int blue = color.blue;

    final Map<int, Color> shades = {
      50: Color.fromARGB(32, red, green, blue),
      100: Color.fromARGB(64, red, green, blue),
      200: Color.fromARGB(96, red, green, blue),
      300: Color.fromARGB(128, red, green, blue),
      400: Color.fromARGB(160, red, green, blue),
      500: Color.fromARGB(192, red, green, blue),
      600: Color.fromARGB(224, red, green, blue),
      700: color,
      800: Color.fromARGB(255, red, green, blue),
      900: Color.fromARGB(255, red ~/ 2, green ~/ 2, blue ~/ 2),
    };

    return MaterialColor(color.value, shades);
  }
}`;
  }

  /**
   * Generate animations file with common Flutter animations
   */
  generateAnimationsFile(): string {
    return `import 'package:flutter/material.dart';

/// Common animations for the application
class AppAnimations {
  /// Fade in animation
  static Future<void> fadeInAnimation(
    AnimationController controller, {
    Duration duration = const Duration(milliseconds: 300),
  }) async {
    controller.duration = duration;
    await controller.forward();
  }

  /// Slide up animation
  static Future<void> slideUpAnimation(
    AnimationController controller, {
    Duration duration = const Duration(milliseconds: 400),
  }) async {
    controller.duration = duration;
    await controller.forward();
  }

  /// Scale animation
  static Future<void> scaleAnimation(
    AnimationController controller, {
    Duration duration = const Duration(milliseconds: 300),
  }) async {
    controller.duration = duration;
    await controller.forward();
  }

  /// Bounce animation
  static Future<void> bounceAnimation(
    AnimationController controller, {
    Duration duration = const Duration(milliseconds: 500),
  }) async {
    controller.duration = duration;
    await controller.forward();
  }

  /// Rotate animation
  static Future<void> rotateAnimation(
    AnimationController controller, {
    Duration duration = const Duration(milliseconds: 600),
  }) async {
    controller.duration = duration;
    await controller.forward();
  }
}

/// Curved animations
class CurvedAnimations {
  static final easeInOut = Curves.easeInOut;
  static final easeOut = Curves.easeOut;
  static final easeIn = Curves.easeIn;
  static final bounceOut = Curves.bounceOut;
  static final elasticOut = Curves.elasticOut;
  static final fastOutSlowIn = Curves.fastOutSlowIn;
}

/// Custom fade transition
class FadeTransition extends StatelessWidget {
  final Widget child;
  final Animation<double> opacity;

  const FadeTransition({
    required this.child,
    required this.opacity,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity.value,
      child: child,
    );
  }
}

/// Custom slide transition
class SlideTransitionWidget extends StatelessWidget {
  final Widget child;
  final Animation<Offset> position;

  const SlideTransitionWidget({
    required this.child,
    required this.position,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: position,
      child: child,
    );
  }
}

/// Custom scale transition
class ScaleTransitionWidget extends StatelessWidget {
  final Widget child;
  final Animation<double> scale;

  const ScaleTransitionWidget({
    required this.child,
    required this.scale,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: scale,
      child: child,
    );
  }
}`;
  }

  /**
   * Generate color constants file
   */
  generateColorConstantsFile(styling: ScreenStyling): string {
    const primaryColor = styling.primaryColor || '#2196F3';
    const accentColor = styling.accentColor || '#FF4081';
    const backgroundColor = styling.backgroundColor || '#FFFFFF';
    const textColor = styling.textColor || '#000000';

    return `import 'package:flutter/material.dart';

/// Application color constants
class AppColors {
  // Primary colors
  static const Color primary = Color(0xFF${this.hexToRGB(primaryColor)});
  static const Color primaryLight = Color(0xFF${this.hexToRGB(this.lightenColor(this.hexToRGB(primaryColor), 0.3))}); 
  static const Color primaryDark = Color(0xFF${this.hexToRGB(this.darkenColor(this.hexToRGB(primaryColor), 0.3))}); 

  // Secondary colors
  static const Color secondary = Color(0xFF${this.hexToRGB(accentColor)});
  static const Color secondaryLight = Color(0xFF${this.hexToRGB(this.lightenColor(this.hexToRGB(accentColor), 0.3))}); 
  static const Color secondaryDark = Color(0xFF${this.hexToRGB(this.darkenColor(this.hexToRGB(accentColor), 0.3))}); 

  // Background colors
  static const Color background = Color(0xFF${this.hexToRGB(backgroundColor)});
  static const Color surface = Color(0xFFF5F5F5);
  static const Color surfaceVariant = Color(0xFFEEEEEE);

  // Text colors
  static const Color textPrimary = Color(0xFF${this.hexToRGB(textColor)});
  static const Color textSecondary = Color(0xFF757575);
  static const Color textTertiary = Color(0xFF9E9E9E);
  static const Color textHint = Color(0xFFBDBDBD);

  // Semantic colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFC107);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);

  // Neutral colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color greyLight = Color(0xFFEEEEEE);
  static const Color greyDark = Color(0xFF616161);

  // Gradient colors
  static const Gradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryLight],
  );

  static const Gradient secondaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondary, secondaryLight],
  );
}`;
  }

  /**
   * Convert hex to RGB
   */
  private hexToRGB(hex: string): string {
    const cleaned = hex.replace(/^#/, '');
    return cleaned.padEnd(6, '0').toUpperCase();
  }

  /**
   * Lighten color (helper)
   */
  private lightenColor(rgb: string, amount: number): string {
    const int = parseInt(rgb, 16);
    const r = Math.min(255, (int >> 16) + Math.floor(255 * amount));
    const g = Math.min(255, ((int >> 8) & 0x00FF) + Math.floor(255 * amount));
    const b = Math.min(255, (int & 0x0000FF) + Math.floor(255 * amount));
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /**
   * Darken color (helper)
   */
  private darkenColor(rgb: string, amount: number): string {
    const int = parseInt(rgb, 16);
    const r = Math.max(0, (int >> 16) - Math.floor(255 * amount));
    const g = Math.max(0, ((int >> 8) & 0x00FF) - Math.floor(255 * amount));
    const b = Math.max(0, (int & 0x0000FF) - Math.floor(255 * amount));
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /**
   * Validate color format
   */
  validateColorFormat(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Generate color palette from base color
   */
  generateColorPalette(baseColor: string): Record<string, string> {
    const base = this.hexToRGB(baseColor);
    return {
      '50': `#${this.lightenColor(base, 0.9)}`,
      '100': `#${this.lightenColor(base, 0.75)}`,
      '200': `#${this.lightenColor(base, 0.6)}`,
      '300': `#${this.lightenColor(base, 0.45)}`,
      '400': `#${this.lightenColor(base, 0.3)}`,
      '500': baseColor,
      '600': `#${this.darkenColor(base, 0.1)}`,
      '700': `#${this.darkenColor(base, 0.2)}`,
      '800': `#${this.darkenColor(base, 0.3)}`,
      '900': `#${this.darkenColor(base, 0.4)}`,
    };
  }
}
