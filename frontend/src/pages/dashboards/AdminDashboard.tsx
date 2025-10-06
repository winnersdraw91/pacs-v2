import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usersAPI, centresAPI, studiesAPI, authAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Users, Building2, FileImage, DollarSign, Plus } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCentres: 0,
    totalStudies: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [centres, setCentres] = useState([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCentreDialogOpen, setIsCentreDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'radiologist',
    centre_id: undefined as number | undefined,
  });
  const [newCentre, setNewCentre] = useState({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: '',
  });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.register(newUser);
      setIsUserDialogOpen(false);
      setNewUser({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'radiologist',
        centre_id: undefined as number | undefined,
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await centresAPI.create(newCentre);
      setIsCentreDialogOpen(false);
      setNewCentre({
        name: '',
        address: '',
        contact_email: '',
        contact_phone: '',
      });
      fetchCentres();
      fetchStats();
    } catch (error) {
      console.error('Failed to create centre:', error);
      alert('Failed to create centre. Please try again.');
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Manage system users and their roles</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new radiologist or other user to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="radiologist">Radiologist</SelectItem>
                              <SelectItem value="technician">Technician</SelectItem>
                              <SelectItem value="diagnostic_centre">Diagnostic Centre</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newUser.role === 'diagnostic_centre' && (
                          <div className="grid gap-2">
                            <Label htmlFor="centre">Diagnostic Centre</Label>
                            <Select
                              value={newUser.centre_id?.toString()}
                              onValueChange={(value) => setNewUser({ ...newUser, centre_id: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select centre" />
                              </SelectTrigger>
                              <SelectContent>
                                {centres.map((centre: any) => (
                                  <SelectItem key={centre.id} value={centre.id.toString()}>
                                    {centre.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create User</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No users found</p>
                  ) : (
                    users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{user.full_name || user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <span className="text-sm capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="centres" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Diagnostic Centres</CardTitle>
                  <CardDescription>Manage diagnostic centres and their configuration</CardDescription>
                </div>
                <Dialog open={isCentreDialogOpen} onOpenChange={setIsCentreDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Centre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Diagnostic Centre</DialogTitle>
                      <DialogDescription>
                        Add a new diagnostic centre to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCentre}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="centre_name">Centre Name</Label>
                          <Input
                            id="centre_name"
                            value={newCentre.name}
                            onChange={(e) => setNewCentre({ ...newCentre, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={newCentre.address}
                            onChange={(e) => setNewCentre({ ...newCentre, address: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contact_email">Contact Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={newCentre.contact_email}
                            onChange={(e) => setNewCentre({ ...newCentre, contact_email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="contact_phone">Contact Phone</Label>
                          <Input
                            id="contact_phone"
                            value={newCentre.contact_phone}
                            onChange={(e) => setNewCentre({ ...newCentre, contact_phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Centre</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {centres.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No centres found</p>
                  ) : (
                    centres.map((centre: any) => (
                      <div key={centre.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{centre.name}</p>
                          <p className="text-sm text-muted-foreground">{centre.contact_email}</p>
                        </div>
                        <span className={`text-sm ${centre.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {centre.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))
                  )}
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
