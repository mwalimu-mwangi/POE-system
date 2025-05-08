import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Departments (e.g., Engineering, Business, Health Sciences)
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const insertDepartmentSchema = createInsertSchema(departments);

// Study Levels (e.g., LV3, LV4, LV5, LV6)
export const studyLevels = pgTable("study_levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "LV3", "LV4 (Artisan)", etc.
  description: text("description"),
  order: integer("order").notNull(), // For sorting (1, 2, 3, 4)
});

export const insertStudyLevelSchema = createInsertSchema(studyLevels);

// Courses (e.g., Electrical Engineering, Business Management)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  departmentId: integer("department_id").notNull(),
  studyLevelId: integer("study_level_id").notNull(),
  description: text("description"),
});

export const insertCourseSchema = createInsertSchema(courses);

// Class Intakes (e.g., January 2025, September 2025)
export const classIntakes = pgTable("class_intakes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});

export const insertClassIntakeSchema = createInsertSchema(classIntakes);

// Units
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  courseId: integer("course_id").notNull(),
  description: text("description"),
  credits: integer("credits").default(0).notNull(),
});

export const insertUnitSchema = createInsertSchema(units);

// User Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["trainee", "assessor", "internal_verifier", "external_verifier", "admin"] }).notNull(),
  departmentId: integer("department_id"), // Only for trainees and assessors
  courseId: integer("course_id"), // Only for trainees
  classIntakeId: integer("class_intake_id"), // Only for trainees
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  departmentId: true,
  courseId: true,
  classIntakeId: true,
  isActive: true,
});

// Define relationships
export const departmentsRelations = relations(departments, ({ many }) => ({
  courses: many(courses),
  users: many(users),
}));

export const studyLevelsRelations = relations(studyLevels, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, {
    fields: [courses.departmentId],
    references: [departments.id],
  }),
  studyLevel: one(studyLevels, {
    fields: [courses.studyLevelId],
    references: [studyLevels.id],
  }),
  classIntakes: many(classIntakes),
  units: many(units),
  users: many(users),
}));

export const classIntakesRelations = relations(classIntakes, ({ one, many }) => ({
  course: one(courses, {
    fields: [classIntakes.courseId],
    references: [courses.id],
  }),
  users: many(users),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  tasks: many(tasks),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: "userDepartment",
  }),
  course: one(courses, {
    fields: [users.courseId],
    references: [courses.id],
    relationName: "userCourse",
  }),
  classIntake: one(classIntakes, {
    fields: [users.classIntakeId],
    references: [classIntakes.id],
    relationName: "userClassIntake",
  }),
  submissions: many(submissions),
  assessments: many(assessments),
  verifications: many(verifications),
}));

// Tasks within Units
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria"),
});

export const insertTaskSchema = createInsertSchema(tasks);

// Class-Assessor Assignments (one assessor assigned to a class for a unit)
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classIntakeId: integer("class_intake_id").notNull(),
  assessorId: integer("assessor_id").notNull(),
  unitId: integer("unit_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignments);

// Evidence Submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  traineeId: integer("trainee_id").notNull(),
  taskId: integer("task_id").notNull(),
  unitId: integer("unit_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  status: text("status", { enum: ["pending", "reviewed", "resubmit", "approved", "rejected"] }).default("pending").notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissions);

// Submitted Files
export const submissionFiles = pgTable("submission_files", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
});

export const insertSubmissionFileSchema = createInsertSchema(submissionFiles);

// Assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  assessorId: integer("assessor_id").notNull(),
  feedback: text("feedback"),
  criteria: jsonb("criteria"),
  status: text("status", { enum: ["approved", "resubmit", "rejected"] }).notNull(),
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments);

// Verifications
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  verifierId: integer("verifier_id").notNull(),
  verifierType: text("verifier_type", { enum: ["internal", "external"] }).notNull(),
  status: text("status", { enum: ["confirmed", "rejected", "flagged"] }).notNull(),
  comments: text("comments"),
  verificationDate: timestamp("verification_date").defaultNow().notNull(),
});

export const insertVerificationSchema = createInsertSchema(verifications);

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  type: text("type", { enum: ["submission", "assessment", "verification", "system"] }).notNull(),
  linkedItemId: integer("linked_item_id"),
});

export const insertNotificationSchema = createInsertSchema(notifications);

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs);

// Export all types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type StudyLevel = typeof studyLevels.$inferSelect;
export type InsertStudyLevel = z.infer<typeof insertStudyLevelSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type ClassIntake = typeof classIntakes.$inferSelect;
export type InsertClassIntake = z.infer<typeof insertClassIntakeSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type SubmissionFile = typeof submissionFiles.$inferSelect;
export type InsertSubmissionFile = z.infer<typeof insertSubmissionFileSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
