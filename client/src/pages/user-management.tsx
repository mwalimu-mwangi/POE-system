import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Search, UserPlus, UserCheck, Shield, Plus, Edit, UserX, AlertCircle } from "lucide-react";

// Form schema for user management
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["trainee", "assessor", "internal_verifier", "external_verifier", "admin"]),
  isActive: z.boolean().default(true)
});

// Form schema for assignment
const assignmentFormSchema = z.object({
  traineeId: z.string().min(1, "Trainee is required"),
  assessorId: z.string().min(1, "Assessor is required"),
  unitId: z.string().min(1, "Unit is required")
});

type UserFormValues = z.infer<typeof userFormSchema>;
type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export default function UserManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Only admin should access this page
  const isAdmin = user?.role === 'admin';
  
  // Get all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && isAdmin
  });
  
  // Get units for assignment
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
    enabled: !!user && isAdmin
  });
  
  // Filter users by search and role
  const filteredUsers = users
    .filter((u: any) => {
      const matchesSearch = searchTerm === "" || 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesRole = selectedRole === "all" || u.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  
  // Get trainees and assessors separately for assignments
  const trainees = users.filter((u: any) => u.role === 'trainee' && u.isActive);
  const assessors = users.filter((u: any) => u.role === 'assessor' && u.isActive);
  
  // Get existing assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: !!user && isAdmin
  });
  
  // Setup form for creating user
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "trainee",
      isActive: true
    }
  });
  
  // Setup form for creating assignment
  const assignmentForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      traineeId: "",
      assessorId: "",
      unitId: ""
    }
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created successfully",
        description: "The new user has been added to the system"
      });
      setIsCreateUserOpen(false);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const res = await apiRequest("POST", "/api/assignments", {
        traineeId: parseInt(data.traineeId),
        assessorId: parseInt(data.assessorId),
        unitId: parseInt(data.unitId)
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment created successfully",
        description: "The trainee has been assigned to the assessor"
      });
      setIsCreateAssignmentOpen(false);
      assignmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create assignment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/users/deactivate/${userId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User deactivated successfully",
        description: "The user has been deactivated from the system"
      });
      setIsDeactivateDialogOpen(false);
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deactivate user",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const onCreateUserSubmit = (values: UserFormValues) => {
    createUserMutation.mutate(values);
  };
  
  const onCreateAssignmentSubmit = (values: AssignmentFormValues) => {
    createAssignmentMutation.mutate(values);
  };
  
  const handleDeactivateUser = (userId: number) => {
    setSelectedUserId(userId);
    setIsDeactivateDialogOpen(true);
  };
  
  const confirmDeactivateUser = () => {
    if (selectedUserId) {
      deactivateUserMutation.mutate(selectedUserId);
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-purple-50 text-purple-600 border-purple-200";
      case 'assessor':
        return "bg-blue-50 text-blue-600 border-blue-200";
      case 'internal_verifier':
        return "bg-green-50 text-green-600 border-green-200";
      case 'external_verifier':
        return "bg-amber-50 text-amber-600 border-amber-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };
  
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'internal_verifier':
        return "Internal Verifier";
      case 'external_verifier':
        return "External Verifier";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };
  
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
          <p className="text-neutral-600">You don't have permission to access the user management page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">User Management</h1>
          <p className="text-neutral-600">
            Manage users and role assignments
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setIsCreateAssignmentOpen(true)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Assign Trainee
          </Button>
          <Button onClick={() => setIsCreateUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Tabs for Users and Assignments */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Users & Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center">
            <UserCheck className="mr-2 h-4 w-4" />
            Trainee-Assessor Assignments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          {/* Filters for Users */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="trainee">Trainees</SelectItem>
                <SelectItem value="assessor">Assessors</SelectItem>
                <SelectItem value="internal_verifier">Internal Verifiers</SelectItem>
                <SelectItem value="external_verifier">External Verifiers</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredUsers.map((user: any) => (
                        <tr key={user.id} className={`hover:bg-neutral-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 font-bold">
                                {user.fullName.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-neutral-900">{user.fullName}</p>
                                <p className="text-xs text-neutral-500">{user.email}</p>
                                <p className="text-xs text-neutral-400">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={getRoleBadgeColor(user.role)}
                            >
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={user.isActive ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.isActive && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Deactivate
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No users found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments">
          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle>Trainee-Assessor Assignments</CardTitle>
              <CardDescription>Manage assessment assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-left">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Trainee</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Assessor</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {assignments.map((assignment: any) => (
                        <tr key={assignment.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 font-bold">
                                {assignment.traineeName?.charAt(0) || 'T'}
                              </div>
                              <p className="ml-3 text-sm font-medium text-neutral-900">{assignment.traineeName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                {assignment.assessorName?.charAt(0) || 'A'}
                              </div>
                              <p className="ml-3 text-sm font-medium text-neutral-900">{assignment.assessorName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className="bg-neutral-50 text-neutral-600 border-neutral-200"
                            >
                              {assignment.unitName || `Unit ${assignment.unitId}`}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(assignment.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-neutral-500">No assignments found. Create your first assignment.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t p-6">
              <Button onClick={() => setIsCreateAssignmentOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Assignment
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="trainee">Trainee</SelectItem>
                        <SelectItem value="assessor">Assessor</SelectItem>
                        <SelectItem value="internal_verifier">Internal Verifier</SelectItem>
                        <SelectItem value="external_verifier">External Verifier</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines what permissions the user will have in the system.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system.
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Assignment Dialog */}
      <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Assign a trainee to an assessor for a specific unit.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assignmentForm}>
            <form onSubmit={assignmentForm.handleSubmit(onCreateAssignmentSubmit)} className="space-y-4">
              <FormField
                control={assignmentForm.control}
                name="traineeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainee</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trainee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainees.map((trainee: any) => (
                          <SelectItem key={trainee.id} value={trainee.id.toString()}>
                            {trainee.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignmentForm.control}
                name="assessorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessor</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an assessor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assessors.map((assessor: any) => (
                          <SelectItem key={assessor.id} value={assessor.id.toString()}>
                            {assessor.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignmentForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.code}: {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The unit that the trainee will be assessed on.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateAssignmentOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Assignment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Deactivate User Confirmation Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Deactivate User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this user? They will no longer be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-500">
              This action can be reversed by reactivating the user later.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeactivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeactivateUser}
              disabled={deactivateUserMutation.isPending}
            >
              {deactivateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
