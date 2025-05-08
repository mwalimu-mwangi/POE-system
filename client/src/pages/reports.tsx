import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, BarChart3, Users, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>("30days");
  const [reportType, setReportType] = useState<string>("trainee-performance");
  
  const isAdmin = user?.role === 'admin';
  const isAssessor = user?.role === 'assessor';
  const isVerifier = user?.role === 'internal_verifier' || user?.role === 'external_verifier';
  
  // Get report data based on selected type
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: [`/api/reports/${reportType}`, dateRange],
    enabled: !!user
  });
  
  // Chart data mappings for different report types
  const getChartConfig = () => {
    switch (reportType) {
      case 'trainee-performance':
        return {
          title: "Trainee Performance",
          description: "Assessment outcomes by trainee",
          dataKeys: [
            { key: 'approvedCount', name: 'Approved', color: '#10B981' },
            { key: 'pendingCount', name: 'Pending', color: '#F59E0B' },
            { key: 'resubmitCount', name: 'Resubmit', color: '#6366F1' },
            { key: 'rejectedCount', name: 'Rejected', color: '#EF4444' }
          ],
          xAxisKey: "traineeName",
          xAxisLabel: "Trainees",
          yAxisLabel: "Submissions"
        };
      case 'assessor-activity':
        return {
          title: "Assessor Activity",
          description: "Assessment volume and outcomes by assessor",
          dataKeys: [
            { key: 'assessmentsCount', name: 'Total Assessments', color: '#2563EB' },
            { key: 'approvedCount', name: 'Approved', color: '#10B981' },
            { key: 'resubmitCount', name: 'Resubmit', color: '#F59E0B' },
            { key: 'rejectedCount', name: 'Rejected', color: '#EF4444' }
          ],
          xAxisKey: "assessorName",
          xAxisLabel: "Assessors",
          yAxisLabel: "Assessments"
        };
      case 'assessment-outcomes':
        return {
          title: "Assessment Outcomes by Unit/Task",
          description: "Submission statuses across course units",
          dataKeys: [
            { key: 'approvedCount', name: 'Approved', color: '#10B981' },
            { key: 'pendingCount', name: 'Pending', color: '#F59E0B' },
            { key: 'resubmitCount', name: 'Resubmit', color: '#6366F1' },
            { key: 'rejectedCount', name: 'Rejected', color: '#EF4444' }
          ],
          xAxisKey: "unitName",
          xAxisLabel: "Units",
          yAxisLabel: "Submissions"
        };
      default:
        return {
          title: "Report Data",
          description: "Summary of data",
          dataKeys: [{ key: 'value', name: 'Value', color: '#2563EB' }],
          xAxisKey: "name",
          xAxisLabel: "",
          yAxisLabel: ""
        };
    }
  };
  
  const chartConfig = getChartConfig();
  
  // Handle report export
  const [exporting, setExporting] = useState(false);
  
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const traineeId = reportType === 'trainee-performance' ? (user?.role === 'trainee' ? user.id : null) : null;
      
      // If trainee ID is required but not available, show error
      if (reportType === 'export-portfolio' && !traineeId) {
        throw new Error("Trainee ID is required for portfolio export");
      }
      
      const endpoint = traineeId 
        ? `/api/export-portfolio/${traineeId}` 
        : `/api/reports/${reportType}/export`;
      
      // Use a direct fetch for file download
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      // Create a blob from the PDF stream
      const blob = await response.blob();
      // Create a link element to trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };
  
  // Summary cards data based on report type
  const getSummaryData = () => {
    if (!reportData) return [];
    
    switch (reportType) {
      case 'trainee-performance':
        const traineeData = reportData || [];
        const totalTrainees = traineeData.length;
        const totalSubmissions = traineeData.reduce((sum, t) => sum + t.submissionsCount, 0);
        const approvalRate = traineeData.length > 0 
          ? (traineeData.reduce((sum, t) => sum + t.approvedCount, 0) / totalSubmissions * 100).toFixed(1) 
          : 0;
        
        return [
          { title: "Total Trainees", value: totalTrainees, icon: Users },
          { title: "Total Submissions", value: totalSubmissions, icon: BarChart3 },
          { title: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle }
        ];
        
      case 'assessor-activity':
        const assessorData = reportData || [];
        const totalAssessors = assessorData.length;
        const totalAssessments = assessorData.reduce((sum, a) => sum + a.assessmentsCount, 0);
        const avgTurnaround = assessorData.length > 0
          ? (assessorData.reduce((sum, a) => sum + a.averageTurnaround, 0) / totalAssessors).toFixed(1)
          : 0;
          
        return [
          { title: "Total Assessors", value: totalAssessors, icon: Users },
          { title: "Total Assessments", value: totalAssessments, icon: BarChart3 },
          { title: "Avg. Turnaround", value: `${avgTurnaround} days`, icon: CheckCircle }
        ];
        
      case 'assessment-outcomes':
        const outcomeData = reportData || [];
        const totalUnits = outcomeData.length;
        const totalTasks = outcomeData.reduce((sum, u) => sum + (u.tasks?.length || 1), 0);
        const overallApproval = totalTasks > 0
          ? (outcomeData.reduce((sum, u) => sum + u.approvedCount, 0) / outcomeData.reduce((sum, u) => sum + u.totalSubmissions, 0) * 100).toFixed(1)
          : 0;
          
        return [
          { title: "Total Units", value: totalUnits, icon: BarChart3 },
          { title: "Total Tasks", value: totalTasks, icon: BarChart3 },
          { title: "Overall Approval", value: `${overallApproval}%`, icon: CheckCircle }
        ];
        
      default:
        return [];
    }
  };
  
  const summaryData = getSummaryData();
  
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reports & Analytics</h1>
          <p className="text-neutral-600">
            Analyze submission data and generate reports
          </p>
        </div>
        
        <Button 
          onClick={handleExportPDF}
          disabled={exporting || reportLoading}
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </>
          )}
        </Button>
      </div>
      
      {/* Report Options */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trainee-performance">Trainee Performance</SelectItem>
            {(isAdmin || isAssessor) && (
              <SelectItem value="assessor-activity">Assessor Activity</SelectItem>
            )}
            <SelectItem value="assessment-outcomes">Assessment Outcomes</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {summaryData.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{item.title}</p>
                  <p className="text-3xl font-bold text-neutral-900">{item.value}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Report Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{chartConfig.title}</CardTitle>
          <CardDescription>{chartConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <div className="h-80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reportData && reportData.length > 0 ? (
            <div className="h-96">
              <TrendsChart
                title=""
                data={reportData}
                dataKeys={chartConfig.dataKeys}
                xAxisKey={chartConfig.xAxisKey}
                xAxisLabel={chartConfig.xAxisLabel}
                yAxisLabel={chartConfig.yAxisLabel}
              />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-neutral-500">No data available for the selected report type.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Additional Report Details */}
      {reportData && reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 text-left">
                  <tr>
                    {reportType === 'trainee-performance' && (
                      <>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Trainee</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Submissions</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Approved</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Resubmit</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Rejected</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Pending</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg. Turnaround</th>
                      </>
                    )}
                    
                    {reportType === 'assessor-activity' && (
                      <>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Assessor</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Assessments</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Approved</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Resubmit</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Rejected</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg. Turnaround</th>
                      </>
                    )}
                    
                    {reportType === 'assessment-outcomes' && (
                      <>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Approved</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Resubmit</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Rejected</th>
                        <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Pending</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {reportType === 'trainee-performance' && reportData.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-neutral-900">{item.traineeName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.submissionsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.approvedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{item.resubmitCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.rejectedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.pendingCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.averageTurnaround.toFixed(1)} days</td>
                    </tr>
                  ))}
                  
                  {reportType === 'assessor-activity' && reportData.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-neutral-900">{item.assessorName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.assessmentsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.approvedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{item.resubmitCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.rejectedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.averageTurnaround.toFixed(1)} days</td>
                    </tr>
                  ))}
                  
                  {reportType === 'assessment-outcomes' && reportData.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-neutral-900">{item.unitName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.taskName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.totalSubmissions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{item.approvedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{item.resubmitCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.rejectedCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{item.pendingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
