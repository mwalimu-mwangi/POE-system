import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SubmissionList, type SubmissionItem } from "@/components/dashboard/submission-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { Search, Filter } from "lucide-react";

export default function Assessment() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  
  // Only assessors and admins should access this page
  const isAssessor = user?.role === 'assessor';
  const isAdmin = user?.role === 'admin';
  
  // Get submissions assigned to this assessor
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/submissions'],
    enabled: !!user && (isAssessor || isAdmin)
  });
  
  // Get units for filter
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
    enabled: !!user
  });
  
  // Get assessment statistics
  const { data: assessmentStats = {} } = useQuery({
    queryKey: ['/api/reports/assessor-activity'],
    enabled: !!user && (isAssessor || isAdmin)
  });
  
  // Map to correct format for components and apply filters
  const filteredSubmissions: SubmissionItem[] = submissions
    .filter((submission: any) => {
      const matchesSearch = searchTerm === "" || 
        submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.traineeName?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesUnit = selectedUnit === "all" || submission.unitId?.toString() === selectedUnit;
      
      return matchesSearch && matchesUnit;
    })
    .map((submission: any) => ({
      id: submission.id,
      trainee: {
        id: submission.traineeId,
        fullName: submission.traineeName,
      },
      unit: submission.unitName,
      task: submission.taskName,
      submissionDate: submission.submissionDate,
      status: submission.status,
      fileCount: submission.fileCount,
      fileTypes: submission.fileTypes || ['PDF'],
    }));
    
  const pendingSubmissions = filteredSubmissions.filter(s => s.status === 'pending');
  const inProgressSubmissions = filteredSubmissions.filter(s => ['resubmit', 'reviewed'].includes(s.status));
  const completedSubmissions = filteredSubmissions.filter(s => ['approved', 'rejected'].includes(s.status));
  
  const assessmentTrends = assessmentStats.trendsData || [];
  
  if (!isAssessor && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
          <p className="text-neutral-600">You don't have permission to access the assessment page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Assessment Management</h1>
        <p className="text-neutral-600">Review and assess trainee submissions</p>
      </div>
      
      {/* Assessment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Overview</CardTitle>
            <CardDescription>Summary of your assessment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Pending</p>
                <p className="text-3xl font-bold text-warning">{pendingSubmissions.length}</p>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-primary">{inProgressSubmissions.length}</p>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-secondary">{completedSubmissions.length}</p>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-500 mb-1">Total</p>
                <p className="text-3xl font-bold text-neutral-900">{filteredSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Assessment Trends</CardTitle>
            <CardDescription>Monthly assessment activity</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64">
              <TrendsChart
                title=""
                data={assessmentTrends}
                dataKeys={[
                  { key: 'approved', name: 'Approved', color: '#10B981' },
                  { key: 'rejected', name: 'Rejected', color: '#EF4444' },
                  { key: 'resubmit', name: 'Resubmit', color: '#F59E0B' }
                ]}
                xAxisKey="month"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search submissions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2 text-neutral-400" />
              <SelectValue placeholder="Filter by Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {units.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.code}: {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Submission Lists */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        <Tabs defaultValue="pending" className="w-full">
          <div className="px-6 pt-6 border-b border-neutral-200">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending <span className="ml-1 text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">{pendingSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{inProgressSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed <span className="ml-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{completedSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="all">
                All <span className="ml-1 text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{filteredSubmissions.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pending">
            <SubmissionList submissions={pendingSubmissions} isLoading={isLoading} />
            {pendingSubmissions.length === 0 && !isLoading && (
              <div className="text-center p-8 text-neutral-500">
                No pending submissions to review
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in-progress">
            <SubmissionList submissions={inProgressSubmissions} isLoading={isLoading} />
            {inProgressSubmissions.length === 0 && !isLoading && (
              <div className="text-center p-8 text-neutral-500">
                No submissions currently in progress
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            <SubmissionList submissions={completedSubmissions} isLoading={isLoading} />
            {completedSubmissions.length === 0 && !isLoading && (
              <div className="text-center p-8 text-neutral-500">
                No completed assessments found
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            <SubmissionList submissions={filteredSubmissions} isLoading={isLoading} />
            {filteredSubmissions.length === 0 && !isLoading && (
              <div className="text-center p-8 text-neutral-500">
                No submissions found matching your criteria
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
