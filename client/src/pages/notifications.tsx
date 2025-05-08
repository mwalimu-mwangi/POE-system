import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, CheckCircle, FileText, User, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("all");
  
  // Get notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });
  
  // Split notifications by type and read status
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  const readNotifications = notifications.filter((n: any) => n.isRead);
  
  const submissionNotifications = notifications.filter((n: any) => n.type === 'submission');
  const assessmentNotifications = notifications.filter((n: any) => n.type === 'assessment');
  const verificationNotifications = notifications.filter((n: any) => n.type === 'verification');
  const systemNotifications = notifications.filter((n: any) => n.type === 'system');
  
  // Get current notifications based on selected tab
  const getCurrentNotifications = () => {
    switch (currentTab) {
      case 'unread':
        return unreadNotifications;
      case 'submission':
        return submissionNotifications;
      case 'assessment':
        return assessmentNotifications;
      case 'verification':
        return verificationNotifications;
      case 'system':
        return systemNotifications;
      default:
        return notifications;
    }
  };
  
  const currentNotifications = getCurrentNotifications();
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/mark-all-read", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'assessment':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'verification':
        return <UserCheck className="h-5 w-5 text-amber-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Get badge color for notification type
  const getNotificationBadgeClass = (type: string) => {
    switch (type) {
      case 'submission':
        return "bg-blue-50 text-blue-600 border-blue-200";
      case 'assessment':
        return "bg-green-50 text-green-600 border-green-200";
      case 'verification':
        return "bg-amber-50 text-amber-600 border-amber-200";
      case 'system':
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };
  
  // Get badge text for notification type
  const getNotificationTypeName = (type: string) => {
    switch (type) {
      case 'submission':
        return "Submission";
      case 'assessment':
        return "Assessment";
      case 'verification':
        return "Verification";
      case 'system':
        return "System";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Format notification date
  const formatNotificationDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Effect to mark notification as read when clicked
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  
  useEffect(() => {
    if (selectedNotification) {
      handleMarkAsRead(selectedNotification);
      setSelectedNotification(null);
    }
  }, [selectedNotification]);
  
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Notifications</h1>
          <p className="text-neutral-600">
            Stay updated with your latest activities
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleMarkAllAsRead}
          disabled={unreadNotifications.length === 0 || markAllAsReadMutation.isPending}
        >
          {markAllAsReadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Marking as read...
            </>
          ) : (
            "Mark All as Read"
          )}
        </Button>
      </div>
      
      {/* Notification Tabs */}
      <Tabs 
        defaultValue="all" 
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-6 mb-8">
          <TabsTrigger value="all" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            All
            <Badge variant="secondary" className="ml-2 bg-neutral-100">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center">
            Unread
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
              {unreadNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="submission" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            Verifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentTab === "all" 
                  ? "All Notifications" 
                  : currentTab === "unread"
                  ? "Unread Notifications"
                  : `${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Notifications`}
              </CardTitle>
              <CardDescription>
                {currentTab === "unread" 
                  ? "Notifications that you haven't read yet" 
                  : "Your recent activity notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : currentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {currentNotifications.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start p-4 rounded-lg border ${
                        notification.isRead ? 'bg-white' : 'bg-blue-50/20 border-blue-100'
                      }`}
                      onClick={() => !notification.isRead && setSelectedNotification(notification.id)}
                    >
                      <div className="p-2 bg-white rounded-full border mr-4">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <Badge 
                              variant="outline" 
                              className={getNotificationBadgeClass(notification.type)}
                            >
                              {getNotificationTypeName(notification.type)}
                            </Badge>
                            <span className="ml-2 text-xs text-neutral-500">
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                          </div>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">{notification.title}</h3>
                        <p className="text-sm text-neutral-600">{notification.message}</p>
                        {notification.linkedItemId && (
                          <div className="mt-2">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-primary text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // In a real app, we would navigate to the appropriate page
                                // based on the notification type and linkedItemId
                                console.log(`Navigate to ${notification.type}/${notification.linkedItemId}`);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">No notifications</h3>
                  <p className="text-neutral-500 text-center max-w-md">
                    {currentTab === "unread" 
                      ? "You've read all your notifications." 
                      : `You don't have any ${currentTab === "all" ? "" : currentTab + " "}notifications at the moment.`}
                  </p>
                </div>
              )}
            </CardContent>
            {currentNotifications.length > 10 && (
              <CardFooter className="flex justify-center border-t pt-4">
                <Button variant="outline">
                  Load More
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
