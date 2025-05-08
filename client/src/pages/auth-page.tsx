import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCheck, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Department, Course, StudyLevel, ClassIntake } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  departmentId: z.string().min(1, "Department is required"),
  studyLevelId: z.string().min(1, "Study level is required"),
  courseId: z.string().min(1, "Course is required"),
  classIntakeId: z.string().min(1, "Class intake is required"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedStudyLevelId, setSelectedStudyLevelId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch study levels
  const { data: studyLevels = [] } = useQuery<StudyLevel[]>({
    queryKey: ["/api/study-levels"],
  });

  // Fetch courses based on selected department and study level
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses", selectedDepartmentId, selectedStudyLevelId],
    enabled: !!selectedDepartmentId && !!selectedStudyLevelId,
  });

  // Fetch class intakes based on selected course
  const { data: classIntakes = [] } = useQuery<ClassIntake[]>({
    queryKey: ["/api/class-intakes", selectedCourseId],
    enabled: !!selectedCourseId,
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      departmentId: "",
      studyLevelId: "",
      courseId: "",
      classIntakeId: "",
    },
  });

  // Update selected values when form fields change
  useEffect(() => {
    const subscription = registerForm.watch((value, { name }) => {
      if (name === "departmentId" && value.departmentId) {
        setSelectedDepartmentId(value.departmentId);
        // Reset dependent fields
        registerForm.setValue("courseId", "");
        registerForm.setValue("classIntakeId", "");
        setSelectedCourseId("");
      }
      if (name === "studyLevelId" && value.studyLevelId) {
        setSelectedStudyLevelId(value.studyLevelId);
        // Reset dependent fields
        registerForm.setValue("courseId", "");
        registerForm.setValue("classIntakeId", "");
        setSelectedCourseId("");
      }
      if (name === "courseId" && value.courseId) {
        setSelectedCourseId(value.courseId);
        // Reset class intake
        registerForm.setValue("classIntakeId", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [registerForm, setSelectedDepartmentId, setSelectedStudyLevelId, setSelectedCourseId]);

  const onLoginSubmit = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterValues) => {
    // Convert string IDs to numbers
    const formattedValues = {
      ...values,
      departmentId: parseInt(values.departmentId),
      studyLevelId: parseInt(values.studyLevelId),
      courseId: parseInt(values.courseId),
      classIntakeId: parseInt(values.classIntakeId),
      role: "trainee" as const, // Force trainee role for self-registration
    };
    
    registerMutation.mutate(formattedValues);
  };

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      {/* Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4">
              <div className="h-12 w-12 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">
                PoE
              </div>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">College PoE System</h1>
            <p className="text-neutral-500 mt-2">Sign in to access your portfolio of evidence</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>Login</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your username and password to access the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Logging in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-neutral-500">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary-dark font-medium"
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register a new account</CardTitle>
                  <CardDescription>
                    Create your account to start using the portfolio system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Alert className="mb-4 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <AlertTitle>Student Self-Registration</AlertTitle>
                        <AlertDescription className="text-sm">
                          Only students can self-register. Staff accounts must be created by an administrator.
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={registerForm.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
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
                        control={registerForm.control}
                        name="studyLevelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Study Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your study level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {studyLevels.map((level) => (
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

                      <FormField
                        control={registerForm.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedDepartmentId || !selectedStudyLevelId || courses.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={
                                    !selectedDepartmentId || !selectedStudyLevelId
                                      ? "Select department and study level first"
                                      : courses.length === 0
                                      ? "No courses available for selection"
                                      : "Select your course"
                                  } />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="classIntakeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class Intake</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedCourseId || classIntakes.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={
                                    !selectedCourseId
                                      ? "Select course first"
                                      : classIntakes.length === 0
                                      ? "No class intakes available for selection"
                                      : "Select your class intake"
                                  } />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classIntakes.map((intake) => (
                                  <SelectItem key={intake.id} value={intake.id.toString()}>
                                    {intake.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-neutral-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary-dark font-medium"
                      onClick={() => setActiveTab("login")}
                    >
                      Sign in
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Column */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/20 to-primary-dark/60"></div>
        <div className="relative z-10 max-w-xl text-white p-8">
          <h1 className="text-4xl font-bold mb-6">Portfolio of Evidence System</h1>
          <p className="text-xl mb-8">
            A comprehensive digital platform designed to streamline the collection, assessment, and verification of
            educational portfolios.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Streamlined Assessment</h3>
                <p className="text-white/80">
                  Digitize the entire assessment workflow from submission to certification
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Secure Evidence Storage</h3>
                <p className="text-white/80">
                  Safely store and manage all types of evidence files in one central location
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Transparent Verification</h3>
                <p className="text-white/80">
                  Enable efficient internal and external verification processes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
