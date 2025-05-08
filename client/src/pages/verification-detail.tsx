import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { VerificationForm } from "@/components/verification/verification-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  Flag,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function VerificationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const isVerifier = user?.role === 'internal_verifier' || user?.role === 'external_verifier';
  
  const { data: verification, isLoading } = useQuery({
    queryKey: ['/api/verifications', id],
    enabled: !!id && !!user && isVerifier
  });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!verification) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Verification Not Found</h2>
          <p className="text-neutral-600 mt-2">The requested verification does not exist or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => navigate("/verification")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Verifications
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { assessment, submission, files = [], existingVerifications = [] } = verification;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 mr-2 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 mr-2 text-red-500" />;
      case 'flagged':
        return <Flag className="h-5 w-5 mr-2 text-blue-500" />;
      case 'resubmit':
        return <RotateCcw className="h-5 w-5 mr-2 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return "Confirmed";
      case 'rejected':
        return "Rejected";
      case 'flagged':
        return "Issues Flagged";
      case 'resubmit':
        return "Resubmission Requested";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Check if this assessment can be verified by this user
  const canVerify = !existingVerifications.some(v => v.verifierId === user?.id);
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/verification")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Verifications
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 flex justify-between items-start">
                <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{submission.title}</h1>
                <div className="flex items-center">
                  {getStatusIcon(assessment.status)}
                  <span className="text-sm font-medium">{getStatusText(assessment.status)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium">Trainee</p>
                      <p className="text-sm text-neutral-500">{submission.traineeName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium">Assessor</p>
                      <p className="text-sm text-neutral-500">{assessment.assessorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium">Assessment Date</p>
                      <p className="text-sm text-neutral-500">
                        {new Date(assessment.assessmentDate).toLocaleDateString()} 
                        ({formatDistanceToNow(new Date(assessment.assessmentDate), { addSuffix: true })})
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Unit</h3>
                    <Badge variant="outline" className="bg-neutral-50">
                      {submission.unitName}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Task</h3>
                    <Badge variant="outline" className="bg-neutral-50">
                      {submission.taskName}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Verification Code</h3>
                    <Badge variant="outline" className="bg-neutral-50">
                      {verification.code || `IV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${id.padStart(3, '0')}`}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Submission Date</h3>
                    <p className="text-sm text-neutral-500">
                      {new Date(submission.submissionDate).toLocaleDateString()} 
                      ({formatDistanceToNow(new Date(submission.submissionDate), { addSuffix: true })})
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {assessment.feedback && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Assessor Feedback</h3>
                  <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50">
                    <p className="text-sm text-neutral-700 whitespace-pre-line">
                      {assessment.feedback}
                    </p>
                  </div>
                </div>
              )}
              
              {assessment.criteria && Object.keys(assessment.criteria).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Assessment Criteria</h3>
                  <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50">
                    <ul className="space-y-2">
                      {Object.entries(assessment.criteria).map(([criterion, met]) => (
                        <li key={criterion} className="flex items-start">
                          {met ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                          )}
                          <span className="text-sm text-neutral-700">{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Submitted Files</h3>
                <div className="space-y-2">
                  {files.map((file: any) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 rounded-md border border-neutral-200 hover:bg-neutral-50"
                    >
                      <div className="flex items-center">
                        <div className="bg-neutral-100 rounded-lg p-2 mr-3">
                          <FileText className="h-5 w-5 text-neutral-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{file.fileName}</p>
                          <p className="text-xs text-neutral-500">
                            {formatFileSize(file.fileSize)} · {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.filePath}
                        download={file.fileName}
                        className="text-primary hover:text-primary-dark"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              
              {existingVerifications.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Previous Verifications</h3>
                    {existingVerifications.map((verify: any) => (
                      <div key={verify.id} className="p-4 rounded-md border border-neutral-200 bg-neutral-50 mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium">
                            Verified by {verify.verifierName} ({verify.verifierType} Verifier)
                          </p>
                          <div className="flex items-center">
                            {getStatusIcon(verify.status)}
                            <span className="text-sm font-medium">{getStatusText(verify.status)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">
                          {new Date(verify.verificationDate).toLocaleDateString()} 
                          ({formatDistanceToNow(new Date(verify.verificationDate), { addSuffix: true })})
                        </p>
                        {verify.comments && (
                          <div className="mt-2">
                            <h4 className="text-xs font-medium text-neutral-700 mb-1">Comments:</h4>
                            <p className="text-sm text-neutral-600 whitespace-pre-line">
                              {verify.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Verification Form */}
        <div className="lg:col-span-1">
          {canVerify ? (
            <VerificationForm 
              assessmentId={assessment.id}
              onVerificationComplete={() => navigate("/verification")}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Already Verified</h3>
                  <p className="text-neutral-600">
                    You have already verified this assessment. You can view your verification details above.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
