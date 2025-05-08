import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssessmentPreview } from "@/components/dashboard/assessment-preview";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showAssessment, setShowAssessment] = useState(false);
  
  const isAssessor = user?.role === 'assessor';
  
  const { data: submission, isLoading } = useQuery({
    queryKey: ['/api/submissions', id],
    enabled: !!id && !!user
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
  
  if (!submission) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Submission Not Found</h2>
          <p className="text-neutral-600 mt-2">The requested submission does not exist or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => navigate("/submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const { submission: submissionData, files = [], assessments = [] } = submission;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 mr-2 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 mr-2 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 mr-2 text-red-500" />;
      case 'resubmit':
        return <RotateCcw className="h-5 w-5 mr-2 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 mr-2 text-yellow-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return "Pending Review";
      case 'approved':
        return "Approved";
      case 'rejected':
        return "Rejected";
      case 'resubmit':
        return "Resubmit Requested";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Check if this submission is pending and can be assessed
  const canAssess = isAssessor && submissionData.status === 'pending';
  
  // Map the criteria from the task to the required format for AssessmentPreview
  const criteria = submissionData.criteria 
    ? Object.entries(submissionData.criteria).map(([key, value]) => ({
        id: key,
        label: key,
        checked: !!value
      }))
    : [];
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/submissions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex justify-between items-start">
                <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{submissionData.title}</h1>
                <div className="flex items-center">
                  {getStatusIcon(submissionData.status)}
                  <span className="text-sm font-medium">{getStatusText(submissionData.status)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium">Submission Date</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(submissionData.submissionDate).toLocaleDateString()} 
                      ({formatDistanceToNow(new Date(submissionData.submissionDate), { addSuffix: true })})
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium">Trainee</p>
                    <p className="text-sm text-neutral-500">{submission.traineeName}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Unit</h3>
                  <Badge variant="outline" className="bg-neutral-50">
                    {submission.unitName}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Task</h3>
                  <Badge variant="outline" className="bg-neutral-50">
                    {submission.taskName}
                  </Badge>
                </div>
                
                {submissionData.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm text-neutral-700 whitespace-pre-line">
                      {submissionData.description}
                    </p>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
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
              
              {assessments.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Assessment Feedback</h3>
                    {assessments.map((assessment: any) => (
                      <div key={assessment.id} className="p-4 rounded-md border border-neutral-200 bg-neutral-50">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium">
                            Assessed by {assessment.assessorName}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={
                              assessment.status === 'approved' 
                                ? 'bg-green-50 text-green-600' 
                                : assessment.status === 'rejected'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-yellow-50 text-yellow-600'
                            }
                          >
                            {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">
                          {new Date(assessment.assessmentDate).toLocaleDateString()} 
                          ({formatDistanceToNow(new Date(assessment.assessmentDate), { addSuffix: true })})
                        </p>
                        {assessment.feedback && (
                          <div className="mt-2">
                            <h4 className="text-xs font-medium text-neutral-700 mb-1">Feedback:</h4>
                            <p className="text-sm text-neutral-600 whitespace-pre-line">
                              {assessment.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {canAssess && !showAssessment && (
                <div className="mt-6">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowAssessment(true)}
                  >
                    Assess Submission
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Assessment Form or Preview */}
        <div className="lg:col-span-2">
          {canAssess && showAssessment ? (
            <AssessmentPreview
              submissionId={parseInt(id)}
              unitName={submission.unitName}
              taskName={submission.taskName}
              files={files}
              criteria={criteria}
              onAssessmentComplete={() => navigate("/submissions")}
            />
          ) : files.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">File Preview</h2>
                <div className="border rounded-md p-4 bg-neutral-50 min-h-[400px] flex items-center justify-center">
                  {files[0].fileType.startsWith('image/') ? (
                    <img 
                      src={files[0].filePath} 
                      alt={files[0].fileName} 
                      className="max-h-[500px] max-w-full object-contain"
                    />
                  ) : files[0].fileType === 'application/pdf' ? (
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                      <p className="text-sm text-neutral-600 mb-4">PDF Preview</p>
                      <a 
                        href={files[0].filePath} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:text-primary-dark"
                      >
                        <Button>
                          Open PDF
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                      <p className="text-sm text-neutral-600 mb-4">Preview not available</p>
                      <a 
                        href={files[0].filePath} 
                        download={files[0].fileName}
                        className="inline-flex items-center text-primary hover:text-primary-dark"
                      >
                        <Button>
                          Download File
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
