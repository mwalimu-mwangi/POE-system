import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CriteriaItem {
  id: string;
  label: string;
  checked: boolean;
}

interface SubmissionFile {
  id: number;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  fileType: string;
  filePath: string;
}

interface AssessmentPreviewProps {
  submissionId: number;
  unitName: string;
  taskName: string;
  files: SubmissionFile[];
  criteria: CriteriaItem[];
  onAssessmentComplete?: () => void;
}

export function AssessmentPreview({
  submissionId,
  unitName,
  taskName,
  files,
  criteria,
  onAssessmentComplete
}: AssessmentPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<SubmissionFile | null>(files.length > 0 ? files[0] : null);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(
    criteria.reduce((acc, item) => ({ ...acc, [item.id]: item.checked }), {})
  );
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleCriteria = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getPendingCriteriaCount = () => {
    return criteria.filter(item => !checkedItems[item.id]).length;
  };

  const allCriteriaMet = getPendingCriteriaCount() === 0;
  const hasProvidedFeedback = feedback.trim().length > 0;

  const handleFileSelect = (file: SubmissionFile) => {
    setSelectedFile(file);
  };

  const approveSubmission = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assessments", {
        submissionId,
        feedback,
        criteria: checkedItems,
        status: "approved"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission approved",
        description: "The submission has been approved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      if (onAssessmentComplete) onAssessmentComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve submission",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const requestResubmission = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assessments", {
        submissionId,
        feedback,
        criteria: checkedItems,
        status: "resubmit"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Resubmission requested",
        description: "The trainee has been asked to resubmit."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      if (onAssessmentComplete) onAssessmentComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request resubmission",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const rejectSubmission = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assessments", {
        submissionId,
        feedback,
        criteria: checkedItems,
        status: "rejected"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission rejected",
        description: "The submission has been rejected."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      if (onAssessmentComplete) onAssessmentComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject submission",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const isLoading = approveSubmission.isPending || requestResubmission.isPending || rejectSubmission.isPending;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Assessment Preview</h2>
        <p className="text-sm text-neutral-500 mt-1">{unitName} - {taskName}</p>
      </div>
      <div className="p-6">
        {/* Files Section */}
        <div className="border border-neutral-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => handleFileSelect(file)}
                className={`flex items-center cursor-pointer p-2 rounded-md border ${selectedFile?.id === file.id ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:bg-neutral-50'}`}
              >
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
            ))}
          </div>

          {selectedFile && (
            <div className="border border-neutral-100 rounded bg-neutral-50 p-4 flex items-center justify-center min-h-[200px]">
              {selectedFile.fileType.startsWith('image/') ? (
                <img 
                  src={selectedFile.filePath} 
                  alt={selectedFile.fileName} 
                  className="max-h-[400px] max-w-full object-contain"
                />
              ) : selectedFile.fileType === 'application/pdf' ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">PDF Preview</p>
                  <a 
                    href={selectedFile.filePath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    Open PDF
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">Preview not available</p>
                  <a 
                    href={selectedFile.filePath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assessment Checklist */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Assessment Criteria</h3>
          <div className="space-y-3">
            {criteria.map((item) => (
              <div key={item.id} className="flex items-center">
                <Checkbox 
                  id={item.id} 
                  checked={checkedItems[item.id]} 
                  onCheckedChange={() => toggleCriteria(item.id)}
                />
                <label 
                  htmlFor={item.id} 
                  className="ml-2 text-sm text-neutral-800"
                >
                  {item.label}
                </label>
              </div>
            ))}
          </div>
          {!allCriteriaMet && (
            <p className="text-xs text-amber-600 mt-2">
              {getPendingCriteriaCount()} criteria pending assessment
            </p>
          )}
        </div>

        {/* Feedback Form */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Assessment Feedback</h3>
          <Textarea 
            rows={4} 
            placeholder="Enter your feedback for the trainee here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="resize-none"
          />
          {!hasProvidedFeedback && (
            <p className="text-xs text-amber-600 mt-2">
              Please provide feedback before submitting assessment
            </p>
          )}
        </div>
      </div>
      <div className="p-6 border-t border-neutral-200 flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={() => rejectSubmission.mutate()}
          disabled={!hasProvidedFeedback || isLoading}
        >
          Reject
        </Button>
        <Button 
          variant="outline" 
          onClick={() => requestResubmission.mutate()}
          disabled={!hasProvidedFeedback || isLoading}
        >
          Request Resubmission
        </Button>
        <Button 
          onClick={() => approveSubmission.mutate()}
          disabled={!allCriteriaMet || !hasProvidedFeedback || isLoading}
        >
          Approve Submission
        </Button>
      </div>
    </div>
  );
}
