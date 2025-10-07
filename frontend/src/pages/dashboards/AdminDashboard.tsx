import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usersAPI, centresAPI, studiesAPI, authAPI, billingAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  DocumentIcon, 
  CurrencyDollarIcon, 
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCentres: 0,
    totalStudies: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
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
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([]);
  const [radiologists, setRadiologists] = useState<any[]>([]);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [pricingType, setPricingType] = useState<'centre' | 'radiologist'>('centre');
  const [newPricing, setNewPricing] = useState({
    centre_id: undefined as number | undefined,
    radiologist_id: undefined as number | undefined,
    modality: 'xray',
    price: 0,
    currency: 'usd',
  });

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCentres();
    fetchPricingConfigs();
    fetchRadiologists();
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

  const fetchPricingConfigs = async () => {
    try {
      const response = await billingAPI.listPricing();
      setPricingConfigs(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing configs:', error);
    }
  };

  const fetchRadiologists = async () => {
    try {
      const response = await usersAPI.list();
      const rads = response.data.filter((user: any) => user.role === 'radiologist');
      setRadiologists(rads);
    } catch (error) {
      console.error('Failed to fetch radiologists:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((newUser.role === 'technician' || newUser.role === 'diagnostic_centre') && !newUser.centre_id) {
      alert('Technicians and Diagnostic Centre users must be associated with a diagnostic centre');
      return;
    }
    
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

  const handleCreatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pricingData: any = {
        modality: newPricing.modality,
        price: newPricing.price,
        currency: newPricing.currency,
      };
      
      if (pricingType === 'centre' && newPricing.centre_id) {
        pricingData.centre_id = parseInt(newPricing.centre_id.toString());
      } else if (pricingType === 'radiologist' && newPricing.radiologist_id) {
        pricingData.radiologist_id = parseInt(newPricing.radiologist_id.toString());
      }
      
      await billingAPI.createPricing(pricingData);
      setIsPricingDialogOpen(false);
      setNewPricing({
        centre_id: undefined,
        radiologist_id: undefined,
        modality: 'xray',
        price: 0,
        currency: 'usd',
      });
      fetchPricingConfigs();
      alert('Pricing configuration created successfully!');
    } catch (error: any) {
      console.error('Failed to create pricing:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error detail:', JSON.stringify(error.response?.data?.detail, null, 2));
      const detailMsg = Array.isArray(error.response?.data?.detail) 
        ? error.response.data.detail.map((d: any) => d.msg || d).join(', ')
        : error.response?.data?.detail || 'Please try again.';
      alert(`Failed to create pricing: ${detailMsg}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await usersAPI.delete(userId);
      fetchUsers();
      fetchStats();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await usersAPI.update(userId, { is_active: !currentStatus });
      fetchUsers();
      alert('User status updated successfully!');
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteCentre = async (centreId: number) => {
    if (!window.confirm('Are you sure you want to delete this centre?')) {
      return;
    }
    
    try {
      await centresAPI.delete(centreId);
      fetchCentres();
      fetchStats();
      alert('Centre deleted successfully!');
    } catch (error) {
      console.error('Failed to delete centre:', error);
      alert('Failed to delete centre. Please try again.');
    }
  };

  const handleToggleCentreStatus = async (centreId: number, currentStatus: boolean) => {
    try {
      await centresAPI.update(centreId, { is_active: !currentStatus });
      fetchCentres();
      alert('Centre status updated successfully!');
    } catch (error) {
      console.error('Failed to update centre status:', error);
      alert('Failed to update centre status. Please try again.');
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

        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-modern text-white border-0 shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
                <UserGroupIcon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-md bg-white/90 border border-white/20 shadow-glass hover:shadow-glow transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Diagnostic Centres</CardTitle>
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalCentres}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-md bg-white/90 border border-white/20 shadow-glass hover:shadow-glow transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
                <DocumentIcon className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalStudies}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-md bg-white/90 border border-white/20 shadow-glass hover:shadow-glow transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">${stats.totalRevenue}</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

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
                      <PlusIcon className="h-4 w-4 mr-2" />
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
                        {(newUser.role === 'diagnostic_centre' || newUser.role === 'technician') && (
                          <div className="grid gap-2">
                            <Label htmlFor="centre">
                              Diagnostic Centre
                              <span className="text-red-500">*</span>
                            </Label>
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
                      <motion.div 
                        key={user.id} 
                        className="flex items-center justify-between border-b pb-2 backdrop-blur-sm bg-white/50 rounded-lg p-3 hover:bg-white/70 transition-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{user.full_name || user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <span className="text-xs capitalize text-indigo-600">{user.role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={() => handleToggleUserStatus(user.id, user.is_active)}
                            />
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
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
                      <PlusIcon className="h-4 w-4 mr-2" />
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
                      <motion.div 
                        key={centre.id} 
                        className="flex items-center justify-between border-b pb-2 backdrop-blur-sm bg-white/50 rounded-lg p-3 hover:bg-white/70 transition-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{centre.name}</p>
                          <p className="text-sm text-muted-foreground">{centre.contact_email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {centre.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Switch
                              checked={centre.is_active}
                              onCheckedChange={() => handleToggleCentreStatus(centre.id, centre.is_active)}
                            />
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCentre(centre.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pricing Configuration</CardTitle>
                  <CardDescription>Set per-modality charges for centres and payouts for radiologists</CardDescription>
                </div>
                <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Pricing Configuration</DialogTitle>
                      <DialogDescription>Configure modality-based pricing for centres or radiologists</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePricing}>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Pricing Type</Label>
                          <Select value={pricingType} onValueChange={(value: 'centre' | 'radiologist') => setPricingType(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="centre">Centre Charges</SelectItem>
                              <SelectItem value="radiologist">Radiologist Payouts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {pricingType === 'centre' ? (
                          <div className="grid gap-2">
                            <Label htmlFor="centre">Diagnostic Centre</Label>
                            <Select
                              value={newPricing.centre_id?.toString()}
                              onValueChange={(value) => setNewPricing({ ...newPricing, centre_id: parseInt(value), radiologist_id: undefined })}
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
                        ) : (
                          <div className="grid gap-2">
                            <Label htmlFor="radiologist">Radiologist</Label>
                            <Select
                              value={newPricing.radiologist_id?.toString()}
                              onValueChange={(value) => setNewPricing({ ...newPricing, radiologist_id: parseInt(value), centre_id: undefined })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select radiologist" />
                              </SelectTrigger>
                              <SelectContent>
                                {radiologists.map((rad: any) => (
                                  <SelectItem key={rad.id} value={rad.id.toString()}>
                                    {rad.full_name || rad.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div className="grid gap-2">
                          <Label htmlFor="modality">Modality</Label>
                          <Select
                            value={newPricing.modality}
                            onValueChange={(value) => setNewPricing({ ...newPricing, modality: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xray">X-Ray</SelectItem>
                              <SelectItem value="ct">CT Scan</SelectItem>
                              <SelectItem value="mri">MRI</SelectItem>
                              <SelectItem value="ultrasound">Ultrasound</SelectItem>
                              <SelectItem value="pet">PET Scan</SelectItem>
                              <SelectItem value="mammography">Mammography</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newPricing.price}
                            onChange={(e) => setNewPricing({ ...newPricing, price: parseFloat(e.target.value) || 0 })}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={newPricing.currency}
                            onValueChange={(value) => setNewPricing({ ...newPricing, currency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usd">USD</SelectItem>
                              <SelectItem value="inr">INR</SelectItem>
                              <SelectItem value="aed">AED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button type="submit">Create Pricing</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Centre Charges</h3>
                    <div className="space-y-2">
                      {pricingConfigs.filter((p: any) => p.centre_id).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No centre pricing configured</p>
                      ) : (
                        pricingConfigs.filter((p: any) => p.centre_id).map((pricing: any) => {
                          const centre = centres.find((c: any) => c.id === pricing.centre_id);
                          return (
                            <div key={pricing.id} className="flex items-center justify-between border rounded-lg p-3">
                              <div>
                                <p className="font-medium">{centre?.name || 'Unknown Centre'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {pricing.modality.toUpperCase()} - {pricing.price} {pricing.currency.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Radiologist Payouts</h3>
                    <div className="space-y-2">
                      {pricingConfigs.filter((p: any) => p.radiologist_id).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No radiologist pricing configured</p>
                      ) : (
                        pricingConfigs.filter((p: any) => p.radiologist_id).map((pricing: any) => {
                          const radiologist = radiologists.find((r: any) => r.id === pricing.radiologist_id);
                          return (
                            <div key={pricing.id} className="flex items-center justify-between border rounded-lg p-3">
                              <div>
                                <p className="font-medium">{radiologist?.full_name || radiologist?.username || 'Unknown Radiologist'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {pricing.modality.toUpperCase()} - {pricing.price} {pricing.currency.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
