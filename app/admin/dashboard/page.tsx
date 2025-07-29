'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, StatsCard } from "@/components/ui/";
import {
  Users,
  Building2,
  DollarSign,
  Activity,
  Shield,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  UserCheck,
  Ban,
  Eye,
  Edit,
  MoreHorizontal,
  Mail,
  Crown,
  BarChart3,
  Monitor,
  HardDrive,
  Wifi,
  Clock,
  Plus
} from "lucide-react";
import { useContextualLink } from "@/hooks";

const SystemAdminDashboard = () => {

  const { buildLink } = useContextualLink();

  const systemMetrics = [
    { title: "Total Users", value: "12,847", description: "Active Individual Users", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Users, bgColorClass: "bg-blue-400", textColorClass: "text-white", href: buildLink("/admin/users") },
    { title: "Active Tenants", value: "324", description: "Tenants with active subscriptions", trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: Building2, bgColorClass: "bg-green-400", textColorClass: "text-white", href: buildLink("/admin/tenants") },
    { title: "Monthly Revenue", value: "$89,230", description: "Income From Subscriptions",trend: {isPositive: true, value: 3.6, timespan: "season"}, icon: DollarSign, bgColorClass: "bg-orange-400", textColorClass: "text-white", href: buildLink("/admin/financials/revenue")  },
    { title: "System Uptime", value: "99.97%", description: "Average Time Alive", trend: {isPositive: true, value: 4.8, timespan: "season"}, icon: Activity, color: "text-purple-600", bgColorClass: "bg-red-400", textColorClass: "text-white", href: buildLink("/admin/system/status")  },
  ];

  const userManagement = [
    { name: "John Smith", email: "john@league1.com", role: "Tenant", status: "Active", joinDate: "2024-01-15", leagues: 3 },
    { name: "Sarah Johnson", email: "sarah@sportscentral.com", role: "Tenant", status: "Active", joinDate: "2024-02-20", leagues: 1 },
    { name: "Mike Wilson", email: "mike@teammanager.com", role: "League Manager", status: "Pending", joinDate: "2024-07-08", leagues: 0 },
    { name: "Emily Davis", email: "emily@eagles.com", role: "Team Manager", status: "Active", joinDate: "2024-06-12", leagues: 1 }
  ];

  const systemAlerts = [
    { type: "critical", message: "Database connection pool approaching limit", time: "2 min ago", icon: AlertTriangle },
    { type: "warning", message: "High memory usage on Server-03", time: "15 min ago", icon: AlertTriangle },
    { type: "info", message: "Scheduled maintenance completed successfully", time: "1 hour ago", icon: CheckCircle },
    { type: "error", message: "Payment gateway timeout reported", time: "3 hours ago", icon: XCircle }
  ];

  const revenueData = [
    { tenant: "Premier Sports League", revenue: "$12,450", growth: "+18%", status: "Growing" },
    { tenant: "City Basketball Association", revenue: "$8,230", growth: "+12%", status: "Stable" },
    { tenant: "Youth Football Network", revenue: "$6,890", growth: "-3%", status: "Declining" },
    { tenant: "Regional Tennis Club", revenue: "$4,120", growth: "+25%", status: "Growing" }
  ];

  const systemHealth = [
    { service: "API Gateway", status: "Healthy", uptime: "99.98%", responseTime: "120ms" },
    { service: "Database Cluster", status: "Healthy", uptime: "99.95%", responseTime: "45ms" },
    { service: "Authentication Service", status: "Warning", uptime: "99.87%", responseTime: "180ms" },
    { service: "Payment Processing", status: "Healthy", uptime: "99.99%", responseTime: "95ms" },
    { service: "File Storage", status: "Healthy", uptime: "99.96%", responseTime: "85ms" }
  ];

  const supportTickets = [
    { id: "T-2024-1089", user: "Alex Thompson", issue: "Payment processing error", priority: "High", status: "In Progress", created: "2 hours ago" },
    { id: "T-2024-1088", user: "Maria Garcia", issue: "Unable to create new league", priority: "Medium", status: "Pending", created: "4 hours ago" },
    { id: "T-2024-1087", user: "David Lee", issue: "Team roster import failing", priority: "Low", status: "Resolved", created: "1 day ago" },
    { id: "T-2024-1086", user: "Lisa Chen", issue: "Notification settings not saving", priority: "Medium", status: "In Progress", created: "2 days ago" }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string }> = {
      "Active": { variant: "default", color: "bg-green-100 text-green-800" },
      "Pending": { variant: "secondary", color: "bg-yellow-100 text-yellow-800" },
      "Suspended": { variant: "destructive", color: "bg-red-100 text-red-800" },
      "Healthy": { variant: "default", color: "bg-green-100 text-green-800" },
      "Warning": { variant: "secondary", color: "bg-yellow-100 text-yellow-800" },
      "Critical": { variant: "destructive", color: "bg-red-100 text-red-800" }
    };
    
    return variants[status] || { variant: "outline" as const, color: "bg-gray-100 text-gray-800" };
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      "High": "bg-red-100 text-red-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "Low": "bg-green-100 text-green-800"
    };
    
    return variants[priority] || "bg-gray-100 text-gray-800";
  };

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Crown className="h-8 w-8 text-blue-400" />
              System Administration
            </h1>
            <p className="text-gray-500 mt-1">Complete platform oversight and management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button variant="default" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Security Center
            </Button>
          </div>
        </div>

        {/* System Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemMetrics.map((metric, index) => (
              <StatsCard key={index} {...metric} />
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="support">Support Center</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    System Alerts
                  </CardTitle>
                  <CardDescription>Recent system notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <alert.icon className={`h-4 w-4 mt-0.5 ${
                          alert.type === 'critical' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' :
                          alert.type === 'error' ? 'text-red-500' : 'text-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Platform Statistics
                  </CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Sessions</span>
                      <span className="text-sm font-medium">2,847</span>
                    </div>
                    <Progress value={68} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">API Requests (24h)</span>
                      <span className="text-sm font-medium">184,392</span>
                    </div>
                    <Progress value={82} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Storage Usage</span>
                      <span className="text-sm font-medium">67.3 GB / 100 GB</span>
                    </div>
                    <Progress value={67} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Database Performance</span>
                      <span className="text-sm font-medium">Optimal</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Recent Platform Activity
                </CardTitle>
                <CardDescription>Latest system-wide events and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "New tenant registration", user: "SportsTech Inc.", time: "5 minutes ago", type: "success" },
                    { action: "Payment processed successfully", user: "City Basketball League", time: "12 minutes ago", type: "success" },
                    { action: "Failed login attempt detected", user: "admin@suspicious.com", time: "18 minutes ago", type: "warning" },
                    { action: "Database backup completed", user: "System", time: "1 hour ago", type: "info" },
                    { action: "New league created", user: "Youth Football Network", time: "2 hours ago", type: "success" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  User Management
                </CardTitle>
                <CardDescription>Manage platform users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Approve Pending
                      </Button>
                      <Button variant="outline" size="sm">
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                    </div>
                    <Button variant="default" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">User</th>
                          <th className="text-left p-4 font-medium">Role</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Leagues</th>
                          <th className="text-left p-4 font-medium">Join Date</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userManagement.map((user, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8" name={user.name.split(' ').map(n => n[0]).join('')}>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{user.role}</Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusBadge(user.status).color}>{user.status}</Badge>
                            </td>
                            <td className="p-4 text-sm">{user.leagues}</td>
                            <td className="p-4 text-sm text-muted-foreground">{user.joinDate}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-green-500" />
                    Service Status
                  </CardTitle>
                  <CardDescription>Real-time status of all system services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemHealth.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            service.status === 'Healthy' ? 'bg-green-500' :
                            service.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-foreground">{service.service}</p>
                            <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadge(service.status).color}>{service.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{service.responseTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    System Resources
                  </CardTitle>
                  <CardDescription>Current system resource utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          CPU Usage
                        </span>
                        <span className="text-sm text-muted-foreground">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Memory Usage
                        </span>
                        <span className="text-sm text-muted-foreground">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          Disk Usage
                        </span>
                        <span className="text-sm text-muted-foreground">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          Network I/O
                        </span>
                        <span className="text-sm text-muted-foreground">12%</span>
                      </div>
                      <Progress value={12} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Analytics Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Financial performance across all tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg border text-center">
                      <p className="text-2xl font-bold text-green-600">$89,230</p>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    </div>
                    <div className="p-4 rounded-lg border text-center">
                      <p className="text-2xl font-bold text-blue-600">$1,048,760</p>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                    </div>
                    <div className="p-4 rounded-lg border text-center">
                      <p className="text-2xl font-bold text-purple-600">15.3%</p>
                      <p className="text-sm text-muted-foreground">Growth Rate</p>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Tenant</th>
                          <th className="text-left p-4 font-medium">Monthly Revenue</th>
                          <th className="text-left p-4 font-medium">Growth</th>
                          <th className="text-left p-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((tenant, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4 font-medium text-foreground">{tenant.tenant}</td>
                            <td className="p-4 text-foreground">{tenant.revenue}</td>
                            <td className="p-4">
                              <span className={`text-sm ${
                                tenant.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {tenant.growth}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge className={
                                tenant.status === 'Growing' ? 'bg-green-100 text-green-800' :
                                tenant.status === 'Stable' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {tenant.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Center Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  Support Tickets
                </CardTitle>
                <CardDescription>Manage customer support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">All Tickets</Button>
                      <Button variant="outline" size="sm">High Priority</Button>
                      <Button variant="outline" size="sm">Unassigned</Button>
                    </div>
                    <Button variant="default" size="sm">
                      Create Ticket
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Ticket ID</th>
                          <th className="text-left p-4 font-medium">User</th>
                          <th className="text-left p-4 font-medium">Issue</th>
                          <th className="text-left p-4 font-medium">Priority</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supportTickets.map((ticket, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4">
                              <code className="text-sm bg-muted px-2 py-1 rounded">{ticket.id}</code>
                            </td>
                            <td className="p-4 font-medium text-foreground">{ticket.user}</td>
                            <td className="p-4 text-foreground">{ticket.issue}</td>
                            <td className="p-4">
                              <Badge className={getPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusBadge(ticket.status).color}>{ticket.status}</Badge>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{ticket.created}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>Core system settings and parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Maintenance Mode</p>
                        <p className="text-sm text-muted-foreground">Enable system-wide maintenance</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Rate Limiting</p>
                        <p className="text-sm text-muted-foreground">API request limits and throttling</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Email Settings</p>
                        <p className="text-sm text-muted-foreground">SMTP and notification settings</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Backup Schedule</p>
                        <p className="text-sm text-muted-foreground">Automated backup configuration</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Platform security and access controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Enforce 2FA for admin accounts</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">IP Whitelist</p>
                        <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Automatic session expiration</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-foreground">Audit Logging</p>
                        <p className="text-sm text-muted-foreground">Track all admin actions</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default SystemAdminDashboard;
