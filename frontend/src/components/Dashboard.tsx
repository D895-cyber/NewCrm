import { useEffect, useState } from "react";
import { 
  BarChart3, 
  FileText, 
  MapPin, 
  Calendar, 
  Monitor, 
  Wrench, 
  TrendingUp, 
  Users, 
  Settings, 
  User,
  ClipboardList,
  AlertTriangle,
  Package,
  RotateCcw,
  Upload,
  Cloud,
  LogOut,
  Menu,
  X,
  Download,
  Truck,
  LayoutDashboard
} from "lucide-react";
import { Separator } from "./ui/separator";
import { NotificationBar } from "./ui/notification-bar";
import { Button } from "./ui/button";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../utils/api/client";

import { DashboardPage } from "./pages/DashboardPage";
import { SitesPage } from "./pages/SitesPage";
import { ProjectorsPage } from "./pages/ProjectorsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { ServiceManagementPage } from "./pages/ServiceManagementPage";
import { ServiceRecommendationsPage } from "./pages/ServiceRecommendationsPage";
import { FSEPage } from "./pages/FSEPage";
import { SparePartsPage } from "./pages/SparePartsPage";
import { RMAPage } from "./pages/RMAPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { CloudStoragePage } from "./pages/CloudStoragePage";
import { BulkUpload } from "./BulkUpload";
import { ServiceReportEditor } from "./pages/ServiceReportEditor";
import { DTRPage } from "./pages/DTRPage";
import { AMCContractsPage } from "./pages/AMCContractsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ServiceReportsAnalysisPage } from "./pages/ServiceReportsAnalysisPage";
import { LLMTrafficPage } from "./pages/LLMTrafficPage";
import { FSEServiceReportAnalytics } from "./pages/FSEServiceReportAnalytics";
import { ServiceAssignmentPage } from "./pages/ServiceAssignmentPage";
import { ASCOMPReportDownloader } from "./pages/ASCOMPReportDownloader";
import { ReportTemplatesPage } from "./pages/ReportTemplatesPage";
import { UploadOriginalPDF } from "./pages/UploadOriginalPDF";
import { ProjectorTrackingPage } from "./pages/ProjectorTrackingPage";
import { RMATrackingPage } from "./pages/RMATrackingPage";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { SiteAnalyticsDashboard } from "./pages/SiteAnalyticsDashboard";
import { WorkflowManagement } from "./pages/WorkflowManagement";
import RMAWorkflowManagement from "./pages/RMAWorkflowManagement";


const mainNavItems = [
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: LayoutDashboard, label: "RMA Portal Dashboard", href: "#rma-dashboard" },
  { icon: MapPin, label: "Sites" },
  { icon: Monitor, label: "Projectors" },
  { icon: FileText, label: "Purchase Orders" },
  { icon: Upload, label: "Bulk Upload" },
];

const operationsItems = [
  { icon: Calendar, label: "Service Management" },
  { icon: ClipboardList, label: "Service Assignments" },
  { icon: Wrench, label: "Service Recommendations" },
  { icon: Users, label: "FSE Management" },
  { icon: Package, label: "Spare Parts" },
  { icon: RotateCcw, label: "RMA Management" },
  { icon: Truck, label: "RMA Tracking" },
  { icon: Settings, label: "RMA Workflow" },
  { icon: AlertTriangle, label: "Daily Trouble Reports" },
  { icon: ClipboardList, label: "Work Orders" },
  { icon: FileText, label: "AMC Contracts" },
  { icon: Monitor, label: "Projector Tracking" },
];

const analyticsItems = [
  { icon: TrendingUp, label: "RMA Analytics" },
  { icon: MapPin, label: "Site Analytics" },
  { icon: Settings, label: "Workflow Management" },
  { icon: AlertTriangle, label: "Warranty Alerts" },
  { icon: FileText, label: "Reports" },
  { icon: FileText, label: "Service Reports Analysis" },
  { icon: BarChart3, label: "FSE Analytics" },
  { icon: BarChart3, label: "FSE Service Report Analytics" },
  { icon: Download, label: "ASCOMP Report Downloader" },
  { icon: Upload, label: "Upload Original PDF" },
];

const otherItems = [
  { icon: Users, label: "User Management" },
  { icon: Cloud, label: "Cloud Storage" },
  { icon: Settings, label: "Settings" },
  { icon: FileText, label: "Report Templates" },
  { icon: User, label: "Profile" },
];

interface DashboardProps {
  isMobile?: boolean;
}

export function Dashboard({ isMobile = false }: DashboardProps) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [reportIdFromHash, setReportIdFromHash] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Use shared data context
  const { dashboardData } = useData();
  const { user, token, logout, isImpersonating, stopImpersonation } = useAuth();
  const notifications = dashboardData?.warrantyAlerts || [];

  // Set authentication token in API client when component mounts or token changes
  useEffect(() => {
    if (token) {
      apiClient.setAuthToken(token);
    }
  }, [token]);

  // Lightweight hash routing to open report editor directly
  useEffect(() => {
    const apply = () => {
      const match = window.location.hash.match(/#\/service-reports\/([^/?]+)/);
      console.log('🔍 Hash routing check:', {
        currentHash: window.location.hash,
        match: match,
        reportId: match ? match[1] : null
      });
      setReportIdFromHash(match ? match[1] : null);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  // Hash routing for page navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      console.log('Dashboard hash routing:', hash);
      
      switch (hash) {
        case '#rma-management':
          setActivePage('RMA Management');
          break;
        case '#dtr-management':
          setActivePage('Daily Trouble Reports');
          break;
        case '#dashboard':
          setActivePage('Dashboard');
          break;
        default:
          // Keep current page if hash doesn't match
          break;
      }
    };

    // Apply on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Hash routing for analytics pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      console.log('🔍 Analytics hash routing check:', { currentHash: hash });
      
      if (hash === '#site-analytics') {
        setActivePage('Site Analytics');
      } else if (hash === '#analytics') {
        setActivePage('RMA Analytics');
      }
    };
    
    const handleNavigateToPage = (event: CustomEvent) => {
      setActivePage(event.detail);
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('navigateToPage', handleNavigateToPage as EventListener);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('navigateToPage', handleNavigateToPage as EventListener);
    };
  }, []);

  // Filter navigation items based on user role
  const filteredOtherItems = otherItems.filter(item => {
    if (item.label === "User Management" && user?.role !== 'admin') {
      return false;
    }
    if (item.label === "Report Templates" && !['admin', 'manager'].includes(user?.role ?? '')) {
      return false;
    }
    return true;
  });

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
  };

  const handleDismissAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedNotifications(prev => new Set([...prev, ...allIds]));
  };

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;
    
    // If item has href (hash URL), navigate to it instead of setting active page
    const handleClick = () => {
      if (item.href) {
        // Navigate to the hash route
        window.location.hash = item.href;
        // Dispatch a custom event to trigger re-render
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        setActivePage(item.label);
      }
      if (isMobile) {
        setSidebarOpen(false);
      }
    };
    
    return (
      <button
        key={item.label}
        onClick={handleClick}
        className={`dark-nav-item w-full text-left ${
          isActive ? "dark-nav-item-active" : ""
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? "text-dark-primary" : "text-dark-secondary"}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  const renderContent = () => {
    if (reportIdFromHash) {
      return <ServiceReportEditor reportId={reportIdFromHash} />;
    }
    switch (activePage) {
      case "Dashboard":
        return <DashboardPage />;
      case "Sites":
        return <SitesPage />;
      case "Projectors":
        return <ProjectorsPage />;
      case "Purchase Orders":
        return <PurchaseOrdersPage />;
      case "Bulk Upload":
        return <BulkUpload />;
      case "Service Management":
        return <ServiceManagementPage />;
      case "Service Assignments":
        return <ServiceAssignmentPage />;
      case "Service Recommendations":
        return <ServiceRecommendationsPage />;
        case "FSE Management":
          return <FSEPage />;
      case "Spare Parts":
        return <SparePartsPage />;
      case "RMA Management":
        return <RMAPage />;
      case "RMA Tracking":
        return <RMATrackingPage />;
      case "RMA Workflow":
        return <RMAWorkflowManagement />;
      case "Daily Trouble Reports":
        return <DTRPage />;
      case "AMC Contracts":
        return <AMCContractsPage />;
      case "Projector Tracking":
        return <ProjectorTrackingPage />;
      case "RMA Analytics":
        return <AnalyticsDashboard />;
      case "Site Analytics":
        return <SiteAnalyticsDashboard />;
      case "Workflow Management":
        return <WorkflowManagement />;
      case "Analytics":
        return <AnalyticsPage />;
      case "Reports":
        return <ReportsPage />;
      case "Service Reports Analysis":
        return <ServiceReportsAnalysisPage />;
      case "FSE Analytics":
        return <LLMTrafficPage />;
      case "FSE Service Report Analytics":
        return <FSEServiceReportAnalytics />;
      case "ASCOMP Report Downloader":
        return <ASCOMPReportDownloader />;
      case "Upload Original PDF":
        return <UploadOriginalPDF />;

      case "User Management":
        return <UserManagementPage />;
      case "Cloud Storage":
        return <CloudStoragePage />;
      case "Settings":
        return <SettingsPage />;
      case "Report Templates":
        return <ReportTemplatesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg border-b border-dark-color p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-dark-primary">ProjectorCare</h1>
              <p className="text-xs text-dark-secondary">Warranty Management</p>
            </div>
          </div>
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="text-dark-secondary hover:text-dark-primary"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out' : 'w-72'} bg-dark-bg border-r border-dark-color flex flex-col ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}>
        {/* Logo */}
        <div className={`${isMobile ? 'pt-20' : ''} p-8 border-b border-dark-color`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center dark-shadow-lg relative overflow-hidden">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-primary">ProjectorCare</h1>
              <p className="text-xs text-dark-secondary font-medium">Warranty Management System</p>
            </div>
          </div>
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-dark-color">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-dark-secondary" />
                <div className="flex flex-col">
                  <span className="text-sm text-dark-secondary">
                    {user?.profile?.firstName || user?.username}
                  </span>
                  {isImpersonating && (
                    <span className="text-xs text-yellow-400 font-medium">
                      Impersonating
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {isImpersonating && (
                  <Button
                    onClick={stopImpersonation}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-400 hover:text-yellow-300"
                    title="Stop Impersonation"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="text-dark-secondary hover:text-dark-primary"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-2">
            {mainNavItems.map((item) => renderNavItem(item, activePage === item.label))}
          </div>

          <Separator style={{ backgroundColor: '#374151' }} />

          {/* Operations Group */}
          <div className="space-y-4">
            <div className="px-4">
              <h3 className="text-xs font-bold text-dark-secondary uppercase tracking-widest">Operations</h3>
            </div>
            <div className="space-y-2">
              {operationsItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          </div>

          <Separator style={{ backgroundColor: '#374151' }} />

          {/* Analytics Group */}
          <div className="space-y-4">
            <div className="px-4">
              <h3 className="text-xs font-bold text-dark-secondary uppercase tracking-widest">Analytics</h3>
            </div>
            <div className="space-y-2">
              {analyticsItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          </div>

          <Separator style={{ backgroundColor: '#374151' }} />

          {/* Other */}
          <div className="space-y-4">
            <div className="px-4">
              <h3 className="text-xs font-bold text-dark-secondary uppercase tracking-widest">Other</h3>
            </div>
            <div className="space-y-2">
              {filteredOtherItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative ${isMobile ? 'ml-0' : ''}`}>
        {/* Notification Bar */}
        <NotificationBar
          notifications={notifications.filter(n => !dismissedNotifications.has(n.id))}
          onDismiss={handleDismissNotification}
          onDismissAll={handleDismissAllNotifications}
        />
        
        {/* Content with proper spacing for notification bar and mobile header */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'pt-20' : ''}`} style={{ 
          paddingTop: notifications.filter(n => !dismissedNotifications.has(n.id)).length > 0 ? (isMobile ? '80px' : '60px') : (isMobile ? '80px' : '0')
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}