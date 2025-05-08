import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Trainee {
  id: number;
  fullName: string;
}

export interface SubmissionItem {
  id: number;
  trainee: Trainee;
  unit: string;
  task: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'resubmit';
  fileCount: number;
  fileTypes: string[];
}

interface SubmissionListProps {
  submissions: SubmissionItem[];
  isLoading?: boolean;
}

export function SubmissionList({ submissions, isLoading }: SubmissionListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center p-8 text-neutral-500">
        No submissions found
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 mr-1" />;
      case 'resubmit':
        return <RotateCcw className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-50 text-yellow-600";
      case 'approved':
        return "bg-green-50 text-green-600";
      case 'rejected':
        return "bg-red-50 text-red-600";
      case 'resubmit':
        return "bg-yellow-50 text-yellow-600";
      default:
        return "bg-neutral-50 text-neutral-600";
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 text-left">
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Trainee</th>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit/Task</th>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Submitted</th>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Files</th>
            <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 font-bold">
                    {submission.trainee.fullName.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">{submission.trainee.fullName}</p>
                    <p className="text-xs text-neutral-500">ID: TRN-{submission.trainee.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-neutral-900">{submission.unit}</p>
                <p className="text-xs text-neutral-500">{submission.task}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {new Date(submission.submissionDate).toLocaleDateString()} 
                ({formatDistanceToNow(new Date(submission.submissionDate), { addSuffix: true })})
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant="outline"
                  className={cn(
                    "flex items-center rounded-full px-3 py-1 text-xs font-medium",
                    getStatusClass(submission.status)
                  )}
                >
                  {getStatusIcon(submission.status)}
                  {getStatusText(submission.status)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {submission.fileCount} file{submission.fileCount !== 1 ? 's' : ''} 
                ({submission.fileTypes.join(', ')})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/submissions/${submission.id}`}>
                  <a className="text-primary hover:text-primary-dark">
                    {submission.status === 'pending' ? 'Review' : 'View'}
                  </a>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
