import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubmissionList, type SubmissionItem } from "@/components/dashboard/submission-list";
import { VerificationRequests, type VerificationItem } from "@/components/dashboard/verification-requests";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { Clock, CheckCircle, FileText, Users, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Get stats based on role
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/submissions/stats'],
    enabled: !!user,
  });

  // Get recent submissions
  const { data: recentSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/submissions/recent'],
    enabled: !!user,
  });

  // Get verification requests (for assessors, verifiers, admin)
  const { data: verificationRequests = [], isLoading: verificationsLoading } = useQuery({
    queryKey: ['/api/verifications/recent'],
    enabled: !!user && ['assessor', 'internal_verifier', 'external_verifier', 'admin'].includes(user.role),
  });

  // Map to correct format for components
  const formattedSubmissions: SubmissionItem[] = recentSubmissions.map((submission: any) => ({
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

  const formattedVerifications: VerificationItem[] = verificationRequests.map((verification: any) => ({
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

  // Assessment stats
  const assessmentStats = stats?.assessment || {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    resubmitCount: 0,
  };

  // Performance data for chart
  const performanceData = stats?.performanceData || [];

  const isTrainee = user?.role === 'trainee';
  const isAssessor = user?.role === 'assessor';
  const isVerifier = user?.role === 'internal_verifier' || user?.role === 'external_verifier';
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {isTrainee ? "Trainee Dashboard" :
           isAssessor ? "Assessor Dashboard" :
           isVerifier ? "Verifier Dashboard" :
           "Admin Dashboard"}
        </h1>
        <p className="text-neutral-600">
          {isTrainee ? "Track your submissions and progress" :
           isAssessor ? "Manage and review submission assessments" :
           isVerifier ? "Verify assessments and maintain standards" :
           "Overview of the portfolio system"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isTrainee && (
          <>
            <StatCard
              title="My Submissions"
              value={stats?.submissions.totalCount || 0}
              subtitle="Total submissions"
              icon={FileText}
              iconColor="text-primary"
            />
            <StatCard
              title="Pending Review"
              value={stats?.submissions.pendingCount || 0}
              subtitle="Awaiting assessment"
              icon={Clock}
              iconColor="text-warning"
              trend={stats?.submissions.pendingTrend ? {
                value: stats.submissions.pendingTrend,
                positive: false
              } : undefined}
            />
            <StatCard
              title="Approved"
              value={stats?.submissions.approvedCount || 0}
              subtitle="Successfully verified"
              icon={CheckCircle}
              iconColor="text-secondary"
              trend={stats?.submissions.approvedTrend ? {
                value: stats.submissions.approvedTrend,
                positive: true
              } : undefined}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats?.submissions.completionRate || 0}%`}
              subtitle="Overall progress"
              icon={BarChart3}
              iconColor="text-neutral-500"
            />
          </>
        )}

        {isAssessor && (
          <>
            <StatCard
              title="Pending Reviews"
              value={assessmentStats.pendingCount || 0}
              subtitle="Require attention"
              icon={Clock}
              iconColor="text-warning"
              trend={assessmentStats.pendingTrend ? {
                value: assessmentStats.pendingTrend,
                positive: false
              } : undefined}
            />
            <StatCard
              title="Completed Assessments"
              value={assessmentStats.completedCount || 0}
              subtitle="This month"
              icon={CheckCircle}
              iconColor="text-secondary"
              trend={assessmentStats.completedTrend ? {
                value: assessmentStats.completedTrend,
                positive: true
              } : undefined}
            />
            <StatCard
              title="Verification Requests"
              value={assessmentStats.verificationCount || 0}
              subtitle="Awaiting verification"
              icon={FileText}
              iconColor="text-primary"
              trend={assessmentStats.verificationTrend ? {
                value: assessmentStats.verificationTrend,
                neutral: true
              } : undefined}
            />
            <StatCard
              title="My Trainees"
              value={stats?.trainees?.count || 0}
              subtitle="Assigned trainees"
              icon={Users}
              iconColor="text-neutral-500"
              trend={stats?.trainees?.trend ? {
                value: stats.trainees.trend,
                positive: true
              } : undefined}
            />
          </>
        )}

        {(isVerifier || isAdmin) && (
          <>
            <StatCard
              title="Pending Verifications"
              value={stats?.verifications?.pendingCount || 0}
              subtitle="Awaiting review"
              icon={Clock}
              iconColor="text-warning"
              trend={stats?.verifications?.pendingTrend ? {
                value: stats.verifications.pendingTrend,
                positive: false
              } : undefined}
            />
            <StatCard
              title="Verified Assessments"
              value={stats?.verifications?.completedCount || 0}
              subtitle="This month"
              icon={CheckCircle}
              iconColor="text-secondary"
              trend={stats?.verifications?.completedTrend ? {
                value: stats.verifications.completedTrend,
                positive: true
              } : undefined}
            />
            <StatCard
              title="Issues Flagged"
              value={stats?.verifications?.flaggedCount || 0}
              subtitle="Requiring attention"
              icon={FileText}
              iconColor="text-primary"
              trend={stats?.verifications?.flaggedTrend ? {
                value: stats.verifications.flaggedTrend,
                positive: false
              } : undefined}
            />
            <StatCard
              title={isAdmin ? "Active Users" : "Assessments Rejected"}
              value={isAdmin ? (stats?.users?.activeCount || 0) : (stats?.verifications?.rejectedCount || 0)}
              subtitle={isAdmin ? "System users" : "Not meeting standards"}
              icon={isAdmin ? Users : FileText}
              iconColor="text-neutral-500"
              trend={isAdmin ? (stats?.users?.activeTrend ? {
                value: stats.users.activeTrend,
                positive: true
              } : undefined) : undefined}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        {/* Submissions Section - 3/5 width on large screens */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {isTrainee ? "My Submissions" : "Recent Submissions"}
                </h2>
                {isTrainee && (
                  <Link href="/submissions/new">
                    <a className="inline-flex items-center text-sm text-primary hover:text-primary-dark font-medium">
                      + New Submission
                    </a>
                  </Link>
                )}
              </div>
            </div>
            
            <SubmissionList 
              submissions={formattedSubmissions} 
              isLoading={submissionsLoading} 
            />
            
            <div className="p-4 border-t border-neutral-200 text-center">
              <Link href="/submissions">
                <a className="text-primary hover:text-primary-dark font-medium text-sm">
                  View All Submissions
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Verification or Performance Section - 2/5 width on large screens */}
        <div className="lg:col-span-2">
          {(isAssessor || isVerifier || isAdmin) ? (
            <VerificationRequests 
              verifications={formattedVerifications}
              isLoading={verificationsLoading}
            />
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Performance Overview</h2>
                <p className="text-sm text-neutral-500 mt-1">Your submission status breakdown</p>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <TrendsChart
                    title=""
                    data={performanceData}
                    dataKeys={[
                      { key: 'approved', name: 'Approved', color: '#10B981' },
                      { key: 'pending', name: 'Pending', color: '#F59E0B' },
                      { key: 'resubmit', name: 'Resubmit', color: '#6366F1' },
                      { key: 'rejected', name: 'Rejected', color: '#EF4444' }
                    ]}
                    xAxisKey="month"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts Section for Admin */}
      {isAdmin && (
        <div className="mb-8">
          <TrendsChart
            title="System Activity Overview"
            description="Monthly submission and assessment activity"
            data={stats?.activityData || []}
            dataKeys={[
              { key: 'submissions', name: 'Submissions', color: '#2563EB' },
              { key: 'assessments', name: 'Assessments', color: '#10B981' },
              { key: 'verifications', name: 'Verifications', color: '#F59E0B' }
            ]}
            xAxisKey="month"
            xAxisLabel="Month"
            yAxisLabel="Count"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
