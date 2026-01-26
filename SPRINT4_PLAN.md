# Sprint 4 Implementation Plan: Full Project Export

## Overview
Sprint 4 focuses on generating a complete, production-ready Flutter/Dart project from the visual mockup and component structure created in Sprints 1-3. Users will be able to export their designed UI as a fully functional Flutter project.

## Sprint 4 Objectives

### Primary Goals
1. Generate complete Dart/Flutter project structure
2. Create source code files with proper Dart syntax
3. Generate pubspec.yaml with dependencies
4. Create theme/style files
5. Package as downloadable ZIP file

### Success Criteria
- ✅ Generated Flutter project is compilable
- ✅ Project follows Flutter best practices
- ✅ All components from design are implemented
- ✅ Responsive layout included
- ✅ Theme/colors applied
- ✅ Can be extracted and `flutter run` immediately
- ✅ Code is maintainable and well-structured

---

## Architecture

### 3-Layer Generation Pipeline

```
Layer 1: Screen Definition Layer (Input)
├─ Screen name (className)
├─ List of components
├─ Component properties (type, label, size, variant)
└─ Styling information (colors, theme)

      ↓ Transform

Layer 2: Flutter Structure Layer (Processing)
├─ Generate Dart classes
├─ Create widget hierarchy
├─ Apply layout logic
├─ Handle state management
└─ Generate pubspec.yaml

      ↓ Compile

Layer 3: Project Export Layer (Output)
├─ Project directory structure
├─ All Dart/YAML files
├─ Assets folder
├─ Configuration files
└─ ZIP archive for download
```

---

## Feature Breakdown (8 Sub-features)

### Feature 1: Dart Class Generation
**Purpose**: Generate Dart class files from Flutter screens

```dart
// Generated: screens/login_screen.dart

import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late TextEditingController _emailController;
  late TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 16),
              // ... more widgets
            ],
          ),
        ),
      ),
    );
  }
}
```

**Implementation Steps**:
1. Create `dart-code-generator.service.ts` in backend
2. Implement Dart syntax generation
3. Component type → Widget mapping
4. Controller binding logic
5. State management setup

**Testing**:
- [ ] Generated code compiles
- [ ] Dart syntax is valid
- [ ] All components rendered

---

### Feature 2: Widget Type Mapping
**Purpose**: Map component types to Flutter widgets

| Component Type | Flutter Widget | Properties |
|---|---|---|
| TextField | TextField | controller, decoration |
| Button | ElevatedButton | onPressed, child |
| ElevatedButton | ElevatedButton | style, onPressed |
| TextButton | TextButton | onPressed, child |
| OutlinedButton | OutlinedButton | onPressed, child |
| ListView | ListView | scrollDirection, children |
| GridView | GridView.count | crossAxisCount, children |
| AppBar | AppBar | title, actions |
| Icon | Icon | icon data, color, size |
| Container | Container | decoration, padding, child |
| Row | Row | children, mainAxisAlignment |
| Column | Column | children, crossAxisAlignment |
| Text | Text | style, maxLines |

**Implementation**:
```typescript
interface ComponentMapping {
  flutterType: string;
  defaultProperties: object;
  requiredFields: string[];
  optionalFields: string[];
}

const componentMap: Record<string, ComponentMapping> = {
  'TextField': {
    flutterType: 'TextField',
    defaultProperties: { decoration: { border: 'OutlineInputBorder()' } },
    requiredFields: ['label'],
    optionalFields: ['maxLines', 'keyboardType']
  },
  // ... more mappings
};
```

---

### Feature 3: Layout Generation
**Purpose**: Generate responsive layouts using Flutter layout widgets

**Rules**:
- Default: Column for vertical stacking
- Detect Row patterns (adjacent components)
- Wrap with SingleChildScrollView for scrollable content
- Apply padding and spacing
- Center content appropriately

**Example Generation**:
```dart
// Input: Vertical list of 3 components
// Output:
SingleChildScrollView(
  child: Padding(
    padding: EdgeInsets.all(16.0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Component 1
        TextField(...),
        SizedBox(height: 16),
        // Component 2
        ElevatedButton(...),
        SizedBox(height: 16),
        // Component 3
        Text(...),
      ],
    ),
  ),
)
```

---

### Feature 4: Styling & Theme Generation
**Purpose**: Apply colors, themes, and visual styling

**Generates**:
1. `lib/theme/app_theme.dart` - Theme definition
2. Color scheme from mockup colors
3. Typography settings
4. Component styling

**Example**:
```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: Color(0xFF2196F3),
      primarySwatch: Colors.blue,
      useMaterial3: true,
      appBarTheme: AppBarTheme(
        backgroundColor: Color(0xFF2196F3),
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
```

---

### Feature 5: pubspec.yaml Generation
**Purpose**: Create project configuration file with dependencies

**Generates**:
```yaml
name: flutter_mockup_project
description: Flutter app generated from visual mockup
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  http: ^1.1.0
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/fonts/
```

**Logic**:
- Base dependencies always included
- Add provider if state management needed
- Add http if API calls detected
- Add intl for localization
- Auto-add required dependencies based on components

---

### Feature 6: Project Directory Structure
**Purpose**: Create proper Flutter project hierarchy

```
lib/
  ├── main.dart                 # Entry point
  ├── theme/
  │   └── app_theme.dart        # Theme definition
  ├── screens/
  │   ├── login_screen.dart
  │   ├── home_screen.dart
  │   └── profile_screen.dart
  ├── widgets/                  # Reusable widgets
  │   └── custom_button.dart
  ├── models/                   # Data models
  │   └── user_model.dart
  └── services/                 # Business logic
      └── api_service.dart
assets/
  ├── images/
  └── fonts/
test/
  └── widget_test.dart
.gitignore
pubspec.yaml
pubspec.lock
README.md
```

**Implementation**:
```typescript
async generateProjectStructure(screens: Screen[]): Promise<ProjectFiles> {
  const files = new Map<string, string>();
  
  // Generate main.dart
  files.set('lib/main.dart', this.generateMainDart(screens));
  
  // Generate theme
  files.set('lib/theme/app_theme.dart', this.generateTheme());
  
  // Generate screen files
  for (const screen of screens) {
    const screenFile = this.generateScreenFile(screen);
    files.set(`lib/screens/${this.toSnakeCase(screen.className)}.dart`, screenFile);
  }
  
  // Generate pubspec.yaml
  files.set('pubspec.yaml', this.generatePubspec(screens));
  
  return files;
}
```

---

### Feature 7: main.dart Generation
**Purpose**: Generate app entry point

**Features**:
- App initialization
- Theme setup
- Initial route/screen
- Navigation routes

**Example**:
```dart
import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Mockup',
      theme: AppTheme.lightTheme,
      home: const LoginScreen(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
```

---

### Feature 8: ZIP Export & Download
**Purpose**: Package project as downloadable file

**Process**:
1. Generate all project files in memory
2. Create ZIP archive
3. Set appropriate MIME type
4. Stream to frontend
5. Browser downloads `flutter_project.zip`

**Implementation**:
```typescript
async exportProjectAsZip(screens: Screen[]): Promise<Buffer> {
  const projectFiles = await this.generateProjectStructure(screens);
  const zip = new AdmZip();
  
  // Add all files to ZIP
  for (const [path, content] of projectFiles) {
    zip.addFile(path, Buffer.from(content, 'utf-8'));
  }
  
  return zip.toBuffer();
}
```

**API Endpoint**:
```
POST /flutter/exportar-proyecto
Request: { screens: Screen[] }
Response: ZIP file (application/zip)
```

---

## Implementation Sequence

### Phase 1: Backend Services (Week 1)
1. Create `dart-code-generator.service.ts`
2. Implement component → widget mapping
3. Create layout generation logic
4. Add theme generator
5. Add pubspec.yaml generator
6. Add project structure builder

### Phase 2: File Generation (Week 2)
1. Implement main.dart generation
2. Add screen file generation
3. Implement ZIP export
4. Add file streaming to frontend
5. Create API endpoint

### Phase 3: Frontend Integration (Week 3)
1. Add "Export Project" button to Flutter Preview
2. Show progress/loading during generation
3. Implement ZIP download
4. Add success notification
5. Generate README.md for user

### Phase 4: Testing & Refinement (Week 4)
1. Test generated projects compile
2. Test `flutter run` on generated project
3. Verify all components render
4. Test responsive layouts
5. Optimize code generation
6. Document process

---

## Key Implementation Files

### New Files to Create
```
backend-p1sw1/
  services/
    └── dart-code-generator.service.ts    # Main generation logic
  models/
    └── dart-generation.models.ts         # Interfaces
  utils/
    └── dart-formatter.utils.ts           # Code formatting
  controller/
    ├── (update) flutter-mockup.controller.ts
    └── Add exportProyecto() method

official-sw1p1/src/app/
  flutter-preview/
    ├── (update) flutter-preview.component.ts
    ├── (update) flutter-preview.component.html
    └── (new) export-dialog.component.ts
```

### Dependencies to Add
```json
{
  "dependencies": {
    "adm-zip": "^0.5.10",        // ZIP creation
    "prettier": "^3.0.0",        // Code formatting
    "change-case": "^4.1.2"      // Snake case conversion
  }
}
```

---

## Data Models

### Dart Generation Request
```typescript
interface ExportProjectRequest {
  screens: Array<{
    className: string;
    components: Array<{
      type: string;
      label: string;
      position: number;
      size: string;
      variant?: string;
    }>;
  }>;
  projectName?: string;
  projectVersion?: string;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}
```

### Response
```typescript
interface ExportProjectResponse {
  success: boolean;
  projectName: string;
  fileSize: number;
  componentCount: number;
  screenCount: number;
  downloadUrl?: string;
  error?: string;
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Component mapping accuracy
- [ ] Dart syntax generation
- [ ] Widget hierarchy correctness
- [ ] Theme application
- [ ] pubspec.yaml generation

### Integration Tests
- [ ] Full project generation
- [ ] ZIP file creation
- [ ] File integrity
- [ ] Flutter compilation
- [ ] App runs successfully

### E2E Tests
- [ ] User creates mockup
- [ ] Clicks "Export Project"
- [ ] Downloads ZIP
- [ ] Extracts project
- [ ] Runs `flutter pub get`
- [ ] Runs `flutter run`
- [ ] App displays correctly

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Simple project (<5 screens) | <2s | - |
| Medium project (5-10 screens) | <5s | - |
| Complex project (10+ screens) | <10s | - |
| ZIP file size | <500KB | - |
| Download time (5s) | Instant | - |

---

## Risk Mitigation

### Risk: Generated code doesn't compile
**Mitigation**: Test generation with multiple component combinations, validate Dart syntax

### Risk: Project structure is confusing
**Mitigation**: Generate comprehensive README.md, follow Flutter conventions

### Risk: Performance issues with large projects
**Mitigation**: Stream large files, optimize ZIP compression

### Risk: State management complexity
**Mitigation**: Start simple, add provider pattern later if needed

---

## Success Metrics

### Feature Completion
- ✅ 8/8 sub-features implemented
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Code coverage > 80%

### User Experience
- ✅ Export button visible and easy to find
- ✅ Download completes in < 10 seconds
- ✅ Generated project is ready to use
- ✅ Clear instructions included

### Code Quality
- ✅ Generated code is maintainable
- ✅ Follows Dart/Flutter conventions
- ✅ No linting errors
- ✅ Proper error handling

---

## Acceptance Criteria

A user can:
1. Create/design a Flutter mockup (via Sprints 1-3)
2. Click "Export as Flutter Project"
3. Receive a downloadable ZIP file
4. Extract the ZIP on their computer
5. Run `flutter pub get` to install dependencies
6. Run `flutter run` to launch the app
7. See their designed screens in a working app
8. Continue development from the generated code

---

## Post-Sprint 4 Roadmap

### Sprint 5 (Optional Enhancements)
- [ ] State management (Provider pattern)
- [ ] API integration templates
- [ ] Authentication scaffolding
- [ ] Database models generation
- [ ] Unit test generation

### Sprint 6 (Advanced Features)
- [ ] Custom themes with color picker
- [ ] Animations and transitions
- [ ] Responsive grid system
- [ ] Platform-specific code (iOS/Android)
- [ ] Internationalization (i18n)

---

## Documentation Needed

### For Developers
- [ ] SPRINT4_IMPLEMENTATION.md - Detailed technical guide
- [ ] DART_GENERATION_API.md - API reference
- [ ] CODE_GENERATION_PATTERNS.md - Patterns and best practices

### For Users
- [ ] EXPORT_GUIDE.md - How to export and use project
- [ ] GENERATED_PROJECT_README.md - Included in ZIP
- [ ] VIDEO_TUTORIAL.md - Step-by-step guide

---

## Completion Checklist

### Pre-implementation
- [ ] Review and approve this plan
- [ ] Set up development environment
- [ ] Install required dependencies
- [ ] Create feature branch

### Implementation
- [ ] All 8 features implemented
- [ ] Code reviewed and tested
- [ ] Documentation written
- [ ] Integration tested

### Deployment
- [ ] Merge to main branch
- [ ] Tag release
- [ ] Deploy to production
- [ ] Monitor for issues

---

**Last Updated**: 2024
**Status**: Planning Phase
**Target Start**: After Sprint 2 Completion
**Estimated Duration**: 4 weeks
