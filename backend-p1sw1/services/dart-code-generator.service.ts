/**
 * Dart Code Generator Service
 * 
 * Generates production-ready Flutter/Dart code from component definitions
 * Supports StatefulWidget generation, state management, and responsive layouts
 */
export class DartCodeGeneratorService {
  /**
   * Component to Flutter Widget mapping
   */
  private componentMapping = {
    'TextField': {
      widget: 'TextField',
      imports: ['material.dart'],
      stateRequired: true,
      controllerRequired: true,
      controller: (label: string) => `_${this.toCamelCase(label)}Controller`,
      decoration: (label: string) => 
        `InputDecoration(\n` +
        `  labelText: '${label}',\n` +
        `  border: OutlineInputBorder(),\n` +
        `)`
    },
    'Button': {
      widget: 'ElevatedButton',
      imports: ['material.dart'],
      stateRequired: false,
      onPressed: true,
      style: 'ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12))'
    },
    'ElevatedButton': {
      widget: 'ElevatedButton',
      imports: ['material.dart'],
      stateRequired: false,
      onPressed: true,
      style: 'ElevatedButton.styleFrom()'
    },
    'TextButton': {
      widget: 'TextButton',
      imports: ['material.dart'],
      stateRequired: false,
      onPressed: true
    },
    'OutlinedButton': {
      widget: 'OutlinedButton',
      imports: ['material.dart'],
      stateRequired: false,
      onPressed: true
    },
    'Text': {
      widget: 'Text',
      imports: ['material.dart'],
      stateRequired: false
    },
    'ListView': {
      widget: 'ListView.builder',
      imports: ['material.dart'],
      scrollable: true,
      itemCount: true
    },
    'GridView': {
      widget: 'GridView.count',
      imports: ['material.dart'],
      scrollable: true,
      crossAxisCount: 2
    },
    'AppBar': {
      widget: 'AppBar',
      imports: ['material.dart'],
      scaffold: true
    },
    'Icon': {
      widget: 'Icon',
      imports: ['material.dart'],
      stateRequired: false
    },
    'Container': {
      widget: 'Container',
      imports: ['material.dart'],
      stateRequired: false
    },
    'Row': {
      widget: 'Row',
      imports: ['material.dart'],
      stateRequired: false
    },
    'Column': {
      widget: 'Column',
      imports: ['material.dart'],
      stateRequired: false
    }
  };

  /**
   * Generate complete Flutter project structure
   * @param screens - Array of screen definitions
   * @returns Map of file paths and content
   */
  async generateProjectStructure(screens: any[]): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Generate main.dart
    files.set('lib/main.dart', this.generateMainDart(screens));

    // Generate theme
    files.set('lib/theme/app_theme.dart', this.generateTheme());

    // Generate screen files with duplicate name handling
    const screenNameCount = new Map<string, number>();
    for (const screen of screens) {
      let screenName = this.toSnakeCase(screen.className);
      
      // Handle duplicate names by appending a number
      if (screenNameCount.has(screenName)) {
        screenNameCount.set(screenName, (screenNameCount.get(screenName) || 0) + 1);
        screenName = `${screenName}_${screenNameCount.get(screenName)}`;
      } else {
        screenNameCount.set(screenName, 1);
      }
      
      const screenPath = `lib/screens/${screenName}.dart`;
      const screenCode = this.generateScreenFile(screen);
      files.set(screenPath, screenCode);
    }

    // Generate pubspec.yaml
    files.set('pubspec.yaml', this.generatePubspec(screens));

    // Generate README
    files.set('README.md', this.generateReadme(screens));

    // Generate .gitignore
    files.set('.gitignore', this.generateGitignore());

    // Generate analysis_options.yaml
    files.set('analysis_options.yaml', this.generateAnalysisOptions());

    return files;
  }

  /**
   * Generate a screen file with StatefulWidget
   */
  private generateScreenFile(screen: any): string {
    const imports = this.collectImports(screen);
    const className = screen.className || 'Screen';
    const stateClass = `_${className}State`;

    let code = '';

    // Imports
    code += `import 'package:flutter/material.dart';\n`;
    if (imports.size > 0) {
      imports.forEach(imp => {
        if (imp !== 'material.dart') {
          code += `import 'package:flutter/${imp}';\n`;
        }
      });
    }
    code += `\n`;

    // StatefulWidget
    code += `/// ${className} Screen\n`;
    code += `class ${className} extends StatefulWidget {\n`;
    code += `  const ${className}({Key? key}) : super(key: key);\n\n`;
    code += `  @override\n`;
    code += `  State<${className}> createState() => ${stateClass}();\n`;
    code += `}\n\n`;

    // State class
    code += `/// State class for ${className}\n`;
    code += `class ${stateClass} extends State<${className}> {\n`;

    // Generate controllers for TextFields
    const controllers = this.generateControllers(screen);
    if (controllers) {
      code += controllers + '\n';
    }

    // initState
    code += `  @override\n`;
    code += `  void initState() {\n`;
    code += `    super.initState();\n`;
    const initCode = this.generateInitState(screen);
    if (initCode) {
      code += initCode;
    }
    code += `  }\n\n`;

    // dispose
    code += `  @override\n`;
    code += `  void dispose() {\n`;
    const disposeCode = this.generateDispose(screen);
    if (disposeCode) {
      code += disposeCode;
    }
    code += `    super.dispose();\n`;
    code += `  }\n\n`;

    // build method
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += this.generateBuildMethod(screen);
    code += `  }\n`;

    code += `}\n`;

    return this.formatDartCode(code);
  }

  /**
   * Generate controllers for TextField components
   */
  private generateControllers(screen: any): string {
    let code = '';
    const textFields = screen.components?.filter((c: any) => c.type === 'TextField') || [];

    if (textFields.length === 0) return '';

    for (const field of textFields) {
      const controllerName = this.toControllerName(field.label);
      code += `  late TextEditingController ${controllerName};\n`;
    }

    return code;
  }

  /**
   * Generate initState method
   */
  private generateInitState(screen: any): string {
    let code = '';
    const textFields = screen.components?.filter((c: any) => c.type === 'TextField') || [];

    for (const field of textFields) {
      const controllerName = this.toControllerName(field.label);
      code += `    ${controllerName} = TextEditingController();\n`;
    }

    return code;
  }

  /**
   * Generate dispose method
   */
  private generateDispose(screen: any): string {
    let code = '';
    const textFields = screen.components?.filter((c: any) => c.type === 'TextField') || [];

    for (const field of textFields) {
      const controllerName = this.toControllerName(field.label);
      code += `    ${controllerName}.dispose();\n`;
    }

    return code;
  }

  /**
   * Generate build method with layout
   */
  private generateBuildMethod(screen: any): string {
    let code = '';

    // Scaffold
    code += `    return Scaffold(\n`;
    code += `      appBar: AppBar(\n`;
    code += `        title: const Text('${screen.className || 'Screen'}'),\n`;
    code += `      ),\n`;
    code += `      body: SingleChildScrollView(\n`;
    code += `        child: Padding(\n`;
    code += `          padding: const EdgeInsets.all(16.0),\n`;
    code += `          child: Column(\n`;
    code += `            crossAxisAlignment: CrossAxisAlignment.stretch,\n`;
    code += `            children: [\n`;

    // Add components
    if (screen.components && screen.components.length > 0) {
      for (let i = 0; i < screen.components.length; i++) {
        const component = screen.components[i];
        code += this.generateComponentWidget(component);

        // Add spacing between components
        if (i < screen.components.length - 1) {
          code += `              const SizedBox(height: 16),\n`;
        }
      }
    }

    code += `            ],\n`;
    code += `          ),\n`;
    code += `        ),\n`;
    code += `      ),\n`;
    code += `    );\n`;

    return code;
  }

  /**
   * Generate individual component widget
   */
  private generateComponentWidget(component: any): string {
    const type = component.type || 'Container';
    const label = component.label || 'Component';

    let code = '';

    switch (type) {
      case 'TextField':
        code += `              TextField(\n`;
        code += `                controller: ${this.toControllerName(label)},\n`;
        code += `                decoration: InputDecoration(\n`;
        code += `                  labelText: '${label}',\n`;
        code += `                  border: OutlineInputBorder(),\n`;
        code += `                ),\n`;
        code += `              ),\n`;
        break;

      case 'Button':
      case 'ElevatedButton':
        code += `              ElevatedButton(\n`;
        code += `                onPressed: () {\n`;
        code += `                  // TODO: Implement ${label} action\n`;
        code += `                },\n`;
        code += `                child: Text('${label}'),\n`;
        code += `              ),\n`;
        break;

      case 'TextButton':
        code += `              TextButton(\n`;
        code += `                onPressed: () {\n`;
        code += `                  // TODO: Implement ${label} action\n`;
        code += `                },\n`;
        code += `                child: Text('${label}'),\n`;
        code += `              ),\n`;
        break;

      case 'OutlinedButton':
        code += `              OutlinedButton(\n`;
        code += `                onPressed: () {\n`;
        code += `                  // TODO: Implement ${label} action\n`;
        code += `                },\n`;
        code += `                child: Text('${label}'),\n`;
        code += `              ),\n`;
        break;

      case 'Text':
        code += `              Text(\n`;
        code += `                '${label}',\n`;
        code += `                style: Theme.of(context).textTheme.headlineSmall,\n`;
        code += `              ),\n`;
        break;

      case 'Container':
        code += `              Container(\n`;
        code += `                padding: const EdgeInsets.all(16),\n`;
        code += `                decoration: BoxDecoration(\n`;
        code += `                  border: Border.all(color: Colors.grey),\n`;
        code += `                  borderRadius: BorderRadius.circular(8),\n`;
        code += `                ),\n`;
        code += `                child: Text('${label}'),\n`;
        code += `              ),\n`;
        break;

      default:
        code += `              Container(\n`;
        code += `                child: Text('${label}'),\n`;
        code += `              ),\n`;
    }

    return code;
  }

  /**
   * Generate main.dart entry point
   */
  private generateMainDart(screens: any[]): string {
    let code = '';

    code += `import 'package:flutter/material.dart';\n`;
    code += `import 'theme/app_theme.dart';\n`;

    // Import all screens
    for (const screen of screens) {
      const screenFile = this.toSnakeCase(screen.className);
      code += `import 'screens/${screenFile}.dart';\n`;
    }

    code += `\n`;
    code += `void main() => runApp(const MyApp());\n\n`;

    code += `class MyApp extends StatelessWidget {\n`;
    code += `  const MyApp({Key? key}) : super(key: key);\n\n`;
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return MaterialApp(\n`;
    code += `      title: 'Flutter Mockup',\n`;
    code += `      theme: AppTheme.lightTheme,\n`;
    code += `      home: const ${screens[0]?.className || 'Screen'}(),\n`;
    code += `      routes: {\n`;

    for (const screen of screens) {
      const route = this.toKebabCase(screen.className);
      code += `        '/${route}': (context) => const ${screen.className}(),\n`;
    }

    code += `      },\n`;
    code += `    );\n`;
    code += `  }\n`;
    code += `}\n`;

    return this.formatDartCode(code);
  }

  /**
   * Generate theme file
   */
  private generateTheme(): string {
    let code = '';

    code += `import 'package:flutter/material.dart';\n\n`;
    code += `class AppTheme {\n`;
    code += `  static const primaryColor = Color(0xFF2196F3);\n`;
    code += `  static const accentColor = Color(0xFFFF4081);\n\n`;

    code += `  static ThemeData get lightTheme {\n`;
    code += `    return ThemeData(\n`;
    code += `      primaryColor: primaryColor,\n`;
    code += `      primarySwatch: Colors.blue,\n`;
    code += `      useMaterial3: true,\n`;
    code += `      appBarTheme: const AppBarTheme(\n`;
    code += `        backgroundColor: primaryColor,\n`;
    code += `        elevation: 0,\n`;
    code += `        centerTitle: true,\n`;
    code += `      ),\n`;
    code += `      inputDecorationTheme: InputDecorationTheme(\n`;
    code += `        border: OutlineInputBorder(\n`;
    code += `          borderRadius: BorderRadius.circular(8),\n`;
    code += `        ),\n`;
    code += `        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),\n`;
    code += `      ),\n`;
    code += `      elevatedButtonTheme: ElevatedButtonThemeData(\n`;
    code += `        style: ElevatedButton.styleFrom(\n`;
    code += `          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),\n`;
    code += `          shape: RoundedRectangleBorder(\n`;
    code += `            borderRadius: BorderRadius.circular(8),\n`;
    code += `          ),\n`;
    code += `        ),\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n`;
    code += `}\n`;

    return this.formatDartCode(code);
  }

  /**
   * Generate pubspec.yaml
   */
  private generatePubspec(screens: any[]): string {
    let yaml = '';

    yaml += `name: flutter_mockup_project\n`;
    yaml += `description: Flutter app generated from visual mockup\n`;
    yaml += `publish_to: 'none'\n\n`;

    yaml += `version: 1.0.0+1\n\n`;

    yaml += `environment:\n`;
    yaml += `  sdk: '>=3.0.0 <4.0.0'\n\n`;

    yaml += `dependencies:\n`;
    yaml += `  flutter:\n`;
    yaml += `    sdk: flutter\n`;
    yaml += `  provider: ^6.0.0\n`;
    yaml += `  http: ^1.1.0\n`;
    yaml += `  intl: ^0.19.0\n\n`;

    yaml += `dev_dependencies:\n`;
    yaml += `  flutter_test:\n`;
    yaml += `    sdk: flutter\n`;
    yaml += `  flutter_lints: ^2.0.0\n\n`;

    yaml += `flutter:\n`;
    yaml += `  uses-material-design: true\n`;
    yaml += `  assets:\n`;
    yaml += `    - assets/images/\n`;
    yaml += `    - assets/fonts/\n`;

    return yaml;
  }

  /**
   * Generate README.md
   */
  private generateReadme(screens: any[]): string {
    let readme = '';

    readme += `# Flutter Mockup Project\n\n`;
    readme += `This Flutter app was generated from visual mockups using AI interpretation.\n\n`;

    readme += `## Getting Started\n\n`;
    readme += `### Prerequisites\n`;
    readme += `- Flutter SDK (>= 3.0.0)\n`;
    readme += `- Dart SDK (included with Flutter)\n`;
    readme += `- Android Studio / Xcode (for mobile development)\n\n`;

    readme += `### Installation\n\n`;
    readme += `1. Get dependencies:\n`;
    readme += `\`\`\`bash\n`;
    readme += `flutter pub get\n`;
    readme += `\`\`\`\n\n`;

    readme += `2. Run the app:\n`;
    readme += `\`\`\`bash\n`;
    readme += `flutter run\n`;
    readme += `\`\`\`\n\n`;

    readme += `## Screens\n\n`;
    for (const screen of screens) {
      readme += `- **${screen.className}**: ${screen.components?.length || 0} components\n`;
    }

    readme += `\n## Generated Code\n\n`;
    readme += `This project was generated automatically. The following structure is used:\n\n`;
    readme += `\`\`\`\n`;
    readme += `lib/\n`;
    readme += `├── main.dart\n`;
    readme += `├── theme/\n`;
    readme += `│   └── app_theme.dart\n`;
    readme += `└── screens/\n`;
    for (const screen of screens) {
      const screenFile = this.toSnakeCase(screen.className);
      readme += `    └── ${screenFile}.dart\n`;
    }
    readme += `\`\`\`\n\n`;

    readme += `## Customization\n\n`;
    readme += `You can customize this app by:\n`;
    readme += `- Editing screen files in \`lib/screens/\`\n`;
    readme += `- Modifying theme in \`lib/theme/app_theme.dart\`\n`;
    readme += `- Adding business logic to state classes\n`;
    readme += `- Implementing navigation between screens\n\n`;

    readme += `## Support\n\n`;
    readme += `For more information, visit [Flutter Documentation](https://flutter.dev/docs)\n`;

    return readme;
  }

  /**
   * Generate .gitignore
   */
  private generateGitignore(): string {
    return `.DS_Store
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
coverage/
doc/api/
.env
*.iml
.idea/
.vscode/
`;
  }

  /**
   * Generate analysis_options.yaml
   */
  private generateAnalysisOptions(): string {
    return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - camel_case_types
    - camel_case_extensions
    - library_names
    - library_prefixes
    - type_init_formals
    - avoid_empty_else
    - avoid_print
    - avoid_relative_lib_imports
    - avoid_returning_null_for_future
    - avoid_slow_async_io
    - cancel_subscriptions
    - close_sinks
    - comment_references
    - control_flow_in_finally
    - empty_statements
    - hash_and_equals
    - invariant_booleans
    - iterable_contains_unrelated_type
    - list_remove_unrelated_type
    - literal_only_boolean_expressions
    - no_adjacent_strings_in_list
    - no_duplicate_case_values
    - prefer_void_to_null
    - throw_in_finally
    - unnecessary_statements
    - unrelated_type_equality_checks
`;
  }

  /**
   * Collect all required imports
   */
  private collectImports(screen: any): Set<string> {
    const imports = new Set<string>();
    imports.add('material.dart');

    if (screen.components) {
      for (const component of screen.components) {
        const mapping = this.componentMapping[component.type as keyof typeof this.componentMapping];
        if (mapping?.imports) {
          mapping.imports.forEach((imp: string) => imports.add(imp));
        }
      }
    }

    return imports;
  }

  /**
   * Format Dart code with proper indentation
   */
  private formatDartCode(code: string): string {
    // This is a basic formatter - in production, use prettier-dart or similar
    return code;
  }

  /**
   * Helper: Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  /**
   * Helper: Convert to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  /**
   * Helper: Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return this.toSnakeCase(str).replace(/_/g, '-');
  }

  /**
   * Helper: Convert to controller name
   */
  private toControllerName(label: string): string {
    const camelCase = this.toCamelCase(label);
    return `_${camelCase}Controller`;
  }
}
