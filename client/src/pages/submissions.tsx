import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SubmissionList, type SubmissionItem } from "@/components/dashboard/submission-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";

export default function Submissions() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const isTrainee = user?.role === 'trainee';
  
  // Get submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/submissions'],
    enabled: !!user
  });
  
  // Get units for filter
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
    enabled: !!user
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
      const matchesStatus = selectedStatus === "all" || submission.status === selectedStatus;
      
      return matchesSearch && matchesUnit && matchesStatus;
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
  const approvedSubmissions = filteredSubmissions.filter(s => s.status === 'approved');
  const resubmitSubmissions = filteredSubmissions.filter(s => s.status === 'resubmit');
  const rejectedSubmissions = filteredSubmissions.filter(s => s.status === 'rejected');
  
  const handleNewSubmission = () => {
    navigate("/submissions/new");
  };
  
  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Submissions</h1>
          <p className="text-neutral-600">
            {isTrainee 
              ? "Manage your portfolio submissions and track their status" 
              : "Review and assess trainee portfolio submissions"}
          </p>
        </div>
        
        {isTrainee && (
          <Button onClick={handleNewSubmission}>
            <Plus className="mr-2 h-4 w-4" />
            New Submission
          </Button>
        )}
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
        
        <div className="flex flex-1 gap-4">
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
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2 text-neutral-400" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="resubmit">Resubmit Requested</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Submission Lists */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-6 border-b border-neutral-200">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All <span className="ml-1 text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{filteredSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending <span className="ml-1 text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">{pendingSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved <span className="ml-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{approvedSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="resubmit">
                Resubmit <span className="ml-1 text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">{resubmitSubmissions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected <span className="ml-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{rejectedSubmissions.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all">
            <SubmissionList submissions={filteredSubmissions} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="pending">
            <SubmissionList submissions={pendingSubmissions} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="approved">
            <SubmissionList submissions={approvedSubmissions} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="resubmit">
            <SubmissionList submissions={resubmitSubmissions} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="rejected">
            <SubmissionList submissions={rejectedSubmissions} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
