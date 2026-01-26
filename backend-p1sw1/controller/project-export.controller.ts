/**
 * Project Export Controller
 * 
 * Handles Flutter project export, ZIP creation, and download delivery
 */

import { Router, Request, Response } from 'express';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import {
  ProjectGenerationRequest,
  ExportProjectRequest,
  ExportProjectResponse,
  GenerationError,
  GeneratedProject
} from '../models/dart-generation.models';
import { FlutterCodeGeneratorService } from '../services/flutter-code-generator.service';
import { DartCodeGeneratorService } from '../services/dart-code-generator.service';

export class ProjectExportController {
  private flutterGenerator: FlutterCodeGeneratorService;
  private dartGenerator: DartCodeGeneratorService;
  private exportsDir: string;
  private readonly MAX_PROJECT_SIZE = 50 * 1024 * 1024; // 50MB

  constructor() {
    this.flutterGenerator = new FlutterCodeGeneratorService();
    this.dartGenerator = new DartCodeGeneratorService();
    this.exportsDir = path.join(process.cwd(), 'exports');
    this.ensureExportsDirectory();
  }

  /**
   * Generate Flutter project with FlutterCodeGeneratorService for screens
   */
  private async generateFlutterProject(screens: any[]): Promise<Map<string, string>> {
    // Get base project structure from DartCodeGeneratorService
    const dartProject = await this.dartGenerator.generateProjectStructure(screens);
    
    // Replace screen files with enhanced version using FlutterCodeGeneratorService
    const files = new Map(dartProject);
    
    // Clear old screen files
    const entriesToDelete: string[] = [];
    files.forEach((value, key) => {
      if (key.startsWith('lib/screens/')) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => files.delete(key));

    // Generate screen files with FlutterCodeGeneratorService (duplicate name handling)
    const screenNameCount = new Map<string, number>();
    for (const screen of screens) {
      let screenName = this.dartGenerator['toSnakeCase'](screen.className);
      
      // Handle duplicate names by appending a number
      if (screenNameCount.has(screenName)) {
        screenNameCount.set(screenName, (screenNameCount.get(screenName) || 0) + 1);
        screenName = `${screenName}_${screenNameCount.get(screenName)}`;
      } else {
        screenNameCount.set(screenName, 1);
      }
      
      const screenPath = `lib/screens/${screenName}.dart`;
      const screenCode = this.flutterGenerator.generarCodigoDart(screen);
      files.set(screenPath, screenCode);
    }

    return files;
  }

  /**
   * Ensure exports directory exists
   */
  private ensureExportsDirectory(): void {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Get all routes for project export
   */
  getRoutes(): Router {
    const router = Router();

    router.post('/export', (req: Request, res: Response) =>
      this.exportProject(req, res)
    );

    router.post('/export-preview', (req: Request, res: Response) =>
      this.exportProjectPreview(req, res)
    );

    router.get('/download/:projectId', (req: Request, res: Response) =>
      this.downloadProject(req, res)
    );

    router.get('/status/:projectId', (req: Request, res: Response) =>
      this.getExportStatus(req, res)
    );

    router.delete('/cleanup/:projectId', (req: Request, res: Response) =>
      this.cleanupProject(req, res)
    );

    return router;
  }

  /**
   * Export project as ZIP file
   */
  private async exportProject(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const request: ExportProjectRequest = req.body;

      // Validate request
      const validationErrors = this.validateExportRequest(request);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
        });
        return;
      }

      // Generate project
      const projectId = randomUUID();
      const generatedProject = await this.generateFlutterProject(
        request.screens
      );

      if (!generatedProject || generatedProject.size === 0) {
        throw new GenerationError(
          'GENERATION_FAILED',
          'Failed to generate project',
          'Empty project generated'
        );
      }

      // Create ZIP file
      const zipPath = await this.createProjectZip(
        projectId,
        request.projectName || 'flutter_app',
        generatedProject as any
      );

      // Get file size
      const fileSize = fs.statSync(zipPath).size;

      // Validate file size
      if (fileSize > this.MAX_PROJECT_SIZE) {
        fs.unlinkSync(zipPath);
        throw new GenerationError(
          'FILE_TOO_LARGE',
          `Project exceeds maximum size of ${this.MAX_PROJECT_SIZE / 1024 / 1024}MB`
        );
      }

      // Generate response
      const response: ExportProjectResponse = {
        success: true,
        projectId: projectId,
        projectName: request.projectName || 'flutter_app',
        fileSize: fileSize,
        componentCount: request.screens.reduce(
          (sum, screen) => sum + screen.components.length,
          0
        ),
        screenCount: request.screens.length,
        downloadUrl: `http://localhost:3000/api/v1/export/download/${projectId}`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Export project preview (without ZIP)
   */
  private async exportProjectPreview(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const request: ExportProjectRequest = req.body;

      // Generate project structure
      const generated = await this.dartGenerator.generateProjectStructure(
        request.screens
      );

      if (!generated || generated.size === 0) {
        throw new GenerationError(
          'PREVIEW_FAILED',
          'Failed to generate preview'
        );
      }

      // Return file structure
      const fileList = Array.from(generated.entries()).map(
        ([path, content]) => ({
          path,
          size: Buffer.byteLength(content, 'utf8'),
          preview: content.substring(0, 200)
        })
      );

      res.json({
        success: true,
        projectName: request.projectName || 'flutter_app',
        fileCount: fileList.length,
        totalSize: fileList.reduce((sum, f) => sum + f.size, 0),
        files: fileList,
        generationTime: 0
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Create ZIP file from generated project
   */
  private async createProjectZip(
    projectId: string,
    projectName: string,
    generatedProject: any
  ): Promise<string> {
    const zip = new AdmZip();

    // Handle both Map and object formats
    let files: Map<string, string>;
    if (generatedProject instanceof Map) {
      files = generatedProject;
    } else if (generatedProject.files instanceof Map) {
      files = generatedProject.files;
    } else if (typeof generatedProject.files === 'object') {
      files = new Map(Object.entries(generatedProject.files));
    } else {
      throw new Error('Invalid project structure');
    }

    // Add all generated files to ZIP
    files.forEach((content, filePath) => {
      zip.addFile(filePath, Buffer.from(content, 'utf8'));
    });

    // Add metadata file
    const metadata = {
      projectId,
      projectName,
      generatedAt: new Date().toISOString(),
      fileCount: files.size,
      totalSize: Array.from(files.values()).reduce((sum, content) => sum + content.length, 0),
      generationTime: generatedProject.generationTime || 0,
      version: '1.0.0'
    };

    zip.addFile(
      'PROJECT_METADATA.json',
      Buffer.from(JSON.stringify(metadata, null, 2), 'utf8')
    );

    // Save ZIP file
    const zipPath = path.join(
      this.exportsDir,
      `${projectId}_${projectName}.zip`
    );

    zip.writeZip(zipPath);

    return zipPath;
  }

  /**
   * Download exported project
   */
  private async downloadProject(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      // Find ZIP file
      const files = fs.readdirSync(this.exportsDir);
      const zipFile = files.find(f => f.startsWith(projectId));

      if (!zipFile) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      const zipPath = path.join(this.exportsDir, zipFile);

      // Verify file exists and is readable
      if (!fs.existsSync(zipPath)) {
        res.status(404).json({
          success: false,
          error: 'Project file not found'
        });
        return;
      }

      // Send file
      res.download(zipPath, zipFile, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get export status
   */
  private async getExportStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      const files = fs.readdirSync(this.exportsDir);
      const zipFile = files.find(f => f.startsWith(projectId));

      if (!zipFile) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      const zipPath = path.join(this.exportsDir, zipFile);
      const stats = fs.statSync(zipPath);

      res.json({
        success: true,
        projectId,
        fileName: zipFile,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        expiresAt: new Date(stats.birthtime.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Cleanup exported project
   */
  private async cleanupProject(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { projectId } = req.params;

      const files = fs.readdirSync(this.exportsDir);
      const zipFile = files.find(f => f.startsWith(projectId));

      if (!zipFile) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      const zipPath = path.join(this.exportsDir, zipFile);
      fs.unlinkSync(zipPath);

      res.json({
        success: true,
        message: 'Project cleaned up successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Validate export request
   */
  private validateExportRequest(request: ExportProjectRequest): string[] {
    const errors: string[] = [];

    if (!request.screens || request.screens.length === 0) {
      errors.push('At least one screen is required');
    }

    if (request.projectName && request.projectName.length > 50) {
      errors.push('Project name cannot exceed 50 characters');
    }

    if (request.projectName && !/^[a-z_][a-z0-9_]*$/.test(request.projectName)) {
      errors.push(
        'Project name must start with a letter or underscore and contain only lowercase letters, numbers, and underscores'
      );
    }

    if (request.screens) {
      request.screens.forEach((screen, index) => {
        if (!screen.className) {
          errors.push(`Screen ${index} missing className`);
        }

        if (!Array.isArray(screen.components)) {
          errors.push(`Screen ${index} has invalid components`);
        }
      });
    }

    return errors;
  }

  /**
   * Handle errors
   */
  private handleError(res: Response, error: any): void {
    console.error('Export error:', error);

    if (error instanceof GenerationError) {
      res.status(400).json({
        success: false,
        error: error.code,
        message: error.message,
        details: error.details
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: error.message
    });
  }

  /**
   * Cleanup old exports (older than 24 hours)
   */
  cleanupOldExports(): void {
    try {
      const files = fs.readdirSync(this.exportsDir);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.exportsDir, file);
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.birthtime.getTime();

        if (ageMs > oneDayMs) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old export: ${file}`);
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get export directory size
   */
  getExportDirectorySize(): number {
    try {
      const files = fs.readdirSync(this.exportsDir);
      let totalSize = 0;

      files.forEach(file => {
        const filePath = path.join(this.exportsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return totalSize;
    } catch (error) {
      console.error('Error getting directory size:', error);
      return 0;
    }
  }

  /**
   * Get export directory statistics
   */
  getExportStats(): {
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  } {
    try {
      const files = fs.readdirSync(this.exportsDir);
      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;

      files.forEach(file => {
        const filePath = path.join(this.exportsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const birthTime = stats.birthtime.getTime();
        oldestTime = Math.min(oldestTime, birthTime);
        newestTime = Math.max(newestTime, birthTime);
      });

      return {
        totalFiles: files.length,
        totalSize,
        oldestFile: oldestTime === Infinity ? null : new Date(oldestTime),
        newestFile: newestTime === 0 ? null : new Date(newestTime)
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null
      };
    }
  }
}
