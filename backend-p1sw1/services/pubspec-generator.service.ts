/**
 * Pubspec.yaml Generator Service (Sprint 4 - Phase 3)
 * 
 * Generates optimized pubspec.yaml files with platform-specific configurations,
 * dependency management, and build configurations
 */

import { ProjectDependency, PubspecConfig } from '../models/dart-generation.models';

export class PubspecGeneratorService {
  /**
   * Generate complete pubspec.yaml with optimized dependencies
   */
  generateOptimizedPubspec(
    projectName: string,
    version: string = '1.0.0',
    description: string = 'A new Flutter application',
    customDependencies: ProjectDependency[] = []
  ): string {
    const dependencies = this.getDefaultDependencies();
    const devDependencies = this.getDefaultDevDependencies();
    const customDepMap: Record<string, string> = {};

    // Add custom dependencies
    customDependencies.forEach(dep => {
      if (dep.isDev) {
        devDependencies[dep.package] = dep.version || '^latest';
      } else {
        dependencies[dep.package] = dep.version || '^latest';
      }
    });

    return `name: ${projectName}
description: ${description}
version: ${version}+1

environment:
  sdk: '>=${this.getMinDartVersion()}'
  flutter: '>=${this.getMinFlutterVersion()}'

dependencies:
  flutter:
    sdk: flutter
${this.formatDependencies(dependencies)}

dev_dependencies:
  flutter_test:
    sdk: flutter
${this.formatDependencies(devDependencies)}

flutter:
  uses_material_design: true
  
  assets:
    - assets/
    - assets/images/
    - assets/icons/
    - assets/fonts/
  
  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700
        - asset: assets/fonts/Roboto-Italic.ttf
          style: italic

# Platform-specific configurations
dev_dependencies:
  flutter_lints: ^2.0.0
  mockito: ^5.3.0
  integration_test:
    sdk: flutter
`;
  }

  /**
   * Generate Android build configuration
   */
  generateAndroidConfig(
    minSdkVersion: number = 21,
    targetSdkVersion: number = 33,
    compileSdkVersion: number = 33,
    appName: string = 'Flutter App'
  ): string {
    return `android:
  compileSdkVersion: ${compileSdkVersion}
  minSdkVersion: ${minSdkVersion}
  targetSdkVersion: ${targetSdkVersion}
  
  gradle:
    wrapper:
      gradle-version: "7.4"
  
  plugins:
    - com.android.application
    - kotlin-android
    - kotlin-kapt

app_name: ${appName}`;
  }

  /**
   * Generate iOS build configuration
   */
  generateIOSConfig(
    minDeploymentVersion: string = '11.0',
    appName: string = 'Flutter App'
  ): string {
    return `ios:
  deploymentTarget: ${minDeploymentVersion}
  
  podfile: ios/Podfile
  
  pod_config_source:
    - git: https://github.com/CocoaPods/Specs.git

app_name: ${appName}`;
  }

  /**
   * Generate Web build configuration
   */
  generateWebConfig(title: string = 'Flutter App'): string {
    return `web:
  title: ${title}
  
  manifest:
    name: ${title}
    short_name: App
    start_url: /
    display: standalone
    theme_color: '#2196F3'
    background_color: '#FFFFFF'
    
    icons:
      - src: web/icons/icon_192.png
        sizes: 192x192
      - src: web/icons/icon_512.png
        sizes: 512x512`;
  }

  /**
   * Generate Windows build configuration
   */
  generateWindowsConfig(appName: string = 'Flutter App'): string {
    return `windows:
  binary_name: ${appName.toLowerCase().replace(/\s+/g, '_')}
  
  dart_defines:
    - FLUTTER_WEB_AUTO_DETECT=true
`;
  }

  /**
   * Generate macOS build configuration
   */
  generateMacOSConfig(
    minDeploymentVersion: string = '10.13',
    appName: string = 'Flutter App'
  ): string {
    return `macos:
  minimum_os_version: ${minDeploymentVersion}
  app_name: ${appName}
  
  podfile: macos/Podfile`;
  }

  /**
   * Generate Linux build configuration
   */
  generateLinuxConfig(appName: string = 'Flutter App'): string {
    return `linux:
  app_name: ${appName}
  binary_name: ${appName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Generate environment configuration
   */
  generateEnvironmentConfig(): string {
    return `# Environment variables for different build flavors

flavor_production:
  dart_defines:
    - ENVIRONMENT=production
    - API_BASE_URL=https://api.production.com
    - ENABLE_ANALYTICS=true

flavor_staging:
  dart_defines:
    - ENVIRONMENT=staging
    - API_BASE_URL=https://api.staging.com
    - ENABLE_ANALYTICS=true

flavor_development:
  dart_defines:
    - ENVIRONMENT=development
    - API_BASE_URL=http://localhost:3000
    - ENABLE_ANALYTICS=false`;
  }

  /**
   * Get default dependencies
   */
  private getDefaultDependencies(): Record<string, string> {
    return {
      'cupertino_icons': '^1.0.0',
      'provider': '^6.0.0',
      'http': '^1.0.0',
      'intl': '^0.18.0',
      'shared_preferences': '^2.0.0',
      'get': '^4.6.0',
      'google_fonts': '^4.0.0',
      'connectivity_plus': '^3.0.0',
      'permission_handler': '^11.0.0',
    };
  }

  /**
   * Get default dev dependencies
   */
  private getDefaultDevDependencies(): Record<string, string> {
    return {
      'flutter_lints': '^2.0.0',
      'mockito': '^5.3.0',
      'build_runner': '^2.3.0',
      'json_serializable': '^6.0.0',
    };
  }

  /**
   * Format dependencies for pubspec
   */
  private formatDependencies(deps: Record<string, string>): string {
    return Object.entries(deps)
      .map(([name, version]) => `  ${name}: ${version}`)
      .join('\n');
  }

  /**
   * Get minimum Dart version
   */
  private getMinDartVersion(): string {
    return '3.0.0';
  }

  /**
   * Get minimum Flutter version
   */
  private getMinFlutterVersion(): string {
    return '3.10.0';
  }

  /**
   * Add custom dependency
   */
  addDependency(
    name: string,
    version: string = '^latest',
    isDev: boolean = false
  ): ProjectDependency {
    return {
      package: name,
      version,
      isDev,
    };
  }

  /**
   * Popular plugin recommendations
   */
  getPopularPlugins(): Record<string, string> {
    return {
      // State Management
      'provider': '^6.0.0',
      'getx': '^4.6.0',
      'riverpod': '^2.1.0',
      'bloc': '^8.1.0',

      // API & Networking
      'http': '^1.0.0',
      'dio': '^5.0.0',
      'chopper': '^6.1.0',

      // Storage
      'shared_preferences': '^2.0.0',
      'sqflite': '^2.2.0',
      'hive': '^2.2.0',
      'realm': '^0.14.0',

      // UI/Components
      'google_fonts': '^4.0.0',
      'flutter_svg': '^2.0.0',
      'cached_network_image': '^3.2.0',
      'shimmer': '^2.0.0',

      // Navigation
      'go_router': '^7.0.0',
      'auto_route': '^5.1.0',

      // Utilities
      'intl': '^0.18.0',
      'connectivity_plus': '^3.0.0',
      'permission_handler': '^11.0.0',
      'path_provider': '^2.0.0',

      // Analytics & Logging
      'firebase_analytics': '^10.0.0',
      'firebase_crashlytics': '^11.0.0',
      'logger': '^1.3.0',

      // Testing
      'mocktail': '^0.3.0',
      'fake_async': '^1.3.0',
    };
  }

  /**
   * Get Flutter plugins for specific features
   */
  getPluginsForFeature(feature: string): Record<string, string> {
    const featureMap: Record<string, Record<string, string>> = {
      authentication: {
        'firebase_auth': '^4.0.0',
        'google_sign_in': '^6.0.0',
        'flutter_facebook_login': '^4.0.0',
      },
      geolocation: {
        'geolocator': '^9.0.0',
        'google_maps_flutter': '^2.2.0',
        'location': '^4.4.0',
      },
      camera: {
        'camera': '^0.10.0',
        'image_picker': '^0.8.0',
        'flutter_camera_kit': '^1.0.0',
      },
      notifications: {
        'firebase_messaging': '^14.0.0',
        'flutter_local_notifications': '^15.0.0',
      },
      payments: {
        'stripe_sdk': '^12.0.0',
        'pay': '^2.0.0',
      },
      social_media: {
        'share_plus': '^6.0.0',
        'url_launcher': '^6.1.0',
      },
    };

    return featureMap[feature] || {};
  }

  /**
   * Validate pubspec content
   */
  validatePubspec(content: string): string[] {
    const errors: string[] = [];

    if (!content.includes('name:')) {
      errors.push('Missing project name');
    }

    if (!content.includes('version:')) {
      errors.push('Missing version');
    }

    if (!content.includes('flutter:')) {
      errors.push('Missing flutter section');
    }

    if (!content.includes('dependencies:')) {
      errors.push('Missing dependencies section');
    }

    return errors;
  }

  /**
   * Generate complete pubspec file with all platform configs
   */
  generateCompletePubspec(
    projectName: string,
    version: string = '1.0.0',
    customDependencies: ProjectDependency[] = [],
    platforms: string[] = ['android', 'ios', 'web']
  ): string {
    let content = this.generateOptimizedPubspec(projectName, version, '', customDependencies);

    content += '\n\n# Platform-specific configurations\n';

    if (platforms.includes('android')) {
      content += '\n# Android Configuration\n';
      content += this.generateAndroidConfig();
    }

    if (platforms.includes('ios')) {
      content += '\n\n# iOS Configuration\n';
      content += this.generateIOSConfig();
    }

    if (platforms.includes('web')) {
      content += '\n\n# Web Configuration\n';
      content += this.generateWebConfig();
    }

    if (platforms.includes('windows')) {
      content += '\n\n# Windows Configuration\n';
      content += this.generateWindowsConfig();
    }

    if (platforms.includes('macos')) {
      content += '\n\n# macOS Configuration\n';
      content += this.generateMacOSConfig();
    }

    if (platforms.includes('linux')) {
      content += '\n\n# Linux Configuration\n';
      content += this.generateLinuxConfig();
    }

    return content;
  }
}
