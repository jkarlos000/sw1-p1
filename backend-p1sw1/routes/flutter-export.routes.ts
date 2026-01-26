/**
 * Sprint 4 - Flutter Export Routes
 * 
 * Integrates all Flutter project export endpoints into the main router
 */

import { Router } from 'express';
import { ProjectExportController } from '../controller/project-export.controller';

export function registerFlutterExportRoutes(router: Router): void {
  const exportController = new ProjectExportController();

  // Mount export routes
  router.use('/api/v1/export', exportController.getRoutes());

  // Setup periodic cleanup of old exports
  setInterval(() => {
    exportController.cleanupOldExports();
  }, 60 * 60 * 1000); // Every hour

  console.log('✅ Flutter Export routes registered');
  console.log('   POST   /api/v1/export/export                 - Export project as ZIP');
  console.log('   POST   /api/v1/export/export-preview        - Preview project structure');
  console.log('   GET    /api/v1/export/download/:projectId   - Download ZIP file');
  console.log('   GET    /api/v1/export/status/:projectId     - Get export status');
  console.log('   DELETE /api/v1/export/cleanup/:projectId    - Cleanup export');
}
