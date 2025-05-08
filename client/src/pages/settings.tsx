import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { User, KeyRound, Bell, FileText, Mail, Loader2 } from "lucide-react";

// Profile update schema
const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

// Password update schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Notification settings schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  submissionNotifications: z.boolean().default(true),
  assessmentNotifications: z.boolean().default(true),
  verificationNotifications: z.boolean().default(true),
  systemNotifications: z.boolean().default(true),
});

// PDF Export settings schema
const exportFormSchema = z.object({
  defaultFormat: z.enum(["pdf", "docx"]).default("pdf"),
  includeAssessments: z.boolean().default(true),
  includeVerifications: z.boolean().default(true),
  includeSubmissionDetails: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type ExportFormValues = z.infer<typeof exportFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("account");
  
  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });
  
  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification form setup
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      submissionNotifications: true,
      assessmentNotifications: true,
      verificationNotifications: true,
      systemNotifications: true,
    },
  });
  
  // Export form setup
  const exportForm = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      defaultFormat: "pdf",
      includeAssessments: true,
      includeVerifications: true,
      includeSubmissionDetails: true,
    },
  });
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
  
  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("POST", "/api/user/notification-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
  
  // Export settings mutation
  const updateExportSettingsMutation = useMutation({
    mutationFn: async (data: ExportFormValues) => {
      const res = await apiRequest("POST", "/api/user/export-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Export settings updated",
        description: "Your export preferences have been saved."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });
  
  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const onPasswordSubmit = (values: PasswordFormValues) => {
    updatePasswordMutation.mutate(values);
  };
  
  const onNotificationSubmit = (values: NotificationFormValues) => {
    updateNotificationsMutation.mutate(values);
  };
  
  const onExportSubmit = (values: ExportFormValues) => {
    updateExportSettingsMutation.mutate(values);
  };
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Settings</h1>
        <p className="text-neutral-600">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar with tabs */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <Tabs 
                defaultValue="account" 
                orientation="vertical"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="flex flex-col h-auto w-full justify-start items-stretch bg-transparent space-y-1">
                  <TabsTrigger 
                    value="account" 
                    className="justify-start text-left px-3 py-2 h-9"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger 
                    value="password" 
                    className="justify-start text-left px-3 py-2 h-9"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="justify-start text-left px-3 py-2 h-9"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="export" 
                    className="justify-start text-left px-3 py-2 h-9"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export Preferences
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Main settings area */}
        <div className="md:col-span-3">
          <TabsContent value="account" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter your email address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Used for notifications and account recovery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-700 mb-2">Role & Permissions</h3>
                      <div className="p-4 bg-neutral-50 rounded-md">
                        <p className="text-sm text-neutral-600">
                          <span className="font-medium">Current role:</span>{" "}
                          {user?.role === "internal_verifier"
                            ? "Internal Verifier"
                            : user?.role === "external_verifier"
                            ? "External Verifier"
                            : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Contact an administrator if you need to change your role or permissions.
                        </p>
                      </div>
                    </div>
                    
                    <CardFooter className="px-0 pt-4">
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your current password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Confirm your new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <CardFooter className="px-0 pt-4">
                      <Button 
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-neutral-500" />
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                            </div>
                            <FormDescription>
                              Receive notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="pl-6 border-l-2 border-neutral-200 space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="submissionNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Submission Notifications</FormLabel>
                              <FormDescription>
                                Notifications about new submissions and updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="assessmentNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Assessment Notifications</FormLabel>
                              <FormDescription>
                                Notifications about assessment feedback and decisions
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="verificationNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Verification Notifications</FormLabel>
                              <FormDescription>
                                Notifications about verification status changes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="systemNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">System Notifications</FormLabel>
                              <FormDescription>
                                Notifications about system updates and maintenance
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!notificationForm.watch("emailNotifications")}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <CardFooter className="px-0 pt-4">
                      <Button 
                        type="submit"
                        disabled={updateNotificationsMutation.isPending}
                      >
                        {updateNotificationsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="export" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Export Preferences</CardTitle>
                <CardDescription>
                  Configure how your portfolio data is exported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...exportForm}>
                  <form onSubmit={exportForm.handleSubmit(onExportSubmit)} className="space-y-6">
                    <FormField
                      control={exportForm.control}
                      name="defaultFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Export Format</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select export format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                              <SelectItem value="docx">Word Document (DOCX)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose your preferred format for exported documents
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={exportForm.control}
                      name="includeAssessments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Assessment Details</FormLabel>
                            <FormDescription>
                              Include detailed assessment feedback and criteria in exports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={exportForm.control}
                      name="includeVerifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Verification Details</FormLabel>
                            <FormDescription>
                              Include verification status and comments in exports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={exportForm.control}
                      name="includeSubmissionDetails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Submission Details</FormLabel>
                            <FormDescription>
                              Include detailed submission descriptions and metadata in exports
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <CardFooter className="px-0 pt-4">
                      <Button 
                        type="submit"
                        disabled={updateExportSettingsMutation.isPending}
                      >
                        {updateExportSettingsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Export Settings"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </DashboardLayout>
  );
}
