/**
 * Flutter Project Export Component
 * 
 * Handles the UI for exporting Flutter projects as ZIP files
 */

import { Component, OnInit, ViewChild, TemplateRef, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../common/services/config.service';

// Local interfaces for Flutter export
interface ComponentItem {
  type: string;
  label: string;
  position: number;
  [key: string]: any;
}

interface UMLAtributo {
  titulo: string;
  tipo?: string;
  visibility?: string;
  defaultValue?: string;
}

interface UMLMetodo {
  nombre: string;
  parametros?: { nombre: string; tipo: string }[];
  tipoRetorno?: string;
  visibility?: string;
}

interface Screen {
  className: string;
  components: ComponentItem[];
  atributos?: UMLAtributo[];  // ⭐ From diagram
  metodos?: UMLMetodo[];      // ⭐ From diagram
}

interface ExportProjectRequest {
  screens: Screen[];
  projectName?: string;
  projectVersion?: string;
}

interface ExportProjectResponse {
  projectId: string;
  status: string;
  message?: string;
  fileSize?: number;
  success?: boolean;
  projectName?: string;
  screenCount?: number;
  componentCount?: number;
  timestamp?: string;
  downloadUrl?: string;
}

interface ExportState {
  isExporting: boolean;
  progress: number;
  currentPhase: string;
  estimatedTime: number;
}

interface ExportHistory {
  projectId: string;
  projectName: string;
  fileSize: number;
  screenCount: number;
  componentCount: number;
  timestamp: string;
  downloadUrl: string;
  status: 'completed' | 'failed' | 'downloading';
}

@Component({
  selector: 'app-flutter-export',
  templateUrl: './flutter-export.component.html',
  styleUrls: ['./flutter-export.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FlutterExportComponent implements OnInit {
  screens: Screen[] = [];
  projectName: string = 'flutter_app';
  projectVersion: string = '1.0.0';

  exportState: ExportState = {
    isExporting: false,
    progress: 0,
    currentPhase: '',
    estimatedTime: 0
  };

  exportHistory: ExportHistory[] = [];
  previewData: any = null;
  showPreview: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  readonly MAX_PROJECT_NAME_LENGTH = 50;
  readonly FILE_SIZE_LIMIT = 50; // MB

  private apiUrl: string = '';

  // Inject token for optional service
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private configService: ConfigService
  ) {
    // Try to get state in constructor (during navigation)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state;
      console.log('🎯 Router state in constructor:', state);
      if (state['screens'] && Array.isArray(state['screens'])) {
        this.screens = state['screens'];
      }
      if (state['projectName']) {
        this.projectName = state['projectName'];
      }
    }
  }

  ngOnInit(): void {
    // Initialize API URL from config service
    this.apiUrl = this.configService.apiUrl;
    
    // Debug: Log current screens
    console.log('📊 Screens loaded in component:', this.screens);
    console.log('📊 Screen count:', this.screens.length);
    
    // If no screens were loaded from router state, use defaults
    if (this.screens.length === 0) {
      this.screens = [
        {
          className: 'HomeScreen',
          components: [
            {
              type: 'Text',
              label: 'Welcome to Flutter',
              position: 0
            }
          ]
        }
      ];
    }
    this.loadExportHistory();
  }

  /**
   * Get total number of components across all screens
   */
  getTotalComponents(): number {
    return this.screens.reduce((sum, s) => sum + s.components.length, 0);
  }

  /**
   * Validate project name
   */
  isValidProjectName(): boolean {
    if (!this.projectName || this.projectName.length === 0) {
      return false;
    }
    if (this.projectName.length > this.MAX_PROJECT_NAME_LENGTH) {
      return false;
    }
    return /^[a-z_][a-z0-9_]*$/.test(this.projectName);
  }

  /**
   * Preview project structure before export
   */
  async previewExport(): Promise<void> {
    if (!this.validateExport()) {
      return;
    }

    try {
      this.exportState.isExporting = true;
      this.exportState.currentPhase = 'Generating preview...';
      this.errorMessage = '';

      const request: ExportProjectRequest = {
        screens: this.screens,
        projectName: this.projectName,
        projectVersion: this.projectVersion
      };

      // This would call the backend endpoint
      // const response = await this.chatService.post('/api/v1/export/export-preview', request);

      // Mock response for now
      this.previewData = {
        success: true,
        projectName: this.projectName,
        fileCount: 15,
        totalSize: 2500,
        files: [
          {
            path: 'lib/main.dart',
            size: 1200,
            preview: 'void main() { runApp(const MyApp()); }'
          },
          {
            path: 'pubspec.yaml',
            size: 800,
            preview: 'name: flutter_app\nversion: 1.0.0'
          }
        ],
        generationTime: 245
      };

      this.showPreview = true;
      this.exportState.isExporting = false;
    } catch (error: any) {
      this.handleExportError(error);
    }
  }

  /**
   * Export project as ZIP
   */
  async exportProject(): Promise<void> {
    if (!this.validateExport()) {
      return;
    }

    try {
      this.exportState.isExporting = true;
      this.exportState.progress = 0;
      this.exportState.currentPhase = 'Initializing export...';
      this.errorMessage = '';
      this.successMessage = '';

      const request: ExportProjectRequest = {
        screens: this.screens,
        projectName: this.projectName,
        projectVersion: this.projectVersion
      };

      // ⭐ DEBUG: Log what we're sending
      console.log('🚀 Exporting project:', {
        screenCount: this.screens.length,
        projectName: this.projectName,
        screens: this.screens.map(s => ({
          className: s.className,
          hasAtributos: !!s.atributos && s.atributos.length > 0,
          atributosCount: s.atributos?.length || 0,
          hasMetodos: !!s.metodos && s.metodos.length > 0,
          metodosCount: s.metodos?.length || 0
        }))
      });

      // Simulate export progress
      this.simulateExportProgress();

      // Call backend endpoint
      const response = await new Promise<ExportProjectResponse>((resolve, reject) => {
        this.http.post<ExportProjectResponse>(
          `${this.apiUrl}/api/v1/export/export`,
          request
        ).subscribe(
          (data: ExportProjectResponse) => resolve(data),
          (error: any) => reject(error)
        );
      });

      if (response.success) {
        this.handleExportSuccess(response);
      } else {
        this.errorMessage = 'Export failed. Please try again.';
      }
    } catch (error: any) {
      this.handleExportError(error);
    }
  }

  /**
   * Download exported project
   */
  async downloadProject(downloadUrl: string): Promise<void> {
    try {
      // Download file using HttpClient with blob response
      this.http.get(downloadUrl, { responseType: 'blob' }).subscribe(
        (blob: Blob) => {
          // Create a blob URL and download
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${this.projectName || 'flutter_app'}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          
          this.successMessage = 'Download started successfully!';
        },
        (error: any) => {
          this.errorMessage = 'Failed to download project. Please try again.';
          console.error('Download error:', error);
        }
      );
    } catch (error: any) {
      this.errorMessage = 'Failed to download project. Please try again.';
      console.error('Download error:', error);
    }
  }

  /**
   * Simulate export progress
   */
  private simulateExportProgress(): void {
    const phases = [
      'Generating project structure...',
      'Creating screen files...',
      'Generating main.dart...',
      'Creating theme configuration...',
      'Generating pubspec.yaml...',
      'Creating ZIP package...',
      'Finalizing export...'
    ];

    let phaseIndex = 0;
    const interval = setInterval(() => {
      if (phaseIndex < phases.length) {
        this.exportState.currentPhase = phases[phaseIndex];
        this.exportState.progress = Math.round((phaseIndex / phases.length) * 100);
        phaseIndex++;
      } else {
        clearInterval(interval);
        this.exportState.progress = 100;
      }
    }, 300);
  }

  /**
   * Handle successful export
   */
  private handleExportSuccess(response: ExportProjectResponse): void {
    this.exportState.isExporting = false;
    this.exportState.progress = 100;
    this.exportState.currentPhase = 'Export completed!';

    const historyEntry: ExportHistory = {
      projectId: response.projectId || this.generateProjectId(),
      projectName: response.projectName || this.projectName,
      fileSize: response.fileSize || 0,
      screenCount: response.screenCount || 0,
      componentCount: response.componentCount || 0,
      timestamp: response.timestamp || new Date().toISOString(),
      downloadUrl: response.downloadUrl || '',
      status: 'completed'
    };

    this.exportHistory.unshift(historyEntry);
    this.saveExportHistory();

    this.successMessage = `✅ Project exported successfully! File size: ${this.formatFileSize(response.fileSize || 0)}`;

    // Auto-download after 1 second
    setTimeout(() => {
      if (response.downloadUrl) {
        this.downloadProject(response.downloadUrl);
      }
    }, 1000);

    // Reset form after 3 seconds
    setTimeout(() => {
      this.resetForm();
    }, 3000);
  }

  /**
   * Handle export error
   */
  private handleExportError(error: any): void {
    this.exportState.isExporting = false;
    this.errorMessage =
      error.message || 'An error occurred during export. Please try again.';
    console.error('Export error:', error);
  }

  /**
   * Validate export request
   */
  private validateExport(): boolean {
    this.errorMessage = '';

    if (this.screens.length === 0) {
      this.errorMessage = 'Please add at least one screen to export';
      return false;
    }

    if (!this.isValidProjectName()) {
      this.errorMessage =
        'Project name is invalid. Must be lowercase with underscores, 1-50 chars.';
      return false;
    }

    return true;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate unique project ID
   */
  private generateProjectId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    this.projectName = 'flutter_app';
    this.projectVersion = '1.0.0';
    this.showPreview = false;
    this.previewData = null;
    this.successMessage = '';
  }

  /**
   * Load export history from localStorage
   */
  private loadExportHistory(): void {
    try {
      const stored = localStorage.getItem('flutter_export_history');
      if (stored) {
        this.exportHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  }

  /**
   * Save export history to localStorage
   */
  private saveExportHistory(): void {
    try {
      localStorage.setItem(
        'flutter_export_history',
        JSON.stringify(this.exportHistory.slice(0, 10))
      );
    } catch (error) {
      console.error('Error saving export history:', error);
    }
  }

  /**
   * Clear export history
   */
  clearHistory(): void {
    this.exportHistory = [];
    localStorage.removeItem('flutter_export_history');
  }

  /**
   * Remove history entry
   */
  removeHistoryEntry(index: number): void {
    this.exportHistory.splice(index, 1);
    this.saveExportHistory();
  }

  /**
   * Retry failed export
   */
  retryExport(entry: ExportHistory): void {
    this.projectName = entry.projectName;
    this.exportProject();
  }

  /**
   * Get progress bar color based on phase
   */
  getProgressColor(): string {
    if (this.exportState.progress < 50) return 'progress-danger';
    if (this.exportState.progress < 80) return 'progress-warning';
    return 'progress-success';
  }

  /**
   * Check if export can proceed
   */
  canExport(): boolean {
    return !this.exportState.isExporting && this.screens.length > 0;
  }
}
