/**
 * Interfaces para Flutter Screens Generator
 */

export interface FlutterScreen {
  className: string;
  components: FlutterComponent[];
  theme?: ThemeConfig;
}

export interface FlutterComponent {
  id: string;
  type: 'TextField' | 'Button' | 'ElevatedButton' | 'TextButton' | 'AppBar' | 'ListView' | 'Icon' | 'Container';
  label: string;
  position: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'elevated' | 'outlined' | 'text';
  color?: string;
  customProperties?: Record<string, any>;
  placeholder?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface UMLClassData {
  className: string;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
}

export interface UMLAttribute {
  name: string;
  type: string;
  visibility?: string;
}

export interface UMLMethod {
  name: string;
  returnType?: string;
  visibility?: string;
  parameters?: string[];
}
