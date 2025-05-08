import { 
  users, User, InsertUser,
  units, Unit, InsertUnit,
  tasks, Task, InsertTask,
  assignments, Assignment, InsertAssignment,
  submissions, Submission, InsertSubmission,
  submissionFiles, SubmissionFile, InsertSubmissionFile,
  assessments, Assessment, InsertAssessment, 
  verifications, Verification, InsertVerification,
  notifications, Notification, InsertNotification,
  activityLogs, ActivityLog, InsertActivityLog,
  departments, Department, InsertDepartment,
  studyLevels, StudyLevel, InsertStudyLevel,
  courses, Course, InsertCourse,
  classIntakes, ClassIntake, InsertClassIntake,
  modules, Module, InsertModule
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const MemoryStore = createMemoryStore(session);

// Define additional types for reports
interface TraineePerformance {
  traineeId: number;
  traineeName: string;
  submissionsCount: number;
  approvedCount: number;
  rejectedCount: number;
  resubmitCount: number;
  pendingCount: number;
  averageTurnaround: number; // in days
}

interface AssessorActivity {
  assessorId: number;
  assessorName: string;
  assessmentsCount: number;
  approvedCount: number;
  rejectedCount: number;
  resubmitCount: number;
  averageTurnaround: number; // in days
}

interface AssessmentOutcome {
  unitId: number;
  unitName: string;
  taskId: number;
  taskName: string;
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  resubmitCount: number;
  pendingCount: number;
}

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Department Management
  createDepartment(department: InsertDepartment): Promise<Department>;
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  
  // Study Level Management
  createStudyLevel(studyLevel: InsertStudyLevel): Promise<StudyLevel>;
  getStudyLevel(id: number): Promise<StudyLevel | undefined>;
  getAllStudyLevels(): Promise<StudyLevel[]>;
  
  // Course Management
  createCourse(course: InsertCourse): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByDepartment(departmentId: number): Promise<Course[]>;
  getCoursesByStudyLevel(studyLevelId: number): Promise<Course[]>;
  
  // Class Intake Management
  createClassIntake(classIntake: InsertClassIntake): Promise<ClassIntake>;
  getClassIntake(id: number): Promise<ClassIntake | undefined>;
  getAllClassIntakes(): Promise<ClassIntake[]>;
  getClassIntakesByCourse(courseId: number): Promise<ClassIntake[]>;
  
  // Module Management
  createModule(module: InsertModule): Promise<Module>;
  getModule(id: number): Promise<Module | undefined>;
  getAllModules(): Promise<Module[]>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  
  // Unit Management
  createUnit(unit: InsertUnit): Promise<Unit>;
  getUnit(id: number): Promise<Unit | undefined>;
  getAllUnits(): Promise<Unit[]>;
  
  // Task Management
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUnit(unitId: number): Promise<Task[]>;
  
  // Assignment Management
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  getAssignmentsByTrainee(traineeId: number): Promise<Assignment[]>;
  getAssignmentsByAssessor(assessorId: number): Promise<Assignment[]>;
  
  // Submission Management
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  updateSubmission(id: number, submission: Partial<Submission>): Promise<Submission>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionsByTrainee(traineeId: number): Promise<Submission[]>;
  getSubmissionsByAssessor(assessorId: number): Promise<Submission[]>;
  
  // Submission File Management
  createSubmissionFile(file: InsertSubmissionFile): Promise<SubmissionFile>;
  getSubmissionFile(id: number): Promise<SubmissionFile | undefined>;
  getSubmissionFiles(submissionId: number): Promise<SubmissionFile[]>;
  
  // Assessment Management
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsBySubmission(submissionId: number): Promise<Assessment[]>;
  
  // Verification Management
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerification(id: number): Promise<Verification | undefined>;
  getAllVerifications(): Promise<Verification[]>;
  getVerificationsByVerifier(verifierId: number): Promise<Verification[]>;
  
  // Notification Management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotification(id: number): Promise<Notification | undefined>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  
  // Activity Log Management
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number): Promise<ActivityLog[]>;
  
  // Reports
  getTraineePerformanceReport(traineeIds?: number[]): Promise<TraineePerformance[]>;
  getAssessorActivityReport(): Promise<AssessorActivity[]>;
  getAssessmentOutcomesReport(): Promise<AssessmentOutcome[]>;
  
  // Portfolio Export
  generatePortfolioPDF(traineeId: number): Promise<string>;
  
  // Session Store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private departmentsMap: Map<number, Department>;
  private studyLevelsMap: Map<number, StudyLevel>;
  private coursesMap: Map<number, Course>;
  private classIntakesMap: Map<number, ClassIntake>;
  private modulesMap: Map<number, Module>;
  private unitsMap: Map<number, Unit>;
  private tasksMap: Map<number, Task>;
  private assignmentsMap: Map<number, Assignment>;
  private submissionsMap: Map<number, Submission>;
  private submissionFilesMap: Map<number, SubmissionFile>;
  private assessmentsMap: Map<number, Assessment>;
  private verificationsMap: Map<number, Verification>;
  private notificationsMap: Map<number, Notification>;
  private activityLogsMap: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private departmentIdCounter: number;
  private studyLevelIdCounter: number;
  private courseIdCounter: number;
  private classIntakeIdCounter: number;
  private moduleIdCounter: number;
  private unitIdCounter: number;
  private taskIdCounter: number;
  private assignmentIdCounter: number;
  private submissionIdCounter: number;
  private submissionFileIdCounter: number;
  private assessmentIdCounter: number;
  private verificationIdCounter: number;
  private notificationIdCounter: number;
  private activityLogIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.usersMap = new Map();
    this.departmentsMap = new Map();
    this.studyLevelsMap = new Map();
    this.coursesMap = new Map();
    this.classIntakesMap = new Map();
    this.modulesMap = new Map();
    this.unitsMap = new Map();
    this.tasksMap = new Map();
    this.assignmentsMap = new Map();
    this.submissionsMap = new Map();
    this.submissionFilesMap = new Map();
    this.assessmentsMap = new Map();
    this.verificationsMap = new Map();
    this.notificationsMap = new Map();
    this.activityLogsMap = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.studyLevelIdCounter = 1;
    this.courseIdCounter = 1;
    this.classIntakeIdCounter = 1;
    this.moduleIdCounter = 1;
    this.unitIdCounter = 1;
    this.taskIdCounter = 1;
    this.assignmentIdCounter = 1;
    this.submissionIdCounter = 1;
    this.submissionFileIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.verificationIdCounter = 1;
    this.notificationIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some data for development
    this.seedInitialData();
  }

  // ===== User Management =====
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure all required fields have values
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      departmentId: insertUser.departmentId ?? null,
      courseId: insertUser.courseId ?? null,
      classIntakeId: insertUser.classIntakeId ?? null,
      isActive: insertUser.isActive ?? true
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.role === role);
  }

  // ===== Department Management =====
  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const department: Department = { 
      ...insertDepartment, 
      id,
      description: insertDepartment.description ?? null
    };
    this.departmentsMap.set(id, department);
    return department;
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departmentsMap.get(id);
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departmentsMap.values());
  }

  // ===== Study Level Management =====
  async createStudyLevel(insertStudyLevel: InsertStudyLevel): Promise<StudyLevel> {
    const id = this.studyLevelIdCounter++;
    const studyLevel: StudyLevel = { 
      ...insertStudyLevel, 
      id,
      description: insertStudyLevel.description ?? null 
    };
    this.studyLevelsMap.set(id, studyLevel);
    return studyLevel;
  }

  async getStudyLevel(id: number): Promise<StudyLevel | undefined> {
    return this.studyLevelsMap.get(id);
  }

  async getAllStudyLevels(): Promise<StudyLevel[]> {
    return Array.from(this.studyLevelsMap.values());
  }

  // ===== Course Management =====
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const course: Course = { 
      ...insertCourse, 
      id,
      description: insertCourse.description ?? null
    };
    this.coursesMap.set(id, course);
    return course;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.coursesMap.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.coursesMap.values());
  }

  async getCoursesByDepartment(departmentId: number): Promise<Course[]> {
    return Array.from(this.coursesMap.values()).filter(
      course => course.departmentId === departmentId
    );
  }

  async getCoursesByStudyLevel(studyLevelId: number): Promise<Course[]> {
    return Array.from(this.coursesMap.values()).filter(
      course => course.studyLevelId === studyLevelId
    );
  }

  // ===== Class Intake Management =====
  async createClassIntake(insertClassIntake: InsertClassIntake): Promise<ClassIntake> {
    const id = this.classIntakeIdCounter++;
    const classIntake: ClassIntake = { ...insertClassIntake, id };
    this.classIntakesMap.set(id, classIntake);
    return classIntake;
  }

  async getClassIntake(id: number): Promise<ClassIntake | undefined> {
    return this.classIntakesMap.get(id);
  }

  async getAllClassIntakes(): Promise<ClassIntake[]> {
    return Array.from(this.classIntakesMap.values());
  }

  async getClassIntakesByCourse(courseId: number): Promise<ClassIntake[]> {
    return Array.from(this.classIntakesMap.values()).filter(
      classIntake => classIntake.courseId === courseId
    );
  }

  // ===== Module Management =====
  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.moduleIdCounter++;
    const module: Module = { 
      ...insertModule, 
      id,
      description: insertModule.description ?? null,
      credits: insertModule.credits ?? 0
    };
    this.modulesMap.set(id, module);
    return module;
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modulesMap.get(id);
  }

  async getAllModules(): Promise<Module[]> {
    return Array.from(this.modulesMap.values());
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return Array.from(this.modulesMap.values()).filter(
      module => module.courseId === courseId
    );
  }

  // ===== Unit Management =====
  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.unitIdCounter++;
    const unit: Unit = { 
      ...insertUnit, 
      id,
      description: insertUnit.description ?? null,
      moduleId: insertUnit.moduleId ?? null
    };
    this.unitsMap.set(id, unit);
    return unit;
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    return this.unitsMap.get(id);
  }

  async getAllUnits(): Promise<Unit[]> {
    return Array.from(this.unitsMap.values());
  }

  // ===== Task Management =====
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { 
      ...insertTask, 
      id,
      description: insertTask.description ?? null,
      criteria: insertTask.criteria ?? {}
    };
    this.tasksMap.set(id, task);
    return task;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksMap.get(id);
  }

  async getTasksByUnit(unitId: number): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).filter(
      task => task.unitId === unitId
    );
  }

  // ===== Assignment Management =====
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentIdCounter++;
    const assignment: Assignment = { ...insertAssignment, id, createdAt: new Date() };
    this.assignmentsMap.set(id, assignment);
    return assignment;
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignmentsMap.get(id);
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values());
  }

  async getAssignmentsByTrainee(traineeId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      assignment => assignment.traineeId === traineeId
    );
  }

  async getAssignmentsByAssessor(assessorId: number): Promise<Assignment[]> {
    return Array.from(this.assignmentsMap.values()).filter(
      assignment => assignment.assessorId === assessorId
    );
  }

  // ===== Submission Management =====
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionIdCounter++;
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      submissionDate: new Date(),
      status: insertSubmission.status || 'pending',
      description: insertSubmission.description ?? null
    };
    this.submissionsMap.set(id, submission);
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissionsMap.get(id);
  }

  async updateSubmission(id: number, submissionData: Partial<Submission>): Promise<Submission> {
    const submission = await this.getSubmission(id);
    if (!submission) {
      throw new Error(`Submission with id ${id} not found`);
    }
    
    const updatedSubmission = { ...submission, ...submissionData };
    this.submissionsMap.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissionsMap.values());
  }

  async getSubmissionsByTrainee(traineeId: number): Promise<Submission[]> {
    return Array.from(this.submissionsMap.values()).filter(
      submission => submission.traineeId === traineeId
    );
  }

  async getSubmissionsByAssessor(assessorId: number): Promise<Submission[]> {
    // Get all trainee IDs assigned to this assessor
    const assignments = await this.getAssignmentsByAssessor(assessorId);
    const assignedTraineeUnitPairs = assignments.map(a => ({ traineeId: a.traineeId, unitId: a.unitId }));
    
    // Get submissions from these trainees
    return Array.from(this.submissionsMap.values()).filter(submission => 
      assignedTraineeUnitPairs.some(pair => 
        pair.traineeId === submission.traineeId && pair.unitId === submission.unitId
      )
    );
  }

  // ===== Submission File Management =====
  async createSubmissionFile(insertFile: InsertSubmissionFile): Promise<SubmissionFile> {
    const id = this.submissionFileIdCounter++;
    const file: SubmissionFile = { ...insertFile, id, uploadDate: new Date() };
    this.submissionFilesMap.set(id, file);
    return file;
  }

  async getSubmissionFile(id: number): Promise<SubmissionFile | undefined> {
    return this.submissionFilesMap.get(id);
  }

  async getSubmissionFiles(submissionId: number): Promise<SubmissionFile[]> {
    return Array.from(this.submissionFilesMap.values()).filter(
      file => file.submissionId === submissionId
    );
  }

  // ===== Assessment Management =====
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const assessment: Assessment = { 
      ...insertAssessment, 
      id, 
      assessmentDate: new Date(),
      criteria: insertAssessment.criteria ?? {},
      feedback: insertAssessment.feedback ?? null
    };
    this.assessmentsMap.set(id, assessment);
    return assessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessmentsMap.get(id);
  }

  async getAssessmentsBySubmission(submissionId: number): Promise<Assessment[]> {
    return Array.from(this.assessmentsMap.values()).filter(
      assessment => assessment.submissionId === submissionId
    );
  }

  // ===== Verification Management =====
  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const id = this.verificationIdCounter++;
    const verification: Verification = { 
      ...insertVerification, 
      id, 
      verificationDate: new Date(),
      comments: insertVerification.comments ?? null
    };
    this.verificationsMap.set(id, verification);
    return verification;
  }

  async getVerification(id: number): Promise<Verification | undefined> {
    return this.verificationsMap.get(id);
  }

  async getAllVerifications(): Promise<Verification[]> {
    return Array.from(this.verificationsMap.values());
  }

  async getVerificationsByVerifier(verifierId: number): Promise<Verification[]> {
    return Array.from(this.verificationsMap.values()).filter(
      verification => verification.verifierId === verifierId
    );
  }

  // ===== Notification Management =====
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: new Date(),
      isRead: false,
      linkedItemId: insertNotification.linkedItemId ?? null
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notificationsMap.get(id);
  }

  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    const updatedNotification = { ...notification, ...notificationData };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ===== Activity Log Management =====
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      timestamp: new Date(),
      details: insertLog.details ?? {},
      ipAddress: insertLog.ipAddress ?? null
    };
    this.activityLogsMap.set(id, log);
    return log;
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getActivityLogsByUser(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ===== Reports =====
  async getTraineePerformanceReport(specificTraineeIds?: number[]): Promise<TraineePerformance[]> {
    // Get all trainees or filter by specified IDs
    const trainees = specificTraineeIds?.length 
      ? await Promise.all(specificTraineeIds.map(id => this.getUser(id)))
      : await this.getUsersByRole('trainee');
    
    // Filter out undefined entries
    const validTrainees = trainees.filter(Boolean) as User[];
    
    const result: TraineePerformance[] = [];
    
    for (const trainee of validTrainees) {
      const submissions = await this.getSubmissionsByTrainee(trainee.id);
      
      let approvedCount = 0;
      let rejectedCount = 0;
      let resubmitCount = 0;
      let pendingCount = 0;
      let totalTurnaround = 0;
      let assessedCount = 0;
      
      for (const submission of submissions) {
        switch (submission.status) {
          case 'approved': approvedCount++; break;
          case 'rejected': rejectedCount++; break;
          case 'resubmit': resubmitCount++; break;
          case 'pending': pendingCount++; break;
        }
        
        // Get assessments for turnaround calculation
        const assessments = await this.getAssessmentsBySubmission(submission.id);
        if (assessments.length > 0) {
          const assessment = assessments[0]; // Use the first assessment
          const turnaround = (assessment.assessmentDate.getTime() - submission.submissionDate.getTime()) / (1000 * 60 * 60 * 24); // days
          totalTurnaround += turnaround;
          assessedCount++;
        }
      }
      
      result.push({
        traineeId: trainee.id,
        traineeName: trainee.fullName,
        submissionsCount: submissions.length,
        approvedCount,
        rejectedCount,
        resubmitCount,
        pendingCount,
        averageTurnaround: assessedCount > 0 ? totalTurnaround / assessedCount : 0
      });
    }
    
    return result;
  }

  async getAssessorActivityReport(): Promise<AssessorActivity[]> {
    const assessors = await this.getUsersByRole('assessor');
    const result: AssessorActivity[] = [];
    
    for (const assessor of assessors) {
      const assessments = Array.from(this.assessmentsMap.values())
        .filter(assessment => assessment.assessorId === assessor.id);
      
      let approvedCount = 0;
      let rejectedCount = 0;
      let resubmitCount = 0;
      let totalTurnaround = 0;
      
      for (const assessment of assessments) {
        switch (assessment.status) {
          case 'approved': approvedCount++; break;
          case 'rejected': rejectedCount++; break;
          case 'resubmit': resubmitCount++; break;
        }
        
        // Calculate turnaround time
        const submission = await this.getSubmission(assessment.submissionId);
        if (submission) {
          const turnaround = (assessment.assessmentDate.getTime() - submission.submissionDate.getTime()) / (1000 * 60 * 60 * 24); // days
          totalTurnaround += turnaround;
        }
      }
      
      result.push({
        assessorId: assessor.id,
        assessorName: assessor.fullName,
        assessmentsCount: assessments.length,
        approvedCount,
        rejectedCount,
        resubmitCount,
        averageTurnaround: assessments.length > 0 ? totalTurnaround / assessments.length : 0
      });
    }
    
    return result;
  }

  async getAssessmentOutcomesReport(): Promise<AssessmentOutcome[]> {
    const units = await this.getAllUnits();
    const result: AssessmentOutcome[] = [];
    
    for (const unit of units) {
      const tasks = await this.getTasksByUnit(unit.id);
      
      for (const task of tasks) {
        // Find submissions for this task
        const submissions = Array.from(this.submissionsMap.values())
          .filter(submission => submission.taskId === task.id);
        
        let approvedCount = 0;
        let rejectedCount = 0;
        let resubmitCount = 0;
        let pendingCount = 0;
        
        for (const submission of submissions) {
          switch (submission.status) {
            case 'approved': approvedCount++; break;
            case 'rejected': rejectedCount++; break;
            case 'resubmit': resubmitCount++; break;
            case 'pending': pendingCount++; break;
          }
        }
        
        result.push({
          unitId: unit.id,
          unitName: unit.name,
          taskId: task.id,
          taskName: task.name,
          totalSubmissions: submissions.length,
          approvedCount,
          rejectedCount,
          resubmitCount,
          pendingCount
        });
      }
    }
    
    return result;
  }

  // ===== Portfolio Export =====
  async generatePortfolioPDF(traineeId: number): Promise<string> {
    const trainee = await this.getUser(traineeId);
    if (!trainee) {
      throw new Error(`Trainee with id ${traineeId} not found`);
    }
    
    const submissions = await this.getSubmissionsByTrainee(traineeId);
    
    // Create PDF document
    const outputDir = path.resolve(process.cwd(), 'generated-pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `portfolio_${traineeId}_${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    // Add title page
    doc.fontSize(24).text('Portfolio of Evidence', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Trainee: ${trainee.fullName}`, { align: 'center' });
    doc.fontSize(12).text(`ID: ${traineeId}`, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Table of contents
    doc.addPage();
    doc.fontSize(16).text('Table of Contents', { align: 'center' });
    doc.moveDown();
    
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      doc.fontSize(12).text(`${i+1}. ${submission.title}`);
      doc.moveDown(0.5);
    }
    
    // Add each submission with its assessments
    for (const submission of submissions) {
      doc.addPage();
      doc.fontSize(18).text(`Submission: ${submission.title}`);
      doc.moveDown();
      
      // Submission details
      const unit = await this.getUnit(submission.unitId);
      const task = await this.getTask(submission.taskId);
      
      doc.fontSize(12).text(`Unit: ${unit?.name || 'Unknown Unit'}`);
      doc.fontSize(12).text(`Task: ${task?.name || 'Unknown Task'}`);
      doc.fontSize(12).text(`Submission Date: ${submission.submissionDate.toLocaleDateString()}`);
      doc.fontSize(12).text(`Status: ${submission.status}`);
      doc.moveDown();
      
      if (submission.description) {
        doc.fontSize(12).text('Description:');
        doc.fontSize(10).text(submission.description);
        doc.moveDown();
      }
      
      // List files
      const files = await this.getSubmissionFiles(submission.id);
      if (files.length > 0) {
        doc.fontSize(12).text('Attached Files:');
        for (const file of files) {
          doc.fontSize(10).text(`- ${file.fileName} (${file.fileType}, ${Math.round(file.fileSize / 1024)} KB)`);
        }
        doc.moveDown();
      }
      
      // Assessment feedback
      const assessments = await this.getAssessmentsBySubmission(submission.id);
      if (assessments.length > 0) {
        doc.fontSize(12).text('Assessment Feedback:');
        for (const assessment of assessments) {
          const assessor = await this.getUser(assessment.assessorId);
          doc.fontSize(10).text(`Assessment by: ${assessor?.fullName || 'Unknown Assessor'}`);
          doc.fontSize(10).text(`Date: ${assessment.assessmentDate.toLocaleDateString()}`);
          doc.fontSize(10).text(`Status: ${assessment.status}`);
          
          if (assessment.feedback) {
            doc.fontSize(10).text('Feedback:');
            doc.fontSize(9).text(assessment.feedback);
          }
          
          // Criteria checklist
          if (assessment.criteria) {
            doc.fontSize(10).text('Assessment Criteria:');
            for (const [key, value] of Object.entries(assessment.criteria)) {
              doc.fontSize(9).text(`- ${key}: ${value ? 'Met' : 'Not Met'}`);
            }
          }
          
          doc.moveDown();
          
          // Verification information
          const verifications = Array.from(this.verificationsMap.values())
            .filter(v => v.assessmentId === assessment.id);
          
          if (verifications.length > 0) {
            doc.fontSize(10).text('Verification:');
            for (const verification of verifications) {
              const verifier = await this.getUser(verification.verifierId);
              doc.fontSize(9).text(`${verification.verifierType.charAt(0).toUpperCase() + verification.verifierType.slice(1)} Verification by: ${verifier?.fullName || 'Unknown Verifier'}`);
              doc.fontSize(9).text(`Date: ${verification.verificationDate.toLocaleDateString()}`);
              doc.fontSize(9).text(`Status: ${verification.status}`);
              
              if (verification.comments) {
                doc.fontSize(9).text(`Comments: ${verification.comments}`);
              }
            }
          }
        }
      }
    }
    
    // Finalize PDF
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(outputPath);
      });
      stream.on('error', reject);
    });
  }

  // ===== Initialize with sample data =====
  private async seedInitialData() {
    // Import hash function from auth.ts
    const { hashPassword } = await import('./auth');
    
    // Create admin user
    await this.createUser({
      username: "admin",
      password: await hashPassword("password"), // Correctly hashed with scrypt
      fullName: "Administrator",
      email: "admin@example.com",
      role: "admin",
      isActive: true,
      departmentId: null,
      courseId: null,
      classIntakeId: null
    });
    
    // Create sample departments
    const engineeringDept = await this.createDepartment({
      name: "Engineering",
      code: "ENG",
      description: "Engineering and technical studies department"
    });
    
    const businessDept = await this.createDepartment({
      name: "Business Studies",
      code: "BUS",
      description: "Business and management department"
    });
    
    const itDept = await this.createDepartment({
      name: "Information Technology",
      code: "IT",
      description: "IT and computing department"
    });
    
    // Create sample study levels
    const lv3 = await this.createStudyLevel({
      name: "Level 3",
      description: "Basic vocational qualification",
      order: 1
    });
    
    const lv4 = await this.createStudyLevel({
      name: "Level 4 - Artisan",
      description: "Artisan qualification",
      order: 2
    });
    
    const lv5 = await this.createStudyLevel({
      name: "Level 5 - Craft Artisan",
      description: "Craft artisan qualification",
      order: 3
    });
    
    const lv6 = await this.createStudyLevel({
      name: "Level 6 - Diploma",
      description: "Diploma qualification",
      order: 4
    });
    
    // Create sample courses
    const softwareDev = await this.createCourse({
      name: "Software Development",
      code: "SD101",
      description: "Software development and programming",
      departmentId: itDept.id,
      studyLevelId: lv4.id
    });
    
    const networkAdmin = await this.createCourse({
      name: "Network Administration",
      code: "NA101",
      description: "Network setup and administration",
      departmentId: itDept.id,
      studyLevelId: lv4.id
    });
    
    const mechanicalEng = await this.createCourse({
      name: "Mechanical Engineering",
      code: "ME101",
      description: "Mechanical engineering principles and practice",
      departmentId: engineeringDept.id,
      studyLevelId: lv5.id
    });
    
    const businessAdmin = await this.createCourse({
      name: "Business Administration",
      code: "BA101",
      description: "Business management and administration",
      departmentId: businessDept.id,
      studyLevelId: lv6.id
    });
    
    // Create sample class intakes
    const sdIntake2023 = await this.createClassIntake({
      name: "Software Development Intake 2023",
      startDate: "2023-01-15",
      endDate: "2024-12-15",
      courseId: softwareDev.id
    });
    
    const naIntake2023 = await this.createClassIntake({
      name: "Network Administration Intake 2023",
      startDate: "2023-01-15",
      endDate: "2024-12-15",
      courseId: networkAdmin.id
    });
    
    const meIntake2023 = await this.createClassIntake({
      name: "Mechanical Engineering Intake 2023",
      startDate: "2023-01-15",
      endDate: "2025-12-15",
      courseId: mechanicalEng.id
    });
    
    const baIntake2023 = await this.createClassIntake({
      name: "Business Administration Intake 2023",
      startDate: "2023-01-15",
      endDate: "2025-12-15",
      courseId: businessAdmin.id
    });
    
    // Create sample modules
    const programmingModule = await this.createModule({
      name: "Programming Fundamentals",
      code: "PRG101",
      description: "Introduction to programming concepts and practices",
      courseId: softwareDev.id
    });
    
    const databaseModule = await this.createModule({
      name: "Database Systems",
      code: "DB101",
      description: "Introduction to database design and management",
      courseId: softwareDev.id
    });
    
    const networkingModule = await this.createModule({
      name: "Networking Fundamentals",
      code: "NET101",
      description: "Basic networking concepts and protocols",
      courseId: networkAdmin.id
    });
    
    const engineeringModule = await this.createModule({
      name: "Engineering Principles",
      code: "ENG101",
      description: "Basic engineering principles and applications",
      courseId: mechanicalEng.id
    });
    
    const businessModule = await this.createModule({
      name: "Business Management",
      code: "BUS101",
      description: "Principles of business management",
      courseId: businessAdmin.id
    });
    
    // Create sample units
    const unit1 = await this.createUnit({
      name: "Database Design",
      code: "DB101",
      description: "Introduction to database design principles"
    });
    
    const unit2 = await this.createUnit({
      name: "Programming Fundamentals",
      code: "PRG101",
      description: "Introduction to programming concepts"
    });
    
    const unit3 = await this.createUnit({
      name: "Networking",
      code: "NET101",
      description: "Introduction to computer networks"
    });
    
    const unit4 = await this.createUnit({
      name: "Cybersecurity",
      code: "SEC101",
      description: "Introduction to cybersecurity principles"
    });
    
    // Create sample tasks
    await this.createTask({
      unitId: unit1.id,
      name: "ER Modeling",
      description: "Create entity-relationship diagrams",
      criteria: {
        "Entities correctly identified": true,
        "Relationships properly defined": true,
        "Attributes appropriately placed": true,
        "Cardinality correctly specified": true
      }
    });
    
    await this.createTask({
      unitId: unit1.id,
      name: "Normalization & SQL",
      description: "Normalize database to 3NF and write SQL queries",
      criteria: {
        "Database normalized to 3NF": true,
        "SQL DDL statements correct": true,
        "SQL DML statements functioning": true,
        "Queries retrieve correct data": true
      }
    });
    
    await this.createTask({
      unitId: unit2.id,
      name: "OOP Concepts",
      description: "Implement object-oriented programming concepts",
      criteria: {
        "Classes properly defined": true,
        "Inheritance correctly implemented": true,
        "Encapsulation principles followed": true,
        "Polymorphism demonstrated": true
      }
    });
    
    await this.createTask({
      unitId: unit2.id,
      name: "Application Development",
      description: "Develop a simple application using OOP",
      criteria: {
        "Requirements fulfilled": true,
        "OOP principles applied": true,
        "Code documented": true,
        "Error handling implemented": true,
        "UI/UX meets standards": true
      }
    });
    
    await this.createTask({
      unitId: unit3.id,
      name: "Network Protocols",
      description: "Analyze and implement network protocols",
      criteria: {
        "Protocol layers identified": true,
        "Protocol functions explained": true,
        "Implementation works correctly": true,
        "Security considerations addressed": true
      }
    });
    
    await this.createTask({
      unitId: unit4.id,
      name: "Security Principles",
      description: "Explain and implement security principles",
      criteria: {
        "CIA triad explained": true,
        "Threat modeling performed": true,
        "Security controls identified": true,
        "Implementation secure": true
      }
    });
  }
}

export const storage = new MemStorage();
