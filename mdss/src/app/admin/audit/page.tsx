"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Database, Download, FileText, Loader2, Shield, User, Settings } from "lucide-react";

type AuditLog = Record<string, unknown> & {
  id: string;
  user: string;
  email: string;
  role: string;
  action: string;
  entityAffected: string;
  entityId?: string | null;
  timestamp: string;
  details?: string | null;
  ipAddress?: string | null;
  severity: string;
  category: string;
};

const categories = [
  { value: "auth", label: "Authentication" },
  { value: "profile", label: "Profile" },
  { value: "admin", label: "Admin" },
  { value: "system", label: "System" },
  { value: "etl", label: "ETL" },
  { value: "report", label: "Reports" },
  { value: "alert", label: "Alerts" },
  { value: "general", label: "General" },
];

const severities = ["info", "warning", "error", "critical"];

function getCategoryIcon(category: string) {
  switch (category) {
    case "auth":
    case "admin":
      return <Shield className="h-4 w-4" />;
    case "profile":
      return <User className="h-4 w-4" />;
    case "etl":
      return <Database className="h-4 w-4" />;
    case "report":
      return <FileText className="h-4 w-4" />;
    case "alert":
      return <Bell className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSeverityVariant(severity: string) {
  return severity === "error" || severity === "critical" ? "destructive" : "outline";
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (severity !== "all") params.set("severity", severity);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("limit", "250");
    return params.toString();
  }, [category, severity, startDate, endDate]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/audit-logs?${queryString}`);
        const data = await response.json();
        if (data.success) {
          setLogs(data.data);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [queryString]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportParams = new URLSearchParams(queryString);
      exportParams.delete("limit");
      const response = await fetch(`/api/admin/audit-logs/export?${exportParams.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting || loading}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {severities.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Complete history of system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              data={logs}
              columns={[
                {
                  key: "timestamp",
                  header: "Timestamp",
                  render: (item) => formatTimestamp(item.timestamp),
                },
                {
                  key: "user",
                  header: "User",
                  render: (item) => (
                    <div className="flex min-w-40 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                          {item.user === "System"
                            ? "S"
                            : item.user
                                .split(" ")
                                .map((name) => name[0])
                                .join("")
                                .slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.user}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.email || item.role}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "action",
                  header: "Action",
                  render: (item) => <Badge variant={getSeverityVariant(item.severity)}>{item.action}</Badge>,
                },
                {
                  key: "category",
                  header: "Category",
                  render: (item) => (
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                  ),
                },
                {
                  key: "entityAffected",
                  header: "Entity",
                  render: (item) => (
                    <div>
                      <div className="font-medium">{item.entityAffected}</div>
                      {item.entityId && <div className="text-xs text-muted-foreground">{item.entityId}</div>}
                    </div>
                  ),
                },
                {
                  key: "details",
                  header: "Details",
                  render: (item) => (
                    <span className="block max-w-sm truncate text-sm text-muted-foreground">{item.details || ""}</span>
                  ),
                },
              ]}
              searchPlaceholder="Search audit logs..."
              pageSize={20}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
