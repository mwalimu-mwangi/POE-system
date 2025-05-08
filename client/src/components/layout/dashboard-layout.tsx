import React, { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bell, Home, FileText, ClipboardCheck, CheckCircle, BarChart3, Users, Settings, Clock, Menu, X, Layers, GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SideNavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  isAdmin?: boolean;
}

const SideNavItem = ({ icon, label, href, active, isAdmin }: SideNavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center py-3 px-4 space-x-3 rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
          isAdmin && "mt-1"
        )}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  const unreadCount = notifications.filter((notification: any) => !notification.isRead).length;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isAdmin = user?.role === 'admin';
  const isAssessor = user?.role === 'assessor';
  const isVerifier = user?.role === 'internal_verifier' || user?.role === 'external_verifier';

  const sideNavItems = [
    { icon: <Home className="h-5 w-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <FileText className="h-5 w-5" />, label: "Submissions", href: "/submissions" },
    ...(isAssessor || isAdmin ? [{ icon: <ClipboardCheck className="h-5 w-5" />, label: "Assessments", href: "/assessment" }] : []),
    ...(isVerifier || isAdmin ? [{ icon: <CheckCircle className="h-5 w-5" />, label: "Verification", href: "/verification" }] : []),
    { icon: <BarChart3 className="h-5 w-5" />, label: "Reports", href: "/reports" },
  ];

  const adminNavItems = [
    { icon: <Users className="h-5 w-5" />, label: "User Management", href: "/user-management" },
    { icon: <GraduationCap className="h-5 w-5" />, label: "Educational Structure", href: "/educational-structure" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/settings" },
    { icon: <Clock className="h-5 w-5" />, label: "Activity Logs", href: "/activity-logs" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center text-white font-bold">
              PoE
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">College PoE System</h1>
              <p className="text-xs text-neutral-500">Portfolio of Evidence</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.fullName}</p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="h-10 w-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-700 font-bold">
                {user?.fullName?.charAt(0)}
              </div>
            </div>
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
                        PoE
                      </div>
                      <div>
                        <h1 className="text-sm font-bold text-neutral-900">College PoE System</h1>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100vh-64px)]">
                    <div className="p-4 space-y-1">
                      {sideNavItems.map((item) => (
                        <SideNavItem
                          key={item.href}
                          icon={item.icon}
                          label={item.label}
                          href={item.href}
                          active={location === item.href}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                      
                      {(isAdmin) && (
                        <>
                          <div className="pt-4 mt-4 border-t border-neutral-200">
                            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
                              Administration
                            </h3>
                            {adminNavItems.map((item) => (
                              <SideNavItem
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={location === item.href}
                                isAdmin
                                onClick={() => setMobileOpen(false)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      <div className="pt-4 mt-4 border-t border-neutral-200">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleLogout}
                        >
                          Log out
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block bg-white border-r border-neutral-200 w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
          <ScrollArea className="h-full">
            <nav className="py-6 px-3 space-y-1">
              {sideNavItems.map((item) => (
                <SideNavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={location === item.href}
                />
              ))}
              
              {(isAdmin) && (
                <>
                  <div className="pt-4 mt-4 border-t border-neutral-200">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
                      Administration
                    </h3>
                    {adminNavItems.map((item) => (
                      <SideNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={location === item.href}
                        isAdmin
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="pt-4 mt-4 border-t border-neutral-200 px-3">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-6 px-4 md:px-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30">
        <div className="flex justify-around">
          {sideNavItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex flex-col items-center py-3 px-2 text-xs",
                location === item.href ? "text-primary" : "text-neutral-500"
              )}>
                {React.cloneElement(item.icon as React.ReactElement, { className: "h-6 w-6 mb-1" })}
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
