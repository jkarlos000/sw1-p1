/**
 * Dart Code Generation Models & Interfaces
 * 
 * Defines all data structures for Flutter/Dart project generation
 */

/**
 * UML Attribute for Dart code generation
 */
export interface Atributo {
  titulo: string;
  tipo?: string;                  // Data type (String, Integer, Double, etc.)
  visibility?: 'public' | 'private' | 'protected' | 'package';
  defaultValue?: string;
}

/**
 * UML Method for Dart code generation
 */
export interface Metodo {
  nombre: string;
  parametros?: {
    nombre: string;
    tipo: string;
  }[];
  tipoRetorno?: string;           // Return type (void, String, Boolean, etc.)
  visibility?: 'public' | 'private' | 'protected' | 'package';
}

/**
 * Screen definition from user design
 */
export interface Screen {
  id?: string;
  className: string;
  components: Component[];
  styling?: ScreenStyling;
  navigation?: NavigationConfig;
  atributos?: Atributo[];        // ⭐ NEW: UML attributes
  metodos?: Metodo[];           // ⭐ NEW: UML methods
}

/**
 * Component definition
 */
export interface Component {
  id?: string;
  type: ComponentType;
  label: string;
  position: number;
  size?: ComponentSize;
  variant?: ComponentVariant;
  properties?: Record<string, any>;
  layout?: LayoutConfig;
}

/**
 * Supported component types (13 total)
 */
export type ComponentType =
  | 'TextField'
  | 'Button'
  | 'ElevatedButton'
  | 'TextButton'
  | 'OutlinedButton'
  | 'Text'
  | 'ListView'
  | 'GridView'
  | 'AppBar'
  | 'Icon'
  | 'Container'
  | 'Row'
  | 'Column';

/**
 * Component size enum
 */
export enum ComponentSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

/**
 * Button variants
 */
export enum ComponentVariant {
  ELEVATED = 'elevated',
  OUTLINED = 'outlined',
  TEXT = 'text'
}

/**
 * Widget mapping configuration
 */
export interface WidgetMapping {
  componentType: ComponentType;
  flutterWidget: string;
  imports: string[];
  stateRequired: boolean;
  controllerRequired?: boolean;
  onPressed?: boolean;
  properties: Record<string, string>;
  customizations?: Record<string, any>;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  alignment?: string;
  padding?: number;
  spacing?: number;
  flexFactor?: number;
  scrollable?: boolean;
  crossAxisAlignment?: string;
  mainAxisAlignment?: string;
}

/**
 * Screen styling
 */
export interface ScreenStyling {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
  shadowElevation?: number;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  initialRoute?: string;
  routes?: Record<string, string>;
  defaultTransition?: TransitionType;
}

/**
 * Navigation transition types
 */
export enum TransitionType {
  FADE = 'fade',
  SLIDE = 'slide',
  SCALE = 'scale',
  ROTATE = 'rotate'
}

/**
 * Project generation request
 */
export interface ProjectGenerationRequest {
  screens: Screen[];
  projectName?: string;
  projectVersion?: string;
  packageName?: string;
  theme?: ScreenStyling;
  dependencies?: ProjectDependency[];
}

/**
 * Project dependency
 */
export interface ProjectDependency {
  package: string;
  version?: string;
  isDev?: boolean;
}

/**
 * Generated project structure
 */
export interface GeneratedProject {
  success: boolean;
  projectName: string;
  files: Map<string, string>;
  fileCount: number;
  totalSize: number;
  generationTime: number;
  error?: string;
}

/**
 * Export request
 */
export interface ExportProjectRequest {
  screens: Screen[];
  projectName?: string;
  projectVersion?: string;
}

/**
 * Export response
 */
export interface ExportProjectResponse {
  success: boolean;
  projectId?: string;
  projectName: string;
  fileSize: number;
  componentCount: number;
  screenCount: number;
  downloadUrl?: string;
  timestamp: string;
  error?: string;
}

/**
 * Generation error
 */
export class GenerationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  format: boolean;
  optimizeImports: boolean;
  addComments: boolean;
  useNullSafety: boolean;
  dartVersion: string;
  flutterVersion: string;
}

/**
 * Dart class definition
 */
export interface DartClass {
  name: string;
  extends?: string;
  implements?: string[];
  fields: DartField[];
  methods: DartMethod[];
  constructor?: DartConstructor;
}

/**
 * Dart field definition
 */
export interface DartField {
  name: string;
  type: string;
  value?: string;
  modifier?: 'final' | 'late' | 'static' | 'const';
  documentation?: string;
}

/**
 * Dart method definition
 */
export interface DartMethod {
  name: string;
  returnType: string;
  parameters?: DartParameter[];
  body: string;
  isAsync?: boolean;
  isOverride?: boolean;
  documentation?: string;
}

/**
 * Dart parameter definition
 */
export interface DartParameter {
  name: string;
  type: string;
  isRequired?: boolean;
  defaultValue?: string;
  isNamed?: boolean;
}

/**
 * Dart constructor definition
 */
export interface DartConstructor {
  isConst?: boolean;
  parameters?: DartParameter[];
  initializers?: string[];
  body?: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  primaryColor: string;
  primarySwatch: string;
  accentColor: string;
  backgroundColor: string;
  scaffoldBackgroundColor: string;
  appBarTheme: AppBarThemeConfig;
  inputDecorationTheme: InputDecorationThemeConfig;
  elevatedButtonTheme: ElevatedButtonThemeConfig;
  textTheme: TextThemeConfig;
}

/**
 * AppBar theme config
 */
export interface AppBarThemeConfig {
  backgroundColor: string;
  foregroundColor: string;
  elevation: number;
  centerTitle: boolean;
  titleTextStyle: TextStyle;
}

/**
 * Input decoration theme config
 */
export interface InputDecorationThemeConfig {
  border: BorderConfig;
  focusedBorder: BorderConfig;
  enabledBorder: BorderConfig;
  contentPadding: EdgeInsetsConfig;
  labelStyle: TextStyle;
  hintStyle: TextStyle;
}

/**
 * Elevated button theme config
 */
export interface ElevatedButtonThemeConfig {
  backgroundColor: string;
  foregroundColor: string;
  padding: EdgeInsetsConfig;
  shape: ShapeConfig;
}

/**
 * Text theme config
 */
export interface TextThemeConfig {
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  displaySmall: TextStyle;
  headlineMedium: TextStyle;
  headlineSmall: TextStyle;
  titleLarge: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
}

/**
 * Text style config
 */
export interface TextStyle {
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily?: string;
}

/**
 * Border config
 */
export interface BorderConfig {
  type: 'outline' | 'underline' | 'none';
  color: string;
  width: number;
  borderRadius?: number;
}

/**
 * Edge insets config
 */
export interface EdgeInsetsConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Shape config
 */
export interface ShapeConfig {
  type: 'rectangular' | 'circular' | 'rounded';
  borderRadius?: number;
}

/**
 * pubspec.yaml content
 */
export interface PubspecConfig {
  name: string;
  description: string;
  version: string;
  environment: {
    sdk: string;
  };
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  flutter: {
    uses_material_design: boolean;
    assets?: string[];
    fonts?: FontConfig[];
  };
}

/**
 * Font configuration
 */
export interface FontConfig {
  family: string;
  fonts: {
    asset: string;
    weight?: number;
    style?: string;
  }[];
}

/**
 * Generation statistics
 */
export interface GenerationStats {
  startTime: Date;
  endTime: Date;
  duration: number;
  filesGenerated: number;
  totalLines: number;
  totalSize: number;
  componentsProcessed: number;
  screensProcessed: number;
  errors: ValidationError[];
  warnings: string[];
}


