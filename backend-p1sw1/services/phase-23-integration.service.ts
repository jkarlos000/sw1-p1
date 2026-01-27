/**
 * Sprint 4 Phase 2 & 3 Integration Service
 * 
 * Integrates advanced theme generation, state management, pubspec optimization,
 * platform configurations, and setup guides into the main dart code generator
 */

import { ThemeGeneratorService } from './theme-generator.service';
import { PubspecGeneratorService } from './pubspec-generator.service';
import { PlatformConfigGeneratorService } from './platform-config-generator.service';
import { SetupGuideGeneratorService } from './setup-guide-generator.service';

export class Phase23IntegrationService {
  constructor(
    private themeGenerator: ThemeGeneratorService,
    private pubspecGenerator: PubspecGeneratorService,
    private platformConfigGenerator: PlatformConfigGeneratorService,
    private setupGuideGenerator: SetupGuideGeneratorService,
  ) {}

  /**
   * Integrate Phase 2 & 3 features into project generation
   */
  integratePhase23Features(
    projectName: string,
    version: string = '1.0.0',
    platforms: string[] = ['android', 'ios', 'web'],
    themeConfig?: any,
  ): Record<string, string> {
    const files: Record<string, string> = {};

    // Phase 2: Advanced Theme & Styling
    files['lib/theme/app_theme.dart'] = this.themeGenerator.generateAdvancedTheme(
      themeConfig || { primaryColor: '#2196F3', secondaryColor: '#FF5722' }
    );

    files['lib/theme/animations.dart'] = this.themeGenerator.generateAnimationsFile();
    files['lib/theme/color_constants.dart'] = this.themeGenerator.generateColorConstantsFile(
      themeConfig || { primaryColor: '#2196F3' }
    );

    // Phase 3: Project Setup & Configuration
    files['pubspec.yaml'] = this.pubspecGenerator.generateCompletePubspec(
      projectName,
      version,
      [],
      platforms,
    );

    // Platform-specific configurations
    if (platforms.includes('android')) {
      const androidConfigs = this.platformConfigGenerator.generateAndroidConfigs(
        projectName,
        `com.example.${projectName.toLowerCase().replace(/\s+/g, '_')}`,
      );
      Object.assign(files, androidConfigs);
    }

    if (platforms.includes('ios')) {
      const iosConfigs = this.platformConfigGenerator.generateIOSConfigs(
        projectName,
        `com.example.${projectName.toLowerCase().replace(/\s+/g, '.')}`,
      );
      Object.assign(files, iosConfigs);
    }

    if (platforms.includes('web')) {
      const webConfigs = this.platformConfigGenerator.generateWebConfigs(projectName);
      Object.assign(files, webConfigs);
    }

    if (platforms.includes('windows')) {
      const windowsConfigs = this.platformConfigGenerator.generateWindowsConfigs(
        projectName,
        `com.example.${projectName.toLowerCase().replace(/\s+/g, '_')}`,
      );
      Object.assign(files, windowsConfigs);
    }

    if (platforms.includes('macos')) {
      const macosConfigs = this.platformConfigGenerator.generateMacOSConfigs(
        projectName,
        `com.example.${projectName.toLowerCase().replace(/\s+/g, '.')}`,
      );
      Object.assign(files, macosConfigs);
    }

    if (platforms.includes('linux')) {
      const linuxConfigs = this.platformConfigGenerator.generateLinuxConfigs(projectName);
      Object.assign(files, linuxConfigs);
    }

    // Setup Guides
    files['SETUP.md'] = this.setupGuideGenerator.generateCompleteSetupGuide(
      projectName,
      platforms,
    );
    files['QUICK_START.md'] = this.setupGuideGenerator.generateQuickStart(projectName);

    // Platform-specific guides
    platforms.forEach((platform) => {
      files[`docs/SETUP_${platform.toUpperCase()}.md`] = 
        this.setupGuideGenerator.generatePlatformGuide(platform, projectName);
    });

    return files;
  }

  /**
   * Generate complete state management structure
   */
  generateStateManagementStructure(
    projectName: string,
    stateManagementLibrary: 'getx' | 'provider' | 'riverpod' = 'getx',
  ): Record<string, string> {
    switch (stateManagementLibrary) {
      case 'getx':
        return this.generateGetXStructure(projectName);
      case 'provider':
        return this.generateProviderStructure(projectName);
      case 'riverpod':
        return this.generateRiverpodStructure(projectName);
      default:
        return this.generateGetXStructure(projectName);
    }
  }

  /**
   * Generate GetX state management structure
   */
  private generateGetXStructure(projectName: string): Record<string, string> {
    return {
      'lib/app/modules/home/controllers/home_controller.dart': `
import 'package:get/get.dart';

class HomeController extends GetxController {
  final isLoading = false.obs;
  final itemCount = 0.obs;

  @override
  void onInit() {
    super.onInit();
    loadData();
  }

  Future<void> loadData() async {
    isLoading.value = true;
    try {
      // Load data here
      itemCount.value = 10;
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }
}
`,

      'lib/app/modules/home/bindings/home_binding.dart': `
import 'package:get/get.dart';
import '../controllers/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(
      () => HomeController(),
    );
  }
}
`,

      'lib/app/routes/app_pages.dart': `
import 'package:get/get.dart';
import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';

abstract class Routes {
  static const HOME = _Paths.HOME;
  static const _Paths _paths = _Paths();
}

abstract class _Paths {
  static const String HOME = '/home';
}

class AppPages {
  AppPages._();

  static final routes = [
    GetPage(
      name: Routes.HOME,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
  ];
}
`,

      'lib/app/modules/home/views/home_view.dart': `
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: Obx(
        () => controller.isLoading.value
            ? const Center(child: CircularProgressIndicator())
            : Center(
                child: Text('Items: \${controller.itemCount.value}'),
              ),
      ),
    );
  }
}
`,
    };
  }

  /**
   * Generate Provider state management structure
   */
  private generateProviderStructure(projectName: string): Record<string, string> {
    return {
      'lib/providers/home_provider.dart': `
import 'package:flutter_riverpod/flutter_riverpod.dart';

final homeCounterProvider = StateNotifierProvider<HomeCounter, int>((ref) {
  return HomeCounter();
});

class HomeCounter extends StateNotifier<int> {
  HomeCounter() : super(0);

  void increment() => state++;
  void decrement() => state--;
}
`,

      'lib/screens/home_screen.dart': `
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/home_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(homeCounterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: Center(
        child: Text('Count: \$count'),
      ),
    );
  }
}
`,
    };
  }

  /**
   * Generate Riverpod state management structure
   */
  private generateRiverpodStructure(projectName: string): Record<string, string> {
    return {
      'lib/riverpod/providers.dart': `
import 'package:riverpod/riverpod.dart';

final counterProvider = StateProvider<int>((ref) => 0);

final counterPlusTwoProvider = Provider<int>((ref) {
  return ref.watch(counterProvider) + 2;
});
`,

      'lib/screens/home_screen.dart': `
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../riverpod/providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Count: \${count.state}'),
            ElevatedButton(
              onPressed: () => count.state++,
              child: const Text('Increment'),
            ),
          ],
        ),
      ),
    );
  }
}
`,
    };
  }

  /**
   * Generate navigation patterns for GetX
   */
  generateNavigationPatterns(): Record<string, string> {
    return {
      'lib/app/routes/app_navigation.dart': `
import 'package:get/get.dart';

class AppNavigation {
  /// Navigate to named route
  static void navigateTo(String routeName, {dynamic arguments}) {
    Get.toNamed(routeName, arguments: arguments);
  }

  /// Navigate with replacement
  static void navigateToReplacement(String routeName, {dynamic arguments}) {
    Get.offNamed(routeName, arguments: arguments);
  }

  /// Navigate and clear stack
  static void navigateClear(String routeName, {dynamic arguments}) {
    Get.offAllNamed(routeName, arguments: arguments);
  }

  /// Go back
  static void back({dynamic result}) {
    Get.back(result: result);
  }

  /// Close specific number of pages
  static void closePages(int count) {
    for (int i = 0; i < count; i++) {
      Get.back();
    }
  }

  /// Show snackbar
  static void showSnackbar(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 3),
    );
  }

  /// Show dialog
  static Future<dynamic> showDialog(
    String title,
    String message, {
    String? confirmText,
    String? cancelText,
  }) {
    return Get.dialog(
      AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text(cancelText ?? 'Cancel'),
          ),
          TextButton(
            onPressed: () => Get.back(result: true),
            child: Text(confirmText ?? 'Confirm'),
          ),
        ],
      ),
    );
  }
}
`,

      'lib/app/routes/app_bindings.dart': `
import 'package:get/get.dart';

class AppBindings extends Bindings {
  @override
  void dependencies() {
    // Initialize global services here
    // Get.put(ApiService());
    // Get.put(StorageService());
  }
}
`,
    };
  }

  /**
   * Validate Phase 2 & 3 implementation
   */
  validatePhase23Implementation(files: Record<string, string>): string[] {
    const errors: string[] = [];

    // Check for essential files
    const requiredFiles = [
      'pubspec.yaml',
      'lib/theme/app_theme.dart',
      'lib/theme/animations.dart',
      'lib/theme/color_constants.dart',
      'SETUP.md',
      'QUICK_START.md',
    ];

    requiredFiles.forEach((file) => {
      if (!files[file]) {
        errors.push(`Missing critical file: ${file}`);
      }
    });

    // Validate pubspec.yaml content
    const pubspec = files['pubspec.yaml'];
    if (pubspec) {
      if (!pubspec.includes('name:')) {
        errors.push('pubspec.yaml missing project name');
      }
      if (!pubspec.includes('flutter:')) {
        errors.push('pubspec.yaml missing flutter section');
      }
    }

    return errors;
  }
}
