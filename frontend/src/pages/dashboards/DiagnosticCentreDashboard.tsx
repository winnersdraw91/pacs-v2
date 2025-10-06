import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studiesAPI, usersAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Users, FileImage, DollarSign, Upload } from 'lucide-react';

export const DiagnosticCentreDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudies: 0,
    totalUsers: 0,
    pendingReports: 0,
    totalBilling: 0,
  });
  const [studies, setStudies] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchStudies();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const [studiesRes, usersRes] = await Promise.all([
        studiesAPI.list(),
        usersAPI.list(),
      ]);
      const studiesData = studiesRes.data;
      setStats({
        totalStudies: studiesData.length,
        totalUsers: usersRes.data.length,
        pendingReports: studiesData.filter((s: any) => 
          s.status === 'uploaded' || s.status === 'assigned'
        ).length,
        totalBilling: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchStudies = async () => {
    try {
      const response = await studiesAPI.list({ limit: 10 });
      setStudies(response.data);
    } catch (error) {
      console.error('Failed to fetch studies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list({ limit: 10 });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Diagnostic Centre Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your centre operations and team
            </p>
          </div>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Study
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalBilling}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="studies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="studies">Studies</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="studies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Studies</CardTitle>
                <CardDescription>View and manage your studies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studies.map((study: any) => (
                    <div key={study.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{study.study_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {study.patient_name} - {study.modality}
                        </p>
                      </div>
                      <span className="text-sm capitalize">{study.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your centre's team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{user.full_name || user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-sm capitalize">{user.role.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
