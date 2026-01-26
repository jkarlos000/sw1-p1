# 🚀 Sprint 4 Implementation Roadmap

## Sprint 4: Full Project Export - 8 Features in 4 Phases

### Overview
Generate complete, production-ready Flutter projects from user designs. Users can export, extract, and run `flutter run` immediately.

---

## 📊 Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal**: Core Dart generation service with type mapping

#### Feature 1: Dart Class Generation ✅ TO-DO
- [ ] Create `dart-code-generator.service.ts`
- [ ] Implement Dart syntax generation
- [ ] StatefulWidget creation
- [ ] State management setup
- [ ] Controller initialization
- [ ] Dispose methods
- **Files**: `backend-p1sw1/services/dart-code-generator.service.ts`

#### Feature 2: Widget Type Mapping ✅ TO-DO
- [ ] Create component-to-widget mapper
- [ ] Define all 13 widget types
- [ ] Map properties correctly
- [ ] Handle variants (outlined, elevated, text)
- [ ] Create mapping interface
- **Files**: `backend-p1sw1/models/dart-generation.models.ts`

---

### Phase 2: Structure & Layout (Week 2)
**Goal**: Project directory structure and layout generation

#### Feature 3: Layout Generation ✅ TO-DO
- [ ] Implement Column-based layout
- [ ] Add Row detection logic
- [ ] Create SingleChildScrollView wrapper
- [ ] Apply padding & spacing
- [ ] Handle responsive layouts
- **Files**: `backend-p1sw1/services/layout-generator.service.ts`

#### Feature 4: Styling & Theme Generation ✅ TO-DO
- [ ] Generate `app_theme.dart`
- [ ] Create ThemeData configuration
- [ ] Apply colors from mockup
- [ ] Configure typography
- [ ] Set component styling (buttons, inputs, etc)
- **Files**: Generate `lib/theme/app_theme.dart` in export

---

### Phase 3: Project Setup (Week 3)
**Goal**: Create pubspec.yaml, main.dart, and directory structure

#### Feature 5: pubspec.yaml Generation ✅ TO-DO
- [ ] Create base pubspec template
- [ ] Add Flutter dependencies
- [ ] Add provider/state management (if needed)
- [ ] Add http package (if API calls detected)
- [ ] Add intl for i18n
- [ ] Version management
- **Files**: Generate `pubspec.yaml` in export

#### Feature 6: Project Directory Structure ✅ TO-DO
- [ ] Create `/lib` folder structure
- [ ] Create `/lib/screens`
- [ ] Create `/lib/theme`
- [ ] Create `/lib/widgets`
- [ ] Create `/lib/models`
- [ ] Create `/lib/services`
- [ ] Create `/assets`, `/android`, `/ios`
- **Pattern**: Full Flutter project structure

#### Feature 7: main.dart Generation ✅ TO-DO
- [ ] Create app entry point
- [ ] Initialize MaterialApp
- [ ] Set theme
- [ ] Configure initial route
- [ ] Add route definitions
- [ ] Handle navigation
- **Files**: Generate `lib/main.dart` in export

---

### Phase 4: Export & Download (Week 4)
**Goal**: Package and deliver as ZIP

#### Feature 8: ZIP Export & Download ✅ TO-DO
- [ ] Create ZIP export controller endpoint
- [ ] Package all files into ZIP
- [ ] Add to HTTP response
- [ ] Set MIME type (application/zip)
- [ ] Stream to frontend
- [ ] Handle large files
- [ ] Add README.md to ZIP
- **Endpoint**: `POST /flutter/exportar-proyecto`

---

## 🎯 Detailed Implementation Tasks

### Task 1.1: Dart Code Generator Service
```bash
File: backend-p1sw1/services/dart-code-generator.service.ts

Methods needed:
- generateScreens(screens: Screen[]): string[]
- generateDartClass(screen: Screen): string
- generateStateClass(screen: Screen): string
- generateBuildMethod(screen: Screen): string
- generateInitState(screen: Screen): string
- generateDispose(screen: Screen): string
- formatDartCode(code: string): string
```

**Key Patterns**:
```dart
// StatefulWidget
class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

// State class with controllers
class _LoginScreenState extends State<LoginScreen> {
  late TextEditingController _emailController;
  @override
  void initState() { super.initState(); _emailController = TextEditingController(); }
  @override
  void dispose() { _emailController.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) { /* ... */ }
}
```

### Task 2.1: Component Mapping
```typescript
// interfaces
interface ComponentMapping {
  componentType: string;
  flutterWidget: string;
  properties: Map<string, string>;
  imports: string[];
}

// mapping table
const mappings: Record<string, ComponentMapping> = {
  'TextField': {
    flutterWidget: 'TextField',
    properties: { controller: 'controller', decoration: 'InputDecoration(...)' },
    imports: ['material.dart']
  },
  // ... more mappings
};
```

### Task 3.1: Layout Algorithm
```typescript
// Logic
- If all components vertical → Column
- If components adjacent → Row inside Column
- If 10+ items → ListView.builder
- Always wrap in SingleChildScrollView
- Apply padding: EdgeInsets.all(16)
- Add spacing: SizedBox(height: 16)
```

### Task 4.1: Theme Generation
```dart
// Generate lib/theme/app_theme.dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: Color(0xFF2196F3),
      appBarTheme: AppBarTheme(...),
      inputDecorationTheme: InputDecorationTheme(...),
      elevatedButtonTheme: ElevatedButtonThemeData(...),
    );
  }
}
```

### Task 5.1: pubspec.yaml
```yaml
name: flutter_mockup_project
description: Flutter app generated from visual mockup
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  http: ^1.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter

flutter:
  uses-material-design: true
```

### Task 7.1: main.dart Template
```dart
import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';

void main() => runApp(const MyApp());

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
        // ... more routes
      },
    );
  }
}
```

### Task 8.1: ZIP Export Endpoint
```typescript
// Controller method
async exportarProyecto(req: Request, res: Response) {
  const { screens } = req.body;
  
  // 1. Generate all files in memory
  const files = await dartCodeGenerator.generateProjectFiles(screens);
  
  // 2. Create ZIP archive
  const zip = new AdmZip();
  for (const [path, content] of files) {
    zip.addFile(path, Buffer.from(content, 'utf-8'));
  }
  
  // 3. Send as download
  const zipBuffer = zip.toBuffer();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=flutter_project.zip');
  res.send(zipBuffer);
}
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Create dart-code-generator.service.ts
- [ ] Implement all 13 widget mappings
- [ ] Create models/interfaces
- [ ] Test Dart syntax generation
- [ ] Add error handling

### Phase 2: Structure
- [ ] Implement layout generator
- [ ] Create theme generator
- [ ] Handle responsive layouts
- [ ] Apply colors & styling

### Phase 3: Project Setup
- [ ] Generate pubspec.yaml
- [ ] Create directory structure
- [ ] Generate main.dart
- [ ] Create all necessary files

### Phase 4: Export
- [ ] Create ZIP export endpoint
- [ ] Test download functionality
- [ ] Add error handling
- [ ] Test with multiple project sizes

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Widget mapping accuracy
- [ ] Dart code generation
- [ ] Layout algorithm
- [ ] Theme generation
- [ ] pubspec.yaml generation

### Integration Tests
- [ ] Full project generation
- [ ] ZIP creation
- [ ] File integrity
- [ ] Directory structure

### E2E Tests
- [ ] Generate project
- [ ] Download ZIP
- [ ] Extract locally
- [ ] Run `flutter pub get`
- [ ] Run `flutter run`
- [ ] Verify UI matches design

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "adm-zip": "^0.5.10",      // ZIP creation
    "prettier": "^3.0.0",      // Code formatting
    "change-case": "^4.1.2"    // Snake case conversion
  }
}
```

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| All 8 features | ✅ 8/8 | To-Do |
| Generated code compiles | 100% | To-Do |
| Components render | 100% | To-Do |
| ZIP size | <500KB | To-Do |
| Export time | <10s | To-Do |
| Code quality | 100% | To-Do |

---

## 📅 Timeline

```
Week 1: Foundation (Features 1-2)
  Mon-Tue: Dart generator service
  Wed-Thu: Widget mapping
  Fri: Testing & refinement

Week 2: Structure (Features 3-4)
  Mon-Tue: Layout generation
  Wed-Thu: Theme generation
  Fri: Integration testing

Week 3: Project Setup (Features 5-7)
  Mon-Tue: pubspec.yaml generation
  Wed: Directory structure
  Thu-Fri: main.dart generation

Week 4: Export & Polish (Feature 8)
  Mon-Tue: ZIP export endpoint
  Wed: Download functionality
  Thu-Fri: End-to-end testing & documentation
```

---

## 🚀 Next: Start Phase 1

Ready to begin? Let's start with:

1. **Create dart-code-generator.service.ts** - Core generation logic
2. **Create component mapping** - Widget type definitions
3. **Implement Dart class generation** - StatefulWidget creation
4. **Add tests** - Verify Dart syntax

**First file to create**: `backend-p1sw1/services/dart-code-generator.service.ts`

---

**Status**: 📋 Planning Complete  
**Next**: Begin Phase 1 Implementation  
**Estimated Duration**: 4 weeks  
**Priority**: HIGH - Final feature for MVP
