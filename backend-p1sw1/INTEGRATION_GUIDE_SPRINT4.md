/**
 * INTEGRATION GUIDE: Flutter Export Routes
 * 
 * How to integrate the Sprint 4 export routes into the main backend router
 */

/**
 * Step 1: Add to your main router file (e.g., backend-p1sw1/routes/router.ts or index.ts)
 * 
 * BEFORE:
 * ```typescript
 * import { Router } from 'express';
 * import { authController } from './controller/auth.controller';
 * 
 * const router = Router();
 * 
 * router.post('/auth/login', authController.login);
 * router.post('/auth/register', authController.register);
 * 
 * export default router;
 * ```
 * 
 * AFTER:
 */

import { Router } from 'express';
import { authController } from './controller/auth.controller';
import { registerFlutterExportRoutes } from './routes/flutter-export.routes';

const router = Router();

// Existing routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// NEW: Register Flutter export routes
registerFlutterExportRoutes(router);

export default router;

/**
 * Step 2: Install required dependencies
 * 
 * Run in terminal:
 * ```bash
 * npm install adm-zip change-case prettier
 * npm install --save-dev @types/adm-zip
 * ```
 */

/**
 * Step 3: Ensure the following directory structure exists
 * 
 * backend-p1sw1/
 * ├── models/
 * │   └── dart-generation.models.ts (created in this sprint)
 * ├── services/
 * │   ├── dart-code-generator.service.ts (existing)
 * │   └── layout-generator.service.ts (created in this sprint)
 * ├── controller/
 * │   └── project-export.controller.ts (created in this sprint)
 * └── routes/
 *     └── flutter-export.routes.ts (created in this sprint)
 */

/**
 * Step 4: Verify the exports directory exists
 * 
 * The controller creates it automatically, but you can also create it manually:
 * ```bash
 * mkdir -p exports/
 * ```
 */

/**
 * Step 5: Test the endpoints
 * 
 * Using curl or Postman:
 * 
 * REQUEST:
 * ```bash
 * curl -X POST http://localhost:3000/api/v1/export/export \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "screens": [
 *       {
 *         "className": "HomeScreen",
 *         "components": [
 *           {
 *             "type": "Text",
 *             "label": "Welcome",
 *             "position": 0
 *           }
 *         ]
 *       }
 *     ],
 *     "projectName": "test_app",
 *     "projectVersion": "1.0.0"
 *   }'
 * ```
 * 
 * RESPONSE:
 * ```json
 * {
 *   "success": true,
 *   "projectName": "test_app",
 *   "fileSize": 2500,
 *   "componentCount": 1,
 *   "screenCount": 1,
 *   "downloadUrl": "/api/v1/export/download/abc123def456",
 *   "timestamp": "2025-01-26T12:00:00Z"
 * }
 * ```
 */

/**
 * Step 6: Verify routes are registered
 * 
 * When the server starts, you should see:
 * ```
 * ✅ Flutter Export routes registered
 *    POST   /api/v1/export/export                 - Export project as ZIP
 *    POST   /api/v1/export/export-preview        - Preview project structure
 *    GET    /api/v1/export/download/:projectId   - Download ZIP file
 *    GET    /api/v1/export/status/:projectId     - Get export status
 *    DELETE /api/v1/export/cleanup/:projectId    - Cleanup export
 * ```
 */

/**
 * API ENDPOINTS SUMMARY
 * 
 * 1. EXPORT PROJECT (Main Endpoint)
 *    POST /api/v1/export/export
 *    
 *    Request:
 *    {
 *      "screens": Screen[],
 *      "projectName": "my_app",
 *      "projectVersion": "1.0.0"
 *    }
 *    
 *    Response:
 *    {
 *      "success": boolean,
 *      "projectName": string,
 *      "fileSize": number,
 *      "componentCount": number,
 *      "screenCount": number,
 *      "downloadUrl": string,
 *      "timestamp": string
 *    }
 * 
 * 
 * 2. PREVIEW PROJECT (Structure Only)
 *    POST /api/v1/export/export-preview
 *    
 *    Response:
 *    {
 *      "success": boolean,
 *      "projectName": string,
 *      "fileCount": number,
 *      "totalSize": number,
 *      "files": [
 *        {
 *          "path": "lib/main.dart",
 *          "size": 1200,
 *          "preview": "..."
 *        }
 *      ],
 *      "generationTime": number
 *    }
 * 
 * 
 * 3. DOWNLOAD PROJECT
 *    GET /api/v1/export/download/:projectId
 *    
 *    Response: Binary ZIP file
 * 
 * 
 * 4. GET EXPORT STATUS
 *    GET /api/v1/export/status/:projectId
 *    
 *    Response:
 *    {
 *      "success": boolean,
 *      "projectId": string,
 *      "fileName": string,
 *      "fileSize": number,
 *      "createdAt": Date,
 *      "expiresAt": Date
 *    }
 * 
 * 
 * 5. CLEANUP EXPORT
 *    DELETE /api/v1/export/cleanup/:projectId
 *    
 *    Response:
 *    {
 *      "success": boolean,
 *      "message": "Project cleaned up successfully"
 *    }
 */

/**
 * ENVIRONMENT VARIABLES (Optional)
 * 
 * Add to your .env file if needed:
 * 
 * EXPORT_DIR=./exports
 * EXPORT_MAX_SIZE=52428800  # 50MB in bytes
 * EXPORT_CLEANUP_INTERVAL=3600000  # 1 hour in milliseconds
 * EXPORT_EXPIRATION_TIME=86400000  # 24 hours in milliseconds
 */

/**
 * ERROR HANDLING
 * 
 * The controller returns structured errors:
 * 
 * 400 Bad Request:
 * {
 *   "success": false,
 *   "error": "VALIDATION_ERROR",
 *   "message": "At least one screen is required",
 *   "details": ["At least one screen is required"]
 * }
 * 
 * 404 Not Found:
 * {
 *   "success": false,
 *   "error": "NOT_FOUND",
 *   "message": "Project not found"
 * }
 * 
 * 500 Internal Server Error:
 * {
 *   "success": false,
 *   "error": "INTERNAL_SERVER_ERROR",
 *   "message": "An unexpected error occurred",
 *   "details": "Error message..."
 * }
 */

/**
 * FRONTEND INTEGRATION
 * 
 * In your Angular component (or any frontend):
 * 
 * ```typescript
 * import { HttpClient } from '@angular/common/http';
 * import { ExportProjectRequest, ExportProjectResponse } from './models';
 * 
 * export class ExportService {
 *   constructor(private http: HttpClient) {}
 *   
 *   exportProject(request: ExportProjectRequest) {
 *     return this.http.post<ExportProjectResponse>(
 *       '/api/v1/export/export',
 *       request
 *     );
 *   }
 *   
 *   downloadProject(projectId: string) {
 *     window.open(`/api/v1/export/download/${projectId}`, '_blank');
 *   }
 *   
 *   getStatus(projectId: string) {
 *     return this.http.get(`/api/v1/export/status/${projectId}`);
 *   }
 * }
 * ```
 */

/**
 * TESTING WITH JEST
 * 
 * Example test file:
 * 
 * ```typescript
 * import { ProjectExportController } from './project-export.controller';
 * import { ExportProjectRequest } from '../models';
 * 
 * describe('ProjectExportController', () => {
 *   let controller: ProjectExportController;
 *   
 *   beforeEach(() => {
 *     controller = new ProjectExportController();
 *   });
 *   
 *   it('should export project as ZIP', async () => {
 *     const request: ExportProjectRequest = {
 *       screens: [
 *         {
 *           className: 'HomeScreen',
 *           components: []
 *         }
 *       ],
 *       projectName: 'test_app'
 *     };
 *     
 *     const mockReq = { body: request };
 *     const mockRes = {
 *       json: jest.fn(),
 *       status: jest.fn().mockReturnThis()
 *     };
 *     
 *     await controller.exportProject(mockReq as any, mockRes as any);
 *     
 *     expect(mockRes.json).toHaveBeenCalledWith(
 *       expect.objectContaining({
 *         success: true,
 *         projectName: 'test_app'
 *       })
 *     );
 *   });
 * });
 * ```
 */

/**
 * TROUBLESHOOTING
 * 
 * Issue: "Cannot find module 'adm-zip'"
 * Solution: npm install adm-zip
 * 
 * Issue: "Export directory not found"
 * Solution: Controller creates it automatically, or manually: mkdir exports/
 * 
 * Issue: "ZIP file is empty"
 * Solution: Ensure screens array is not empty in request
 * 
 * Issue: "Download returns 404"
 * Solution: Check projectId is correct and file hasn't expired (24h)
 * 
 * Issue: "Project name validation error"
 * Solution: Use lowercase letters, numbers, underscores only. Max 50 chars.
 */

/**
 * MONITORING & METRICS
 * 
 * The controller provides statistics:
 * 
 * ```typescript
 * const stats = controller.getExportStats();
 * // {
 * //   totalFiles: 5,
 * //   totalSize: 12500,
 * //   oldestFile: Date,
 * //   newestFile: Date
 * // }
 * ```
 * 
 * Auto cleanup runs every hour:
 * - Removes exports older than 24 hours
 * - Logs each cleanup
 */

/**
 * SECURITY BEST PRACTICES
 * 
 * 1. Validate all input (name, version, screens)
 * 2. Limit file size (50MB by default)
 * 3. Clean up old exports (24h expiration)
 * 4. Use secure temp directory
 * 5. Sanitize file paths
 * 6. Consider rate limiting
 * 7. Add authentication check
 */

/**
 * PERFORMANCE TIPS
 * 
 * 1. Generate in background job for large projects
 * 2. Cache common layouts
 * 3. Use streaming for large downloads
 * 4. Monitor memory usage
 * 5. Implement progress webhooks
 */

export default router;
