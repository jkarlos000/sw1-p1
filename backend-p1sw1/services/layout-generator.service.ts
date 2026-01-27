/**
 * Layout Generator Service
 * 
 * Generates responsive layouts for Flutter screens based on component configuration
 * Handles Column/Row detection, spacing, alignment, and responsive design
 */

import {
  Component,
  ComponentType,
  LayoutConfig,
  Screen
} from '../models/dart-generation.models';

export class LayoutGeneratorService {
  /**
   * Generate responsive layout code for a screen
   */
  generateScreenLayout(screen: Screen): string {
    if (!screen.components || screen.components.length === 0) {
      return this.generateEmptyScreenLayout();
    }

    return this.buildLayout(screen.components, screen.styling);
  }

  /**
   * Detect if components should use Column or Row based on their properties
   */
  detectLayoutDirection(components: Component[]): 'column' | 'row' {
    if (components.length === 0) return 'column';

    // Check if any component suggests row layout
    const hasRowComponent = components.some(c =>
      ['Row', 'ListView'].includes(c.type)
    );

    if (hasRowComponent) return 'row';

    // Default to column for most mobile layouts
    return 'column';
  }

  /**
   * Build layout with proper spacing and alignment
   */
  private buildLayout(components: Component[], styling: any): string {
    const direction = this.detectLayoutDirection(components);
    const mainAxisAlignment = this.detectMainAxisAlignment(components);
    const crossAxisAlignment = this.detectCrossAxisAlignment(components);

    let layout = '';

    if (direction === 'column') {
      layout = this.buildColumnLayout(
        components,
        mainAxisAlignment,
        crossAxisAlignment
      );
    } else {
      layout = this.buildRowLayout(
        components,
        mainAxisAlignment,
        crossAxisAlignment
      );
    }

    return layout;
  }

  /**
   * Build Column layout
   */
  private buildColumnLayout(
    components: Component[],
    mainAxisAlignment: string,
    crossAxisAlignment: string
  ): string {
    const spacing = this.calculateSpacing(components);
    const padding = this.calculatePadding(components);

    let code = `Column(
  mainAxisAlignment: MainAxisAlignment.${mainAxisAlignment},
  crossAxisAlignment: CrossAxisAlignment.${crossAxisAlignment},
  children: [`;

    components.forEach((component, index) => {
      if (index > 0) {
        code += `\n    SizedBox(height: ${spacing}),`;
      }
      code += `\n    ${this.generateComponentPlaceholder(component)},`;
    });

    code += `\n  ],
)`;

    if (padding > 0) {
      code = `Padding(
  padding: EdgeInsets.all(${padding}),
  child: ${code},
)`;
    }

    return code;
  }

  /**
   * Build Row layout
   */
  private buildRowLayout(
    components: Component[],
    mainAxisAlignment: string,
    crossAxisAlignment: string
  ): string {
    const spacing = this.calculateSpacing(components);
    const padding = this.calculatePadding(components);

    let code = `Row(
  mainAxisAlignment: MainAxisAlignment.${mainAxisAlignment},
  crossAxisAlignment: CrossAxisAlignment.${crossAxisAlignment},
  children: [`;

    components.forEach((component, index) => {
      if (index > 0) {
        code += `\n    SizedBox(width: ${spacing}),`;
      }
      code += `\n    Expanded(
      child: ${this.generateComponentPlaceholder(component)},
    ),`;
    });

    code += `\n  ],
)`;

    if (padding > 0) {
      code = `Padding(
  padding: EdgeInsets.all(${padding}),
  child: ${code},
)`;
    }

    return code;
  }

  /**
   * Generate component placeholder in layout
   */
  private generateComponentPlaceholder(component: Component): string {
    const componentName = this.getComponentPlaceholderName(component.type);
    return `${componentName}(label: '${component.label}')`;
  }

  /**
   * Get placeholder component name
   */
  private getComponentPlaceholderName(type: ComponentType): string {
    const mapping: Record<ComponentType, string> = {
      TextField: 'TextFieldWidget',
      Button: 'ButtonWidget',
      ElevatedButton: 'ElevatedButtonWidget',
      TextButton: 'TextButtonWidget',
      OutlinedButton: 'OutlinedButtonWidget',
      Text: 'TextWidget',
      ListView: 'ListViewWidget',
      GridView: 'GridViewWidget',
      AppBar: 'AppBarWidget',
      Icon: 'IconWidget',
      Container: 'ContainerWidget',
      Row: 'RowWidget',
      Column: 'ColumnWidget'
    };

    return mapping[type] || 'CustomWidget';
  }

  /**
   * Detect main axis alignment
   */
  private detectMainAxisAlignment(components: Component[]): string {
    // Check if components have explicit layout config
    if (components.some(c => c.layout?.mainAxisAlignment)) {
      return components[0].layout!.mainAxisAlignment!;
    }

    // Default spacing strategy
    if (components.length > 3) return 'spaceBetween';
    if (components.length > 1) return 'spaceEvenly';
    return 'start';
  }

  /**
   * Detect cross axis alignment
   */
  private detectCrossAxisAlignment(components: Component[]): string {
    // Check if components have explicit layout config
    if (components.some(c => c.layout?.crossAxisAlignment)) {
      return components[0].layout!.crossAxisAlignment!;
    }

    // Default: stretch to fill width
    return 'stretch';
  }

  /**
   * Calculate spacing between components
   */
  private calculateSpacing(components: Component[]): number {
    if (components.length === 0) return 0;

    // Check if any component defines spacing
    const definedSpacing = components.find(c => c.layout?.spacing);
    if (definedSpacing?.layout?.spacing) {
      return definedSpacing.layout.spacing;
    }

    // Default spacing based on component count
    if (components.length > 5) return 8;
    if (components.length > 2) return 12;
    return 16;
  }

  /**
   * Calculate padding for layout
   */
  private calculatePadding(components: Component[]): number {
    if (components.length === 0) return 0;

    // Check if any component defines padding
    const definedPadding = components.find(c => c.layout?.padding);
    if (definedPadding?.layout?.padding) {
      return definedPadding.layout.padding;
    }

    // Default padding
    return 16;
  }

  /**
   * Generate ListView layout for scrollable content
   */
  generateListViewLayout(components: Component[]): string {
    const padding = this.calculatePadding(components);

    let code = `ListView(
  padding: EdgeInsets.all(${padding}),
  children: [`;

    components.forEach((component, index) => {
      code += `\n    ${this.generateComponentPlaceholder(component)},`;
      if (index < components.length - 1) {
        code += '\n    Divider(),';
      }
    });

    code += `\n  ],
)`;

    return code;
  }

  /**
   * Generate GridView layout for grid content
   */
  generateGridViewLayout(components: Component[]): string {
    const columns = this.detectGridColumns(components);
    const spacing = this.calculateSpacing(components);

    let code = `GridView.count(
  crossAxisCount: ${columns},
  mainAxisSpacing: ${spacing},
  crossAxisSpacing: ${spacing},
  children: [`;

    components.forEach((component, index) => {
      code += `\n    ${this.generateComponentPlaceholder(component)},`;
    });

    code += `\n  ],
)`;

    return code;
  }

  /**
   * Detect optimal number of grid columns
   */
  private detectGridColumns(components: Component[]): number {
    if (components.length === 1) return 1;
    if (components.length === 2) return 2;
    if (components.length <= 4) return 2;
    if (components.length <= 6) return 3;
    return 3;
  }

  /**
   * Generate responsive layout using MediaQuery
   */
  generateResponsiveLayout(screen: Screen): string {
    const smallScreenLayout = this.buildSmallScreenLayout(screen);
    const largeScreenLayout = this.buildLargeScreenLayout(screen);

    return `LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < 600) {
      return ${smallScreenLayout};
    } else {
      return ${largeScreenLayout};
    }
  },
)`;
  }

  /**
   * Build layout for small screens
   */
  private buildSmallScreenLayout(screen: Screen): string {
    return this.buildLayout(screen.components, screen.styling);
  }

  /**
   * Build layout for large screens
   */
  private buildLargeScreenLayout(screen: Screen): string {
    // For tablet/desktop, use Row if there are few components
    if (screen.components.length <= 2) {
      return this.buildRowLayout(
        screen.components,
        'spaceAround',
        'center'
      );
    }

    // Otherwise use Column
    return this.buildLayout(screen.components, screen.styling);
  }

  /**
   * Generate empty screen layout (safe default)
   */
  private generateEmptyScreenLayout(): string {
    return `Center(
  child: Text('No components yet'),
)`;
  }

  /**
   * Generate layout with AppBar
   */
  generateLayoutWithAppBar(
    title: string,
    components: Component[],
    styling: any
  ): string {
    const bodyLayout = this.buildLayout(components, styling);

    return `Scaffold(
  appBar: AppBar(
    title: Text('${title}'),
    elevation: 0,
  ),
  body: ${bodyLayout},
)`;
  }

  /**
   * Generate layout with floating action button
   */
  generateLayoutWithFAB(
    components: Component[],
    styling: any,
    fabLabel: string = 'Add'
  ): string {
    const bodyLayout = this.buildLayout(components, styling);

    return `Scaffold(
  body: ${bodyLayout},
  floatingActionButton: FloatingActionButton(
    onPressed: () {
      // TODO: Implement action
    },
    child: Icon(Icons.add),
  ),
)`;
  }

  /**
   * Generate layout with bottom navigation
   */
  generateLayoutWithBottomNav(
    components: Component[],
    styling: any,
    tabs: string[] = ['Home', 'Profile', 'Settings']
  ): string {
    const bodyLayout = this.buildLayout(components, styling);

    let tabsCode = tabs
      .map(
        (tab, index) => `
    BottomNavigationBarItem(
      icon: Icon(Icons.home),
      label: '${tab}',
    ),`
      )
      .join('');

    return `Scaffold(
  body: ${bodyLayout},
  bottomNavigationBar: BottomNavigationBar(
    items: [${tabsCode}
    ],
    currentIndex: 0,
    onTap: (index) {
      // TODO: Handle tab change
    },
  ),
)`;
  }

  /**
   * Generate form layout with validation
   */
  generateFormLayout(
    components: Component[],
    styling: any,
    submitButtonLabel: string = 'Submit'
  ): string {
    const formComponents = components.filter(c => c.type === 'TextField');
    const otherComponents = components.filter(c => c.type !== 'TextField');

    let code = `Form(
  key: formKey,
  child: SingleChildScrollView(
    padding: EdgeInsets.all(16),
    child: Column(
      children: [`;

    // Add text fields
    formComponents.forEach(component => {
      code += `\n        ${this.generateComponentPlaceholder(component)},
        SizedBox(height: 16),`;
    });

    // Add other components
    otherComponents.forEach(component => {
      code += `\n        ${this.generateComponentPlaceholder(component)},
        SizedBox(height: 16),`;
    });

    // Add submit button
    code += `\n        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                // TODO: Submit form
              }
            },
            child: Text('${submitButtonLabel}'),
          ),
        ),
      ],
    ),
  ),
)`;

    return code;
  }

  /**
   * Generate card-based layout
   */
  generateCardLayout(components: Component[], styling: any): string {
    const padding = this.calculatePadding(components);

    let code = `SingleChildScrollView(
  padding: EdgeInsets.all(${padding}),
  child: Column(
    children: [`;

    components.forEach((component, index) => {
      code += `\n      Card(
        elevation: 2,
        margin: EdgeInsets.only(bottom: 16),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: ${this.generateComponentPlaceholder(component)},
        ),
      ),`;
    });

    code += `\n    ],
  ),
)`;

    return code;
  }

  /**
   * Validate layout configuration
   */
  validateLayoutConfig(layout: LayoutConfig): string[] {
    const errors: string[] = [];

    if (layout.padding && layout.padding < 0) {
      errors.push('Padding cannot be negative');
    }

    if (layout.spacing && layout.spacing < 0) {
      errors.push('Spacing cannot be negative');
    }

    if (layout.flexFactor && layout.flexFactor <= 0) {
      errors.push('Flex factor must be greater than 0');
    }

    return errors;
  }

  /**
   * Optimize layout for performance
   */
  optimizeLayout(components: Component[]): Component[] {
    // Remove duplicate components
    const seen = new Set<string>();
    const optimized: Component[] = [];

    components.forEach(component => {
      const key = `${component.type}-${component.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        optimized.push(component);
      }
    });

    return optimized;
  }

  /**
   * Generate accessible layout
   */
  generateAccessibleLayout(
    components: Component[],
    styling: any
  ): string {
    const baseLayout = this.buildLayout(components, styling);

    // Wrap with semantic widgets for accessibility
    return `Semantics(
  label: 'Main content area',
  child: ${baseLayout},
)`;
  }
}
