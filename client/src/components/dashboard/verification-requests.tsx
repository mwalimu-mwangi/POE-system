import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  RotateCcw, 
  XCircle, 
  FileText 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface VerificationItem {
  id: number;
  title: string;
  trainee: {
    id: number;
    name: string;
  };
  assessor: {
    id: number;
    name: string;
  };
  date: string;
  status: 'approved' | 'resubmit' | 'rejected';
  fileCount: number;
  code: string;
}

interface VerificationRequestsProps {
  verifications: VerificationItem[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
}

export function VerificationRequests({ 
  verifications, 
  title = "Verification Requests",
  subtitle = "Assessments requiring verification",
  isLoading 
}: VerificationRequestsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'resubmit':
        return <RotateCcw className="h-3 w-3 mr-1" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return "bg-green-50 text-green-600";
      case 'resubmit':
        return "bg-yellow-50 text-yellow-600";
      case 'rejected':
        return "bg-red-50 text-red-600";
      default:
        return "bg-neutral-50 text-neutral-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return "Approved";
      case 'resubmit':
        return "Resubmit";
      case 'rejected':
        return "Rejected";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-6 space-y-4">
        {verifications.length === 0 ? (
          <div className="text-center p-4 text-neutral-500">
            No verification requests found
          </div>
        ) : (
          verifications.map((verification) => (
            <div key={verification.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">{verification.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {verification.trainee.name} (TRN-{verification.trainee.id.toString().padStart(4, '0')})
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-neutral-500">
                      Assessed by: {verification.assessor.name}
                    </span>
                    <span className="mx-2 text-neutral-300">•</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(verification.date).toLocaleDateString()} 
                      ({formatDistanceToNow(new Date(verification.date), { addSuffix: true })})
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "flex items-center rounded-full px-3 py-1 text-xs font-medium",
                    getStatusClass(verification.status)
                  )}
                >
                  {getStatusIcon(verification.status)}
                  {getStatusText(verification.status)}
                </Badge>
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-neutral-400 mr-1" />
                  <span className="text-xs text-neutral-500">
                    {verification.fileCount} file{verification.fileCount !== 1 ? 's' : ''}
                  </span>
                  <span className="mx-2 text-neutral-300">•</span>
                  <span className="text-xs text-neutral-500">
                    Verification Code: {verification.code}
                  </span>
                </div>
                <Link href={`/verification/${verification.id}`}>
                  <a className="text-primary hover:text-primary-dark text-sm font-medium">
                    Review
                  </a>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      {verifications.length > 0 && (
        <div className="p-4 border-t border-neutral-200 text-center">
          <Link href="/verification">
            <a className="text-primary hover:text-primary-dark font-medium text-sm">
              View All Verifications
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
