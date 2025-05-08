import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, 
  AlertCircle, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Book, 
  Plus, 
  FileUp, 
  Download,
  Edit,
  Trash
} from "lucide-react";

// Form schema for department
const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// Form schema for study level
const studyLevelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// Form schema for course
const courseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  departmentId: z.string().min(1, "Department is required"),
  studyLevelId: z.string().min(1, "Study level is required"),
});

// Form schema for class intake
const classIntakeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  courseId: z.string().min(1, "Course is required"),
  startDate: z.date(),
  endDate: z.date(),
});

// Form schema for module
const moduleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  courseId: z.string().min(1, "Course is required"),
  credits: z.coerce.number().min(1, "Credits must be at least 1").optional(),
});

// Form schema for bulk import
const bulkImportFormSchema = z.object({
  fileType: z.enum(["departments", "studyLevels", "courses", "classIntakes", "modules"]),
  file: z.instanceof(File).optional(),
});

// Type definitions for the forms
type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
type StudyLevelFormValues = z.infer<typeof studyLevelFormSchema>;
type CourseFormValues = z.infer<typeof courseFormSchema>;
type ClassIntakeFormValues = z.infer<typeof classIntakeFormSchema>;
type ModuleFormValues = z.infer<typeof moduleFormSchema>;
type BulkImportFormValues = z.infer<typeof bulkImportFormSchema>;

export default function EducationalStructure() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("departments");
  
  // Dialog states
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isStudyLevelDialogOpen, setIsStudyLevelDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isClassIntakeDialogOpen, setIsClassIntakeDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  
  // Only admin should access this page
  const isAdmin = user?.role === 'admin';
  
  // Get data for each tab
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments'],
    enabled: !!user
  });
  
  const { data: studyLevels = [], isLoading: studyLevelsLoading } = useQuery({
    queryKey: ['/api/study-levels'],
    enabled: !!user
  });
  
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses'],
    enabled: !!user
  });
  
  const { data: classIntakes = [], isLoading: classIntakesLoading } = useQuery({
    queryKey: ['/api/class-intakes'],
    enabled: !!user
  });
  
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/modules'],
    enabled: !!user
  });
  
  // Setup forms
  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });
  
  const studyLevelForm = useForm<StudyLevelFormValues>({
    resolver: zodResolver(studyLevelFormSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });
  
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      departmentId: "",
      studyLevelId: "",
    }
  });
  
  const classIntakeForm = useForm<ClassIntakeFormValues>({
    resolver: zodResolver(classIntakeFormSchema),
    defaultValues: {
      name: "",
      courseId: "",
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    }
  });
  
  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      courseId: "",
      credits: 1,
    }
  });
  
  const bulkImportForm = useForm<BulkImportFormValues>({
    resolver: zodResolver(bulkImportFormSchema),
    defaultValues: {
      fileType: "departments",
    }
  });
  
  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department created",
        description: "The department has been added successfully",
      });
      setIsDepartmentDialogOpen(false);
      departmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create department",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createStudyLevelMutation = useMutation({
    mutationFn: async (data: StudyLevelFormValues) => {
      const res = await apiRequest("POST", "/api/study-levels", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Study level created",
        description: "The study level has been added successfully",
      });
      setIsStudyLevelDialogOpen(false);
      studyLevelForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/study-levels'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create study level",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const res = await apiRequest("POST", "/api/courses", {
        ...data,
        departmentId: parseInt(data.departmentId),
        studyLevelId: parseInt(data.studyLevelId),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course created",
        description: "The course has been added successfully",
      });
      setIsCourseDialogOpen(false);
      courseForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createClassIntakeMutation = useMutation({
    mutationFn: async (data: ClassIntakeFormValues) => {
      const res = await apiRequest("POST", "/api/class-intakes", {
        ...data,
        courseId: parseInt(data.courseId),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Class intake created",
        description: "The class intake has been added successfully",
      });
      setIsClassIntakeDialogOpen(false);
      classIntakeForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/class-intakes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create class intake",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("POST", "/api/modules", {
        ...data,
        courseId: parseInt(data.courseId),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module created",
        description: "The module has been added successfully",
      });
      setIsModuleDialogOpen(false);
      moduleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create module",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers for form submissions
  const onDepartmentSubmit = (values: DepartmentFormValues) => {
    createDepartmentMutation.mutate(values);
  };
  
  const onStudyLevelSubmit = (values: StudyLevelFormValues) => {
    createStudyLevelMutation.mutate(values);
  };
  
  const onCourseSubmit = (values: CourseFormValues) => {
    createCourseMutation.mutate(values);
  };
  
  const onClassIntakeSubmit = (values: ClassIntakeFormValues) => {
    createClassIntakeMutation.mutate(values);
  };
  
  const onModuleSubmit = (values: ModuleFormValues) => {
    createModuleMutation.mutate(values);
  };
  
  // Template for bulk import
  const generateTemplateCSV = (type: string) => {
    let headers = "";
    let example = "";
    
    switch (type) {
      case "departments":
        headers = "name,description";
        example = "Engineering Department,Department for engineering studies";
        break;
      case "studyLevels":
        headers = "name,description";
        example = "Level 4 - Artisan,Artisan qualification";
        break;
      case "courses":
        headers = "name,code,description,departmentId,studyLevelId";
        example = "Software Development,SD101,Software development course,1,1";
        break;
      case "classIntakes":
        headers = "name,courseId,startDate,endDate";
        example = "Software Development 2023,1,2023-01-15,2024-12-15";
        break;
      case "modules":
        headers = "name,code,description,courseId,credits";
        example = "Programming Fundamentals,PRG101,Introduction to programming,1,3";
        break;
    }
    
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Access control
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
          <p className="text-neutral-600">You don't have permission to access the educational structure management page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Educational Structure</h1>
          <p className="text-neutral-600">
            Manage departments, study levels, courses, class intakes, and modules
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => {
            switch (activeTab) {
              case "departments":
                setIsDepartmentDialogOpen(true);
                break;
              case "studyLevels":
                setIsStudyLevelDialogOpen(true);
                break;
              case "courses":
                setIsCourseDialogOpen(true);
                break;
              case "classIntakes":
                setIsClassIntakeDialogOpen(true);
                break;
              case "modules":
                setIsModuleDialogOpen(true);
                break;
            }
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add {activeTab === "studyLevels" ? "Study Level" : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </Button>
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="departments" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="studyLevels" className="flex items-center">
            <GraduationCap className="mr-2 h-4 w-4" />
            Study Levels
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="classIntakes" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Class Intakes
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center">
            <Book className="mr-2 h-4 w-4" />
            Modules
          </TabsTrigger>
        </TabsList>
        
        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage college departments</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : departments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {departments.map((dept: any) => (
                        <tr key={dept.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-neutral-900">{dept.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-neutral-600">{dept.description || "No description"}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No departments found. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Study Levels Tab */}
        <TabsContent value="studyLevels">
          <Card>
            <CardHeader>
              <CardTitle>Study Levels</CardTitle>
              <CardDescription>Manage qualification levels</CardDescription>
            </CardHeader>
            <CardContent>
              {studyLevelsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : studyLevels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {studyLevels.map((level: any) => (
                        <tr key={level.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-neutral-900">{level.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-neutral-600">{level.description || "No description"}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No study levels found. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>Manage courses offered by the college</CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Study Level</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {courses.map((course: any) => {
                        const department = departments.find((d: any) => d.id === course.departmentId);
                        const studyLevel = studyLevels.find((l: any) => l.id === course.studyLevelId);
                        
                        return (
                          <tr key={course.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">{course.code}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-neutral-900">{course.name}</p>
                              <p className="text-xs text-neutral-500 mt-1">{course.description || "No description"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">{department?.name || "Unknown"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">{studyLevel?.name || "Unknown"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No courses found. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Class Intakes Tab */}
        <TabsContent value="classIntakes">
          <Card>
            <CardHeader>
              <CardTitle>Class Intakes</CardTitle>
              <CardDescription>Manage class intakes and enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              {classIntakesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : classIntakes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {classIntakes.map((intake: any) => {
                        const course = courses.find((c: any) => c.id === intake.courseId);
                        const now = new Date();
                        const startDate = new Date(intake.startDate);
                        const endDate = new Date(intake.endDate);
                        let status = "Upcoming";
                        let statusColor = "bg-orange-50 text-orange-600 border-orange-200";
                        
                        if (now >= startDate && now <= endDate) {
                          status = "Active";
                          statusColor = "bg-green-50 text-green-600 border-green-200";
                        } else if (now > endDate) {
                          status = "Completed";
                          statusColor = "bg-blue-50 text-blue-600 border-blue-200";
                        }
                        
                        return (
                          <tr key={intake.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-neutral-900">{intake.name}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">{course?.name || "Unknown"}</p>
                              <p className="text-xs text-neutral-500">{course?.code || ""}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">
                                {new Date(intake.startDate).toLocaleDateString()} - {new Date(intake.endDate).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className={statusColor}>
                                {status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No class intakes found. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
              <CardDescription>Manage course modules</CardDescription>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : modules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Module Name</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {modules.map((module: any) => {
                        const course = courses.find((c: any) => c.id === module.courseId);
                        
                        return (
                          <tr key={module.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">{module.code}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-neutral-900">{module.name}</p>
                              <p className="text-xs text-neutral-500 mt-1">{module.description || "No description"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">{course?.name || "Unknown"}</p>
                              <p className="text-xs text-neutral-500">{course?.code || ""}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-sm text-neutral-700">{module.credits || "N/A"}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No modules found. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Department Dialog */}
      <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department in the college structure
            </DialogDescription>
          </DialogHeader>
          <Form {...departmentForm}>
            <form onSubmit={departmentForm.handleSubmit(onDepartmentSubmit)} className="space-y-6">
              <FormField
                control={departmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={departmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDepartmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDepartmentMutation.isPending}
                >
                  {createDepartmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Department"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Study Level Dialog */}
      <Dialog open={isStudyLevelDialogOpen} onOpenChange={setIsStudyLevelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Study Level</DialogTitle>
            <DialogDescription>
              Create a new qualification level
            </DialogDescription>
          </DialogHeader>
          <Form {...studyLevelForm}>
            <form onSubmit={studyLevelForm.handleSubmit(onStudyLevelSubmit)} className="space-y-6">
              <FormField
                control={studyLevelForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Level Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Level 4 - Artisan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={studyLevelForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the qualification level" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStudyLevelDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createStudyLevelMutation.isPending}
                >
                  {createStudyLevelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Study Level"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
            <DialogDescription>
              Create a new course for a department and study level
            </DialogDescription>
          </DialogHeader>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
              <FormField
                control={courseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SD101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the course" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={courseForm.control}
                  name="studyLevelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select study level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studyLevels.map((level: any) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCourseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Class Intake Dialog */}
      <Dialog open={isClassIntakeDialogOpen} onOpenChange={setIsClassIntakeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Class Intake</DialogTitle>
            <DialogDescription>
              Create a new class intake for a course
            </DialogDescription>
          </DialogHeader>
          <Form {...classIntakeForm}>
            <form onSubmit={classIntakeForm.handleSubmit(onClassIntakeSubmit)} className="space-y-6">
              <FormField
                control={classIntakeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intake Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Development Intake 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={classIntakeForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={classIntakeForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={classIntakeForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsClassIntakeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createClassIntakeMutation.isPending}
                >
                  {createClassIntakeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Class Intake"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>
              Create a new module for a course
            </DialogDescription>
          </DialogHeader>
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-6">
              <FormField
                control={moduleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Programming Fundamentals" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PRG101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the module" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of credits awarded for this module
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModuleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createModuleMutation.isPending}
                >
                  {createModuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Module"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bulk Import</DialogTitle>
            <DialogDescription>
              Import multiple records from a CSV file
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkImportForm}>
            <form className="space-y-6">
              <FormField
                control={bulkImportForm.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="departments">Departments</SelectItem>
                        <SelectItem value="studyLevels">Study Levels</SelectItem>
                        <SelectItem value="courses">Courses</SelectItem>
                        <SelectItem value="classIntakes">Class Intakes</SelectItem>
                        <SelectItem value="modules">Modules</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bulkImportForm.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>CSV File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a CSV file with headers. 
                      <Button 
                        type="button" 
                        variant="link" 
                        className="h-auto p-0 text-primary" 
                        onClick={() => generateTemplateCSV(bulkImportForm.getValues("fileType"))}
                      >
                        Download template
                      </Button>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    toast({
                      title: "Bulk import",
                      description: "This feature will be implemented soon."
                    });
                  }}
                >
                  Import Data
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}