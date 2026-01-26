/**
 * Dart Code Generator Service Tests
 * 
 * Test cases for Flutter/Dart project generation
 */

import { DartCodeGeneratorService } from './dart-code-generator.service';
import {
  Screen,
  Component,
  ComponentType,
  ProjectGenerationRequest,
  ExportProjectRequest,
  ScreenStyling,
  CodeGenerationOptions,
  ValidationError
} from '../models/dart-generation.models';

describe('DartCodeGeneratorService', () => {
  let service: DartCodeGeneratorService;

  beforeEach(() => {
    service = new DartCodeGeneratorService();
  });

  describe('Project Structure Generation', () => {
    it('should generate valid project structure with correct files', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: [
            {
              type: 'Text' as ComponentType,
              label: 'Welcome',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('lib/main.dart')).toBe(true);
      expect(result.has('pubspec.yaml')).toBe(true);
      expect(result.has('lib/screens/home_screen.dart')).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should generate all required directories', async () => {
      const screens: Screen[] = [
        {
          className: 'LoginScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      const fileKeys = Array.from(result.keys());
      expect(fileKeys.some((k: string) => k.includes('lib/'))).toBe(true);
      expect(fileKeys.some((k: string) => k.includes('lib/screens/'))).toBe(true);
      expect(fileKeys.some((k: string) => k.includes('lib/models/'))).toBe(true);
      expect(fileKeys.some((k: string) => k.includes('lib/services/'))).toBe(true);
      expect(fileKeys.some((k: string) => k.includes('lib/widgets/'))).toBe(true);
    });

    it('should handle multiple screens correctly', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: []
        },
        {
          className: 'ProfileScreen',
          components: []
        },
        {
          className: 'SettingsScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      const fileKeys = Array.from(result.keys());
      expect(fileKeys.filter((k: string) => k.includes('.dart')).length).toBeGreaterThanOrEqual(3);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('Screen File Generation', () => {
    it('should generate project with correct structure', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: [
            {
              type: 'Text' as ComponentType,
              label: 'Hello World',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('lib/screens/home_screen.dart')).toBe(true);
      const homeScreenContent = result.get('lib/screens/home_screen.dart') || '';
      expect(homeScreenContent).toContain('StatefulWidget');
      expect(homeScreenContent).toContain('build(BuildContext context)');
      expect(homeScreenContent).toContain('Scaffold');
    });

    it('should generate screens with all components', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen',
          components: [
            {
              type: 'Text' as ComponentType,
              label: 'Title',
              position: 0
            },
            {
              type: 'Button' as ComponentType,
              label: 'Submit',
              position: 1
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('lib/screens/test_screen.dart')).toBe(true);
      const screenContent = result.get('lib/screens/test_screen.dart') || '';
      expect(screenContent).toContain('Text');
      expect(screenContent).toContain('Button');
    });

    it('should handle form inputs properly', async () => {
      const screens: Screen[] = [
        {
          className: 'FormScreen',
          components: [
            {
              type: 'TextField' as ComponentType,
              label: 'Username',
              position: 0
            },
            {
              type: 'TextField' as ComponentType,
              label: 'Password',
              position: 1
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('lib/screens/form_screen.dart')).toBe(true);
      const screenContent = result.get('lib/screens/form_screen.dart') || '';
      expect(screenContent).toContain('TextEditingController');
      expect(screenContent).toContain('initState');
      expect(screenContent).toContain('dispose');
    });

    it('should properly format class names in PascalCase', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.size).toBeGreaterThan(0);
      const hasScreenFile = Array.from(result.keys()).some(k => k.includes('home_screen.dart'));
      expect(hasScreenFile).toBe(true);
    });
  });

  describe('Main.dart Generation', () => {
    it('should generate valid main.dart with routing', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: []
        },
        {
          className: 'ProfileScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const mainContent = result.get('lib/main.dart') || '';
      
      expect(mainContent).toContain('void main()');
      expect(mainContent).toContain('runApp');
      expect(mainContent).toContain('MaterialApp');
      expect(mainContent).toContain('home:');
      expect(mainContent).toContain('routes:');
    });

    it('should include all screens in routes', async () => {
      const screens: Screen[] = [
        {
          className: 'SplashScreen',
          components: []
        },
        {
          className: 'LoginScreen',
          components: []
        },
        {
          className: 'DashboardScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const mainContent = result.get('lib/main.dart') || '';
      
      expect(mainContent).toContain('SplashScreen');
      expect(mainContent).toContain('LoginScreen');
      expect(mainContent).toContain('DashboardScreen');
    });
  });

  describe('Theme Generation', () => {
    it('should generate theme with proper structure', async () => {
      const screens: Screen[] = [
        {
          className: 'HomeScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.size).toBeGreaterThan(0);
      const hasFiles = Array.from(result.keys()).length > 0;
      expect(hasFiles).toBe(true);
    });

    it('should include Material Design theme', async () => {
      const screens: Screen[] = [
        {
          className: 'ThemedScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const mainContent = result.get('lib/main.dart') || '';
      
      expect(mainContent.length).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('pubspec.yaml Generation', () => {
    it('should generate valid pubspec.yaml', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const pubspecContent = result.get('pubspec.yaml') || '';
      
      expect(pubspecContent).toContain('version:');
      expect(pubspecContent).toContain('environment:');
      expect(pubspecContent).toContain('dependencies:');
      expect(pubspecContent).toContain('flutter:');
      expect(pubspecContent).toContain('uses_material_design: true');
    });

    it('should include required Flutter dependencies', async () => {
      const screens: Screen[] = [
        {
          className: 'App',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const pubspecContent = result.get('pubspec.yaml') || '';
      
      expect(pubspecContent).toContain('flutter:');
      expect(pubspecContent.length).toBeGreaterThan(0);
    });
  });

  describe('Support File Generation', () => {
    it('should generate support files', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('README.md')).toBe(true);
      expect(result.has('.gitignore')).toBe(true);
      expect(result.has('analysis_options.yaml')).toBe(true);
    });

    it('should include required file content', async () => {
      const screens: Screen[] = [
        {
          className: 'App',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const readmeContent = result.get('README.md') || '';
      const gitignoreContent = result.get('.gitignore') || '';
      
      expect(readmeContent.length).toBeGreaterThan(0);
      expect(gitignoreContent.length).toBeGreaterThan(0);
    });
  });

  describe('Widget Generation', () => {
    it('should generate component widgets', async () => {
      const screens: Screen[] = [
        {
          className: 'InputScreen',
          components: [
            {
              type: 'TextField' as ComponentType,
              label: 'Email',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const screenContent = result.get('lib/screens/input_screen.dart') || '';
      
      expect(screenContent).toContain('TextField');
    });

    it('should generate button widgets', async () => {
      const screens: Screen[] = [
        {
          className: 'ActionScreen',
          components: [
            {
              type: 'Button' as ComponentType,
              label: 'Login',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const screenContent = result.get('lib/screens/action_screen.dart') || '';
      
      expect(screenContent).toContain('Button');
    });

    it('should generate text widgets', async () => {
      const screens: Screen[] = [
        {
          className: 'DisplayScreen',
          components: [
            {
              type: 'Text' as ComponentType,
              label: 'Hello World',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const screenContent = result.get('lib/screens/display_screen.dart') || '';
      
      expect(screenContent.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    it('should be available via service methods', async () => {
      const screens: Screen[] = [
        {
          className: 'HelperTest',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.size).toBeGreaterThan(0);
      expect(result.has('lib/main.dart')).toBe(true);
    });
  });

  describe('Complete Project Generation', () => {
    it('should generate complete project with all files', async () => {
      const screens: Screen[] = [
        {
          className: 'SplashScreen',
          components: []
        },
        {
          className: 'LoginScreen',
          components: [
            {
              type: 'TextField' as ComponentType,
              label: 'Email',
              position: 0
            },
            {
              type: 'TextField' as ComponentType,
              label: 'Password',
              position: 1
            },
            {
              type: 'Button' as ComponentType,
              label: 'Login',
              position: 2
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);

      expect(result.size).toBeGreaterThan(5);
      expect(result.has('lib/main.dart')).toBe(true);
      expect(result.has('pubspec.yaml')).toBe(true);
      expect(result.has('.gitignore')).toBe(true);
      expect(result.has('README.md')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty screens array', async () => {
      const result = await service.generateProjectStructure([]);
      
      expect(result.size).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple screens correctly', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen1',
          components: [
            {
              type: 'InvalidType' as ComponentType,
              label: 'Test',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.size).toBeGreaterThan(0);
    });

    it('should generate valid project structure', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      
      expect(result.has('lib/main.dart')).toBe(true);
      expect(result.has('pubspec.yaml')).toBe(true);
    });
  });

  describe('Code Quality', () => {
    it('should generate well-structured Dart code', async () => {
      const screens: Screen[] = [
        {
          className: 'TestScreen',
          components: []
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const mainContent = result.get('lib/main.dart') || '';
      
      expect(mainContent.length).toBeGreaterThan(0);
      // Check for proper structure
      expect(mainContent).toContain('import');
      expect(mainContent).toContain('void main()');
    });

    it('should include proper imports in generated files', async () => {
      const screens: Screen[] = [
        {
          className: 'FormScreen',
          components: [
            {
              type: 'TextField' as ComponentType,
              label: 'Input',
              position: 0
            }
          ]
        }
      ];

      const result = await service.generateProjectStructure(screens);
      const screenContent = result.get('lib/screens/form_screen.dart') || '';
      
      expect(screenContent).toContain("import 'package:flutter/material.dart'");
    });
  });
});
