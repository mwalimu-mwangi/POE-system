import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertUnitSchema, 
  insertTaskSchema, 
  insertAssignmentSchema, 
  insertSubmissionSchema,
  insertAssessmentSchema,
  insertVerificationSchema,
  insertNotificationSchema,
  insertActivityLogSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only specific file types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, MP4, and DOCX are allowed.'));
  }
};

const upload = multer({ 
  storage: storage_config,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB size limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Log all activities
  const logActivity = async (req: Request, userId: number, action: string, details: any = {}) => {
    try {
      await storage.createActivityLog({
        userId,
        action,
        details,
        timestamp: new Date(),
        ipAddress: req.ip
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Middleware to ensure user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Middleware to ensure user has a specific role
  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated() || !req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      next();
    };
  };

  // Create error handling middleware for zod validation
  const validateSchema = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        next(error);
      }
    };
  };

  // ===== User Management Routes =====
  app.get('/api/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (req.user!.role !== 'admin' && req.user!.id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only access your own user information' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/users/deactivate/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await storage.updateUser(userId, { ...user, isActive: false });
      logActivity(req, req.user!.id, 'deactivated_user', { targetUser: userId });
      
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to deactivate user' });
    }
  });

  // ===== Unit & Task Routes =====
  app.get('/api/units', requireAuth, async (req, res) => {
    try {
      const units = await storage.getAllUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch units' });
    }
  });

  app.post('/api/units', requireAuth, requireRole(['admin']), validateSchema(insertUnitSchema), async (req, res) => {
    try {
      const unit = await storage.createUnit(req.body);
      logActivity(req, req.user!.id, 'created_unit', { unitId: unit.id });
      res.status(201).json(unit);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create unit' });
    }
  });

  app.get('/api/units/:id/tasks', requireAuth, async (req, res) => {
    try {
      const unitId = parseInt(req.params.id);
      const tasks = await storage.getTasksByUnit(unitId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', requireAuth, requireRole(['admin']), validateSchema(insertTaskSchema), async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      logActivity(req, req.user!.id, 'created_task', { taskId: task.id });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  // ===== Assignment Routes =====
  app.get('/api/assignments', requireAuth, requireRole(['admin', 'assessor']), async (req, res) => {
    try {
      let assignments = [];
      if (req.user!.role === 'admin') {
        assignments = await storage.getAllAssignments();
      } else {
        assignments = await storage.getAssignmentsByAssessor(req.user!.id);
      }
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  app.post('/api/assignments', requireAuth, requireRole(['admin']), validateSchema(insertAssignmentSchema), async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      
      // Create notification for the assessor
      await storage.createNotification({
        userId: assignment.assessorId,
        title: 'New Trainee Assigned',
        message: `You have been assigned to a new trainee for Unit ${assignment.unitId}`,
        isRead: false,
        type: 'system',
        linkedItemId: assignment.id
      });
      
      logActivity(req, req.user!.id, 'created_assignment', { assignmentId: assignment.id });
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create assignment' });
    }
  });

  // ===== Submission Routes =====
  app.get('/api/submissions', requireAuth, async (req, res) => {
    try {
      let submissions = [];
      
      if (req.user!.role === 'trainee') {
        submissions = await storage.getSubmissionsByTrainee(req.user!.id);
      } else if (req.user!.role === 'assessor') {
        submissions = await storage.getSubmissionsByAssessor(req.user!.id);
      } else if (req.user!.role === 'internal_verifier' || req.user!.role === 'external_verifier' || req.user!.role === 'admin') {
        submissions = await storage.getAllSubmissions();
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/submissions/:id', requireAuth, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      // Check if user has permission to view this submission
      if (req.user!.role === 'trainee' && submission.traineeId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own submissions' });
      }
      
      // Get the assignment to check if assessor is assigned to this trainee for this unit
      if (req.user!.role === 'assessor') {
        const assignments = await storage.getAssignmentsByAssessor(req.user!.id);
        const isAssigned = assignments.some(a => 
          a.traineeId === submission.traineeId && a.unitId === submission.unitId
        );
        
        if (!isAssigned) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to this trainee' });
        }
      }
      
      // Include submission files
      const files = await storage.getSubmissionFiles(submissionId);
      const assessments = await storage.getAssessmentsBySubmission(submissionId);
      
      res.json({
        submission,
        files,
        assessments
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch submission details' });
    }
  });

  app.post('/api/submissions', requireAuth, requireRole(['trainee']), upload.array('files', 10), async (req, res) => {
    try {
      const submissionData = JSON.parse(req.body.submissionData);
      
      // Validate submission data
      try {
        insertSubmissionSchema.parse({
          ...submissionData,
          traineeId: req.user!.id
        });
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        throw error;
      }
      
      // Create submission
      const submission = await storage.createSubmission({
        ...submissionData,
        traineeId: req.user!.id,
        status: 'pending'
      });
      
      // Process files
      const files = req.files as Express.Multer.File[];
      
      for (const file of files) {
        await storage.createSubmissionFile({
          submissionId: submission.id,
          fileName: file.originalname,
          fileType: file.mimetype,
          filePath: file.path,
          fileSize: file.size,
          uploadDate: new Date()
        });
      }
      
      // Find the assessor assigned to this trainee for this unit
      const assignments = await storage.getAssignmentsByTrainee(req.user!.id);
      const assignment = assignments.find(a => a.unitId === submission.unitId);
      
      if (assignment) {
        // Notify the assessor
        await storage.createNotification({
          userId: assignment.assessorId,
          title: 'New Submission Received',
          message: `A new submission for ${submission.title} has been received and requires your review`,
          isRead: false,
          type: 'submission',
          linkedItemId: submission.id
        });
      }
      
      logActivity(req, req.user!.id, 'created_submission', { submissionId: submission.id });
      
      res.status(201).json({
        submission,
        files: await storage.getSubmissionFiles(submission.id)
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create submission' });
    }
  });

  // ===== Assessment Routes =====
  app.post('/api/assessments', requireAuth, requireRole(['assessor']), validateSchema(insertAssessmentSchema), async (req, res) => {
    try {
      const { submissionId } = req.body;
      
      // Get the submission
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      // Check if assessor is assigned to this trainee for this unit
      const assignments = await storage.getAssignmentsByAssessor(req.user!.id);
      const isAssigned = assignments.some(a => 
        a.traineeId === submission.traineeId && a.unitId === submission.unitId
      );
      
      if (!isAssigned) {
        return res.status(403).json({ message: 'Forbidden: You are not assigned to this trainee' });
      }
      
      // Create the assessment
      const assessment = await storage.createAssessment({
        ...req.body,
        assessorId: req.user!.id
      });
      
      // Update the submission status based on assessment status
      await storage.updateSubmission(submissionId, {
        ...submission,
        status: req.body.status === 'approved' ? 'approved' : 
                req.body.status === 'rejected' ? 'rejected' : 'resubmit'
      });
      
      // Notify the trainee
      await storage.createNotification({
        userId: submission.traineeId,
        title: 'Assessment Feedback Available',
        message: `Your submission for ${submission.title} has been assessed`,
        isRead: false,
        type: 'assessment',
        linkedItemId: assessment.id
      });
      
      // Notify internal verifiers if submission is approved
      if (req.body.status === 'approved') {
        const verifiers = await storage.getUsersByRole('internal_verifier');
        for (const verifier of verifiers) {
          await storage.createNotification({
            userId: verifier.id,
            title: 'Verification Required',
            message: `A new assessment needs verification`,
            isRead: false,
            type: 'verification',
            linkedItemId: assessment.id
          });
        }
      }
      
      logActivity(req, req.user!.id, 'created_assessment', { assessmentId: assessment.id });
      
      res.status(201).json(assessment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create assessment' });
    }
  });

  // ===== Verification Routes =====
  app.get('/api/verifications', requireAuth, requireRole(['internal_verifier', 'external_verifier', 'admin']), async (req, res) => {
    try {
      let verifications = [];
      
      if (req.user!.role === 'internal_verifier') {
        verifications = await storage.getVerificationsByVerifier(req.user!.id);
      } else if (req.user!.role === 'external_verifier') {
        verifications = await storage.getVerificationsByVerifier(req.user!.id);
      } else {
        verifications = await storage.getAllVerifications();
      }
      
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verifications' });
    }
  });

  app.post('/api/verifications', requireAuth, requireRole(['internal_verifier', 'external_verifier']), validateSchema(insertVerificationSchema), async (req, res) => {
    try {
      const { assessmentId } = req.body;
      
      // Create the verification
      const verification = await storage.createVerification({
        ...req.body,
        verifierId: req.user!.id,
        verifierType: req.user!.role === 'internal_verifier' ? 'internal' : 'external'
      });
      
      // Get the assessment and submission details
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      const submission = await storage.getSubmission(assessment.submissionId);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      // Notify the assessor
      await storage.createNotification({
        userId: assessment.assessorId,
        title: 'Verification Completed',
        message: `Your assessment has been verified`,
        isRead: false,
        type: 'verification',
        linkedItemId: verification.id
      });
      
      // If internal verification is rejected, notify trainee
      if (req.body.status === 'rejected') {
        await storage.createNotification({
          userId: submission.traineeId,
          title: 'Assessment Verification Issue',
          message: `There was an issue with your assessment verification`,
          isRead: false,
          type: 'verification',
          linkedItemId: verification.id
        });
      }
      
      // If internal verification is confirmed and verifier is internal, notify external verifiers
      if (req.body.status === 'confirmed' && req.user!.role === 'internal_verifier') {
        const externalVerifiers = await storage.getUsersByRole('external_verifier');
        for (const verifier of externalVerifiers) {
          await storage.createNotification({
            userId: verifier.id,
            title: 'External Verification Required',
            message: `An assessment is ready for external verification`,
            isRead: false,
            type: 'verification',
            linkedItemId: verification.id
          });
        }
      }
      
      logActivity(req, req.user!.id, 'created_verification', { verificationId: verification.id });
      
      res.status(201).json(verification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create verification' });
    }
  });

  // ===== Notification Routes =====
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden: You can only mark your own notifications as read' });
      }
      
      await storage.updateNotification(notificationId, { ...notification, isRead: true });
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // ===== Activity Log Routes =====
  app.get('/api/activity-logs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await storage.getAllActivityLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  });

  app.get('/api/activity-logs/user/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only admins can see other users' logs
      if (req.user!.role !== 'admin' && req.user!.id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own activity logs' });
      }
      
      const logs = await storage.getActivityLogsByUser(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  });

  // ===== Report Routes =====
  app.get('/api/reports/trainee-performance', requireAuth, requireRole(['admin', 'assessor']), async (req, res) => {
    try {
      // Filter by assignments if assessor
      let traineeIds: number[] = [];
      
      if (req.user!.role === 'assessor') {
        const assignments = await storage.getAssignmentsByAssessor(req.user!.id);
        traineeIds = [...new Set(assignments.map(a => a.traineeId))];
        if (traineeIds.length === 0) {
          return res.json([]);
        }
      }
      
      const report = await storage.getTraineePerformanceReport(traineeIds);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate trainee performance report' });
    }
  });

  app.get('/api/reports/assessor-activity', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const report = await storage.getAssessorActivityReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate assessor activity report' });
    }
  });

  app.get('/api/reports/assessment-outcomes', requireAuth, requireRole(['admin', 'assessor', 'internal_verifier', 'external_verifier']), async (req, res) => {
    try {
      const report = await storage.getAssessmentOutcomesReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate assessment outcomes report' });
    }
  });

  // ===== Portfolio Export Routes =====
  app.get('/api/export-portfolio/:traineeId', requireAuth, async (req, res) => {
    try {
      const traineeId = parseInt(req.params.traineeId);
      
      // Check permissions
      if (req.user!.role === 'trainee' && req.user!.id !== traineeId) {
        return res.status(403).json({ message: 'Forbidden: You can only export your own portfolio' });
      }
      
      if (req.user!.role === 'assessor') {
        const assignments = await storage.getAssignmentsByAssessor(req.user!.id);
        const isAssigned = assignments.some(a => a.traineeId === traineeId);
        
        if (!isAssigned) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to this trainee' });
        }
      }
      
      // Generate the portfolio PDF
      const pdfPath = await storage.generatePortfolioPDF(traineeId);
      
      // Log the activity
      logActivity(req, req.user!.id, 'exported_portfolio', { traineeId });
      
      // Send the PDF file
      res.download(pdfPath);
    } catch (error) {
      res.status(500).json({ message: 'Failed to export portfolio' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
