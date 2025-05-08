import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Download, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function ActivityLogs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  
  // Only admin should access this page
  const isAdmin = user?.role === 'admin';
  
  // Get activity logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    enabled: !!user && isAdmin
  });
  
  // Get unique action types for filter
  const actionTypes = logs
    ? Array.from(new Set(logs.map((log: any) => log.action)))
    : [];
  
  // Filter logs
  const filteredLogs = logs
    .filter((log: any) => {
      const matchesSearch = searchTerm === "" || 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesAction = selectedAction === "all" || log.action === selectedAction;
      
      let matchesDate = true;
      if (selectedDate !== "all") {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        
        if (selectedDate === "today") {
          matchesDate = logDate.toDateString() === now.toDateString();
        } else if (selectedDate === "yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          matchesDate = logDate.toDateString() === yesterday.toDateString();
        } else if (selectedDate === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = logDate >= weekAgo;
        } else if (selectedDate === "month") {
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          matchesDate = logDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesAction && matchesDate;
    })
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'created_user':
      case 'created_unit':
      case 'created_task':
      case 'created_assignment':
        return "bg-green-50 text-green-600 border-green-200";
      case 'created_submission':
      case 'uploaded_file':
        return "bg-blue-50 text-blue-600 border-blue-200";
      case 'created_assessment':
        return "bg-purple-50 text-purple-600 border-purple-200";
      case 'created_verification':
        return "bg-amber-50 text-amber-600 border-amber-200";
      case 'deactivated_user':
      case 'deleted_submission':
        return "bg-red-50 text-red-600 border-red-200";
      case 'exported_portfolio':
        return "bg-indigo-50 text-indigo-600 border-indigo-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };
  
  const getActionDisplayName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      <div className="text-sm">
        <div>{format(date, "dd MMM yyyy, HH:mm:ss")}</div>
        <div className="text-xs text-neutral-500">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      </div>
    );
  };
  
  // Handle export logs
  const handleExportLogs = () => {
    // In a real implementation, we would call an API endpoint
    // that would generate and return a CSV or PDF
    console.log("Export logs functionality would be implemented here");
  };
  
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
          <p className="text-neutral-600">You don't have permission to access the activity logs page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Activity Logs</h1>
          <p className="text-neutral-600">
            Track and monitor all system activities
          </p>
        </div>
        
        <Button onClick={handleExportLogs}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>
      
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search logs..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action: string) => (
              <SelectItem key={action} value={action}>
                {getActionDisplayName(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger>
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
          <CardDescription>Complete history of all system actions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 text-left">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredLogs.map((log: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-neutral-400 mr-2" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 font-bold">
                            {log.userName ? log.userName.charAt(0) : 'U'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-900">{log.userName || 'Unknown User'}</p>
                            <p className="text-xs text-neutral-500">ID: {log.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={getActionBadgeColor(log.action)}
                        >
                          {getActionDisplayName(log.action)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-600">
                          {log.details && typeof log.details === 'object' ? (
                            <div className="max-w-xs overflow-hidden text-ellipsis">
                              {Object.entries(log.details).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}: </span>
                                  <span>{value?.toString()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            log.details
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {log.ipAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              <Clock className="h-12 w-12 text-neutral-300 mb-4" />
              <p className="text-neutral-500">No activity logs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
