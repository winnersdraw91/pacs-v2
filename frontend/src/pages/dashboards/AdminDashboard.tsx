import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersAPI, centresAPI, studiesAPI, billingAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Users, Building2, FileImage, DollarSign } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCentres: 0,
    totalStudies: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCentres();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, centresRes, studiesRes] = await Promise.all([
        usersAPI.list(),
        centresAPI.list(),
        studiesAPI.list(),
      ]);
      setStats({
        totalUsers: usersRes.data.length,
        totalCentres: centresRes.data.length,
        totalStudies: studiesRes.data.length,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const fetchCentres = async () => {
    try {
      const response = await centresAPI.list({ limit: 10 });
      setCentres(response.data);
    } catch (error) {
      console.error('Failed to fetch centres:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your PACS system, users, centres, and billing
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnostic Centres</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCentres}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="centres">Centres</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Manage system users and their roles</CardDescription>
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

          <TabsContent value="centres" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Centres</CardTitle>
                <CardDescription>Manage diagnostic centres and their configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {centres.map((centre: any) => (
                    <div key={centre.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{centre.name}</p>
                        <p className="text-sm text-muted-foreground">{centre.contact_email}</p>
                      </div>
                      <span className={`text-sm ${centre.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {centre.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
                <CardDescription>Manage billing and pricing configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Billing management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
