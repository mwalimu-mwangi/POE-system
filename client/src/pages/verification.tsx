import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { VerificationRequests, type VerificationItem } from "@/components/dashboard/verification-requests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Verification() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessor, setSelectedAssessor] = useState<string>("all");
  
  // Only verifiers and admins should access this page
  const isVerifier = user?.role === 'internal_verifier' || user?.role === 'external_verifier';
  const isAdmin = user?.role === 'admin';
  const isInternalVerifier = user?.role === 'internal_verifier';
  const isExternalVerifier = user?.role === 'external_verifier';
  
  // Get verifications
  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['/api/verifications'],
    enabled: !!user && (isVerifier || isAdmin)
  });
  
  // Get assessors for filter
  const { data: assessors = [] } = useQuery({
    queryKey: ['/api/users/assessors'],
    enabled: !!user && (isVerifier || isAdmin)
  });
  
  // Map to correct format for components and apply filters
  const filteredVerifications: VerificationItem[] = verifications
    .filter((verification: any) => {
      const matchesSearch = searchTerm === "" || 
        verification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.traineeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.assessorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.code?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesAssessor = selectedAssessor === "all" || verification.assessorId?.toString() === selectedAssessor;
      
      return matchesSearch && matchesAssessor;
    })
    .map((verification: any) => ({
      id: verification.id,
      title: verification.title,
      trainee: {
        id: verification.traineeId,
        name: verification.traineeName,
      },
      assessor: {
        id: verification.assessorId,
        name: verification.assessorName,
      },
      date: verification.date,
      status: verification.status,
      fileCount: verification.fileCount,
      code: verification.code,
    }));
    
  // For internal verifier: show unverified assessments & those they've verified
  // For external verifier: show internally verified assessments & those they've verified
  const pendingVerifications = filteredVerifications.filter(v => 
    (isInternalVerifier && v.status === 'pending_internal') ||
    (isExternalVerifier && v.status === 'pending_external')
  );
  
  const inProgressVerifications = filteredVerifications.filter(v => 
    v.status === 'flagged'
  );
  
  const completedVerifications = filteredVerifications.filter(v => 
    v.status === 'confirmed' || v.status === 'rejected'
  );
  
  if (!isVerifier && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
          <p className="text-neutral-600">You don't have permission to access the verification page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verification Management</h1>
        <p className="text-neutral-600">
          {isInternalVerifier 
            ? "Review and verify assessor decisions as an internal verifier" 
            : isExternalVerifier
            ? "Perform final validation of assessments as an external verifier"
            : "Manage the verification process for all assessments"}
        </p>
      </div>
      
      {/* Verification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-neutral-500 mb-1">Pending</p>
              <p className="text-3xl font-bold text-warning">{pendingVerifications.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-neutral-500 mb-1">Flagged Issues</p>
              <p className="text-3xl font-bold text-primary">{inProgressVerifications.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-neutral-500 mb-1">Completed</p>
              <p className="text-3xl font-bold text-secondary">{completedVerifications.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-neutral-500 mb-1">Total</p>
              <p className="text-3xl font-bold text-neutral-900">{filteredVerifications.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search verifications..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <Select value={selectedAssessor} onValueChange={setSelectedAssessor}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Assessor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assessors</SelectItem>
              {assessors.map((assessor: any) => (
                <SelectItem key={assessor.id} value={assessor.id.toString()}>
                  {assessor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Verification Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="pending">
            Pending <span className="ml-1 text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">{pendingVerifications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{inProgressVerifications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <span className="ml-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{completedVerifications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all">
            All <span className="ml-1 text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{filteredVerifications.length}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <VerificationRequests 
            verifications={pendingVerifications}
            title="Pending Verification"
            subtitle="Assessments awaiting your verification"
            isLoading={isLoading}
          />
          {pendingVerifications.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center p-8 text-neutral-500">
                No pending verifications found
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="flagged">
          <VerificationRequests 
            verifications={inProgressVerifications}
            title="Flagged Issues"
            subtitle="Assessments with issues that need attention"
            isLoading={isLoading}
          />
          {inProgressVerifications.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center p-8 text-neutral-500">
                No flagged verifications found
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          <VerificationRequests 
            verifications={completedVerifications}
            title="Completed Verifications"
            subtitle="Assessments that have been verified"
            isLoading={isLoading}
          />
          {completedVerifications.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center p-8 text-neutral-500">
                No completed verifications found
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          <VerificationRequests 
            verifications={filteredVerifications}
            title="All Verifications"
            subtitle="Complete verification history"
            isLoading={isLoading}
          />
          {filteredVerifications.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center p-8 text-neutral-500">
                No verifications found matching your criteria
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
