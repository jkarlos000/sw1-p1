/**
 * Setup Guide Generator Service (Sprint 4 - Phase 3)
 * 
 * Generates comprehensive setup guides for different development environments
 */

export class SetupGuideGeneratorService {
  /**
   * Generate complete setup guide
   */
  generateCompleteSetupGuide(
    projectName: string,
    platforms: string[] = ['android', 'ios', 'web'],
    targetSDK: number = 33,
    minSDK: number = 21
  ): string {
    let guide = this.generateHeaderSection(projectName);
    
    guide += '\n\n' + this.generatePrerequisitesSection();
    guide += '\n\n' + this.generateInstallationSection(projectName);
    guide += '\n\n' + this.generateProjectSetupSection(projectName);
    
    if (platforms.includes('android')) {
      guide += '\n\n' + this.generateAndroidSetupSection(targetSDK, minSDK);
    }
    
    if (platforms.includes('ios')) {
      guide += '\n\n' + this.generateIOSSetupSection();
    }
    
    if (platforms.includes('web')) {
      guide += '\n\n' + this.generateWebSetupSection();
    }
    
    guide += '\n\n' + this.generateBuildSection(platforms);
    guide += '\n\n' + this.generateTroubleshootingSection();
    
    return guide;
  }

  /**
   * Generate header section
   */
  private generateHeaderSection(projectName: string): string {
    return `# ${projectName} - Setup & Installation Guide

## Overview
This guide provides step-by-step instructions for setting up and running the ${projectName} Flutter application across different platforms.

### Project Structure
\`\`\`
${projectName}/
├── android/          # Android-specific files
├── ios/              # iOS-specific files
├── web/              # Web-specific files
├── lib/              # Dart source code
├── pubspec.yaml      # Project dependencies
├── pubspec.lock      # Locked versions
└── README.md         # Project documentation
\`\`\`

### Supported Platforms
- Android 5.0+ (API 21+)
- iOS 11.0+
- Web (all modern browsers)
- Windows 10/11
- macOS 10.13+
- Linux (Ubuntu 18.04+)`;
  }

  /**
   * Generate prerequisites section
   */
  private generatePrerequisitesSection(): string {
    return `## Prerequisites

### Required Tools
1. **Flutter SDK** (Latest Stable)
   - Download from: https://flutter.dev/docs/get-started/install
   - Version: 3.10.0 or higher
   - Size: ~600MB

2. **Dart SDK** (comes with Flutter)
   - Dart 3.0.0 or higher
   - Automatically installed with Flutter

3. **Git**
   - Version: 2.20+
   - Download from: https://git-scm.com/

4. **IDE/Editor**
   - Visual Studio Code (recommended)
   - Android Studio
   - IntelliJ IDEA
   - Xcode (for iOS development)

### System Requirements
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 15GB minimum
- **Operating System**: Windows 10/11, macOS 10.13+, or Linux
- **Internet**: Stable connection for package downloads

### Verify Installation
\`\`\`bash
# Check Flutter installation
flutter --version

# Check Dart installation
dart --version

# Check system setup
flutter doctor
\`\`\`

### Expected Output (flutter doctor)
\`\`\`
[✓] Flutter (Channel stable, 3.10.0)
[✓] Android toolchain
[✓] Xcode (for iOS)
[✓] VS Code
[✓] Connected device
\`\`\``;
  }

  /**
   * Generate installation section
   */
  private generateInstallationSection(projectName: string): string {
    return `## Installation

### Step 1: Clone Repository
\`\`\`bash
git clone https://github.com/yourusername/${projectName}.git
cd ${projectName}
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
# Get Flutter packages
flutter pub get

# Upgrade dependencies (optional)
flutter pub upgrade
\`\`\`

### Step 3: Generate Code (if needed)
\`\`\`bash
# Build generated files
flutter pub run build_runner build --delete-conflicting-outputs
\`\`\`

### Step 4: Verify Installation
\`\`\`bash
# Run Flutter doctor
flutter doctor

# Check project analysis
flutter analyze
\`\`\`

### Alternative: Using Docker
\`\`\`bash
# Build Docker image
docker build -t ${projectName} .

# Run development container
docker run -it --rm ${projectName} flutter pub get
\`\`\``;
  }

  /**
   * Generate project setup section
   */
  private generateProjectSetupSection(projectName: string): string {
    return `## Project Setup

### 1. Update Package Name
\`\`\`bash
# Update iOS bundle ID
cd ios
flutter clean
cd ..
\`\`\`

### 2. Configure Environment
Create \`.env\` file in project root:
\`\`\`
API_BASE_URL=https://api.example.com
ENVIRONMENT=development
ENABLE_ANALYTICS=true
\`\`\`

### 3. Update App Icons & Splash Screen
\`\`\`bash
# Place icons in assets/icons/
# Place splash image in assets/images/

# Update icon configuration in pubspec.yaml
flutter_icons:
  image_path: "assets/icons/app_icon.png"
  adaptive_icon_background: "#ffffff"

# Generate icons
flutter pub run flutter_launcher_icons:main
\`\`\`

### 4. Localization Setup (Optional)
\`\`\`bash
# Generate localization files
flutter gen-l10n
\`\`\`

### 5. Code Generation
\`\`\`bash
# Run build runner for models/serializers
flutter pub run build_runner build

# Watch mode for development
flutter pub run build_runner watch
\`\`\``;
  }

  /**
   * Generate Android setup section
   */
  private generateAndroidSetupSection(targetSDK: number, minSDK: number): string {
    return `## Android Setup

### Step 1: Android Studio Installation
1. Download from: https://developer.android.com/studio
2. Install Android SDKs:
   - Android API Level ${targetSDK} (compileSdk)
   - Android API Level ${minSDK} (minSdk)
3. Install Android Emulator or connect physical device

### Step 2: Update gradle.properties
File: \`android/gradle.properties\`
\`\`\`properties
org.gradle.jvmargs=-Xmx4096m
android.useAndroidX=true
android.enableJetifier=true
\`\`\`

### Step 3: Update build.gradle
File: \`android/app/build.gradle\`
\`\`\`gradle
android {
    compileSdkVersion ${targetSDK}
    
    defaultConfig {
        minSdkVersion ${minSDK}
        targetSdkVersion ${targetSDK}
    }
}
\`\`\`

### Step 4: Setup Signing (for Release)
\`\`\`bash
# Create keystore
keytool -genkey -v -keystore ~/key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key

# Create key.properties
echo "storePassword=your_password" > android/key.properties
echo "keyPassword=your_password" >> android/key.properties
echo "keyAlias=key" >> android/key.properties
echo "storeFile=/path/to/key.jks" >> android/key.properties
\`\`\`

### Step 5: Test on Device
\`\`\`bash
# List connected devices
flutter devices

# Run app
flutter run -d <device_id>

# Run in release mode
flutter run --release
\`\`\`

### Troubleshooting
- Clear Android build: \`flutter clean && flutter pub get\`
- Update SDK: \`flutter upgrade\`
- Check device connection: \`flutter devices\``;
  }

  /**
   * Generate iOS setup section
   */
  private generateIOSSetupSection(): string {
    return `## iOS Setup

### Step 1: Xcode Installation
1. Install from App Store or download from https://developer.apple.com/xcode/
2. Install Xcode command line tools: \`xcode-select --install\`
3. Agree to Xcode license: \`sudo xcodebuild -license accept\`

### Step 2: CocoaPods Installation
\`\`\`bash
# Install CocoaPods
sudo gem install cocoapods

# Setup pods in iOS directory
cd ios
pod install
cd ..
\`\`\`

### Step 3: Configure Signing
1. Open \`ios/Runner.xcworkspace\` in Xcode (NOT .xcodeproj)
2. Select "Runner" in left panel
3. Go to "Signing & Capabilities"
4. Select your Team
5. Update Bundle Identifier

### Step 4: Update Deployment Target
1. Select "Runner" project
2. Build Settings
3. Search "Minimum Deployment Target"
4. Set to 11.0 or higher

### Step 5: Test on Device
\`\`\`bash
# List iOS devices
flutter devices

# Run app
flutter run -d <device_id>

# Run on simulator
open -a Simulator
flutter run

# Build for release
flutter build ios --release
\`\`\`

### Troubleshooting
- Pod cache issue: \`cd ios && rm -rf Pods && rm Podfile.lock && pod install\`
- Update pods: \`cd ios && pod repo update && pod install\`
- Clear build: \`flutter clean && flutter pub get && cd ios && rm -rf Pods && pod install\``;
  }

  /**
   * Generate web setup section
   */
  private generateWebSetupSection(): string {
    return `## Web Setup

### Step 1: Enable Web Support
\`\`\`bash
# Check if web is enabled
flutter config --enable-web

# Verify
flutter config --list | grep web
\`\`\`

### Step 2: Development Server
\`\`\`bash
# Run development server
flutter run -d web-server

# Run in a specific browser
flutter run -d chrome --web-port=8080
flutter run -d firefox
flutter run -d edge
\`\`\`

### Step 3: Production Build
\`\`\`bash
# Build web release
flutter build web --release

# Output location: build/web/
\`\`\`

### Step 4: Deploy to Web Server
\`\`\`bash
# Using Firebase Hosting
firebase deploy --only hosting

# Using GitHub Pages
# Push build/web to gh-pages branch

# Using Nginx
# Copy build/web/* to /var/www/html/
\`\`\`

### Step 5: Performance Optimization
\`\`\`bash
# Analyze bundle size
flutter build web --analyze-size --release

# Enable compression in web server (nginx/Apache)
\`\`\`

### Troubleshooting
- Clear browser cache: Ctrl+Shift+Delete (Chrome)
- Hard refresh: Ctrl+Shift+R
- Check console: F12 -> Console tab`;
  }

  /**
   * Generate build section
   */
  private generateBuildSection(platforms: string[]): string {
    let section = `## Building for Production

### General Build Process
\`\`\`bash
# Clean build
flutter clean

# Get fresh dependencies
flutter pub get

# Run build runner (if needed)
flutter pub run build_runner build --delete-conflicting-outputs

# Run analyzer
flutter analyze
\`\`\`

### Build Outputs`;

    if (platforms.includes('android')) {
      section += `

#### Android (APK)
\`\`\`bash
flutter build apk --release
# Output: build/app/outputs/apk/release/app-release.apk
\`\`\`

#### Android (App Bundle)
\`\`\`bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
\`\`\``;
    }

    if (platforms.includes('ios')) {
      section += `

#### iOS
\`\`\`bash
flutter build ios --release
# Output: build/ios/iphoneos/Runner.app
\`\`\`

#### iOS (IPA)
\`\`\`bash
flutter build ipa --release
# Output: build/ios/ipa/
\`\`\``;
    }

    if (platforms.includes('web')) {
      section += `

#### Web
\`\`\`bash
flutter build web --release
# Output: build/web/
\`\`\``;
    }

    section += `

### Verification Before Upload
- [ ] All tests passing
- [ ] No analyzer warnings
- [ ] Performance acceptable
- [ ] Icons and splash screens correct
- [ ] Permissions configured
- [ ] API endpoints correct
- [ ] Build numbers incremented`;

    return section;
  }

  /**
   * Generate troubleshooting section
   */
  private generateTroubleshootingSection(): string {
    return `## Troubleshooting

### Common Issues

#### Issue: Flutter command not found
\`\`\`bash
# Solution: Add Flutter to PATH
export PATH="$PATH:\$(pwd)/flutter/bin"

# Or install Flutter properly from official guide
\`\`\`

#### Issue: CocoaPods errors (iOS)
\`\`\`bash
# Clear and reinstall
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
\`\`\`

#### Issue: Gradle errors (Android)
\`\`\`bash
# Clear Gradle cache
flutter clean
cd android
./gradlew clean
cd ..
flutter pub get
\`\`\`

#### Issue: Port already in use
\`\`\`bash
# Change port
flutter run --port=8081

# Kill process on port 8080 (Linux/Mac)
lsof -ti:8080 | xargs kill -9

# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
\`\`\`

#### Issue: Device not detected
\`\`\`bash
# Refresh device list
flutter devices --refresh

# Enable USB debugging (Android)
# Settings > Developer Options > USB Debugging

# Trust computer (iOS)
# Physical device: Settings > General > Trust
\`\`\`

#### Issue: Out of memory
\`\`\`bash
# Increase Java heap size
export JAVA_OPTS="-Xmx4096m"

# Or in android/gradle.properties
org.gradle.jvmargs=-Xmx4096m
\`\`\`

### Getting Help
- Flutter Docs: https://flutter.dev/docs
- Stack Overflow: tag [flutter]
- GitHub Issues: https://github.com/flutter/flutter/issues
- Flutter Community: https://discord.gg/N7Yshp7

### Performance Tips
1. **Use release builds** for testing performance
2. **Enable impeller** for better rendering (iOS/Android)
3. **Profile with DevTools**: \`flutter pub global run devtools\`
4. **Monitor memory** with Flutter Inspector
5. **Test on real devices** before production

### Security Checklist
- [ ] No API keys in source code
- [ ] Use environment variables for sensitive data
- [ ] Enable code obfuscation for release builds
- [ ] Remove debug symbols from production
- [ ] Validate all user inputs
- [ ] Implement proper error handling
- [ ] Use HTTPS for all API calls
- [ ] Enable code signing for iOS/Android`;
  }

  /**
   * Generate platform-specific guides
   */
  generatePlatformGuide(platform: string, projectName: string): string {
    const platform_lower = platform.toLowerCase();
    
    switch (platform_lower) {
      case 'android':
        return this.generateAndroidDetailedGuide(projectName);
      case 'ios':
        return this.generateIOSDetailedGuide(projectName);
      case 'web':
        return this.generateWebDetailedGuide(projectName);
      case 'windows':
        return this.generateWindowsDetailedGuide(projectName);
      case 'macos':
        return this.generateMacOSDetailedGuide(projectName);
      case 'linux':
        return this.generateLinuxDetailedGuide(projectName);
      default:
        return `# Setup Guide for ${platform}\n\nPlatform not recognized.`;
    }
  }

  private generateAndroidDetailedGuide(projectName: string): string {
    return `# ${projectName} - Android Development Guide

## Android Setup Requirements
- Android SDK 21 (minSDK) - 33 (targetSDK)
- Android Studio 2022.1+
- Android Emulator or physical device

## Detailed Setup Instructions
[Content continues...]`;
  }

  private generateIOSDetailedGuide(projectName: string): string {
    return `# ${projectName} - iOS Development Guide

## iOS Setup Requirements
- Xcode 14+
- CocoaPods 1.11+
- iOS 11.0 or higher

## Detailed Setup Instructions
[Content continues...]`;
  }

  private generateWebDetailedGuide(projectName: string): string {
    return `# ${projectName} - Web Development Guide

## Web Setup Requirements
- Chrome/Firefox/Safari browser
- Web-enabled Flutter project

## Detailed Setup Instructions
[Content continues...]`;
  }

  private generateWindowsDetailedGuide(projectName: string): string {
    return `# ${projectName} - Windows Development Guide

## Windows Setup Requirements
- Windows 10/11
- Visual Studio 2019+

## Detailed Setup Instructions
[Content continues...]`;
  }

  private generateMacOSDetailedGuide(projectName: string): string {
    return `# ${projectName} - macOS Development Guide

## macOS Setup Requirements
- macOS 10.13+
- Xcode 12+

## Detailed Setup Instructions
[Content continues...]`;
  }

  private generateLinuxDetailedGuide(projectName: string): string {
    return `# ${projectName} - Linux Development Guide

## Linux Setup Requirements
- Ubuntu 18.04+
- CMake, Ninja, pkg-config

## Detailed Setup Instructions
[Content continues...]`;
  }

  /**
   * Generate getting started quick start
   */
  generateQuickStart(projectName: string): string {
    return `# ${projectName} - Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites (1 min)
\`\`\`bash
# Check Flutter installation
flutter --version
# Should show: Flutter 3.10.0+
\`\`\`

### 2. Get Code (1 min)
\`\`\`bash
git clone <repository>
cd ${projectName}
\`\`\`

### 3. Install Dependencies (2 min)
\`\`\`bash
flutter pub get
\`\`\`

### 4. Run App (1 min)
\`\`\`bash
flutter run
\`\`\`

## Next Steps
- [ ] Explore the app
- [ ] Read the README.md
- [ ] Check the architecture guide
- [ ] Run tests: \`flutter test\`

## Useful Commands
\`\`\`bash
flutter run                    # Run app
flutter run --release         # Production build
flutter test                  # Run tests
flutter pub get               # Update dependencies
flutter clean                 # Clean build
flutter analyze               # Code analysis
flutter build web             # Build for web
flutter build apk             # Build Android APK
flutter build ios             # Build iOS
\`\`\``;
  }
}
