import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { studiesAPI, usersAPI, imagingMachinesAPI, authAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  PhotoIcon, 
  CurrencyDollarIcon, 
  ArrowUpTrayIcon,
  PlusIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const DiagnosticCentreDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudies: 0,
    totalUsers: 0,
    pendingReports: 0,
    totalBilling: 0,
  });
  const [studies, setStudies] = useState([]);
  const [users, setUsers] = useState([]);
  const [imagingMachines, setImagingMachines] = useState([]);
  const [isAddTechnicianOpen, setIsAddTechnicianOpen] = useState(false);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [newTechnician, setNewTechnician] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
  });
  const [newMachine, setNewMachine] = useState({
    name: '',
    ip_address: '',
    port: 104,
    ae_title: '',
    description: '',
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchStudies();
    fetchUsers();
    fetchImagingMachines();
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

  const fetchImagingMachines = async () => {
    try {
      const response = await imagingMachinesAPI.list();
      setImagingMachines(response.data);
    } catch (error) {
      console.error('Failed to fetch imaging machines:', error);
    }
  };

  const handleCreateTechnician = async () => {
    try {
      await authAPI.register({
        ...newTechnician,
        role: 'technician',
        centre_id: user?.centre_id,
      });
      setIsAddTechnicianOpen(false);
      setNewTechnician({ username: '', email: '', full_name: '', password: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to create technician:', error);
      alert('Failed to create technician. Please check the form and try again.');
    }
  };

  const handleCreateMachine = async () => {
    try {
      await imagingMachinesAPI.create({
        ...newMachine,
        centre_id: user?.centre_id,
      });
      setIsAddMachineOpen(false);
      setNewMachine({ name: '', ip_address: '', port: 104, ae_title: '', description: '' });
      fetchImagingMachines();
    } catch (error) {
      console.error('Failed to create imaging machine:', error);
      alert('Failed to create imaging machine. Please check the form and try again.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-modern bg-clip-text text-transparent">
              Diagnostic Centre Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage your centre operations and team
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => navigate('/upload')}
              className="bg-gradient-modern hover:opacity-90 transition-opacity"
            >
              <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
              Upload Study
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
                <PhotoIcon className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudies}</div>
                <p className="text-xs text-muted-foreground">Uploaded DICOM studies</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <UsersIcon className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active technicians</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                <PhotoIcon className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReports}</div>
                <p className="text-xs text-muted-foreground">Awaiting diagnosis</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Billing</CardTitle>
                <CurrencyDollarIcon className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalBilling}</div>
                <p className="text-xs text-muted-foreground">Current cycle</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Tabs defaultValue="studies" className="space-y-4">
            <TabsList className="backdrop-blur-sm bg-white/90 border border-white/20">
              <TabsTrigger value="studies">Studies</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="machines">Imaging Machines</TabsTrigger>
            </TabsList>

            <TabsContent value="studies" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="backdrop-blur-sm bg-white/90 border-white/20">
                  <CardHeader>
                    <CardTitle>Recent Studies</CardTitle>
                    <CardDescription>View and manage your studies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="space-y-2"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {studies.map((study: any) => (
                        <motion.div 
                          key={study.id} 
                          className="flex items-center justify-between border-b pb-2 hover:bg-gray-50/50 rounded-lg p-3 transition-colors"
                          variants={fadeInUp}
                        >
                          <div>
                            <p className="font-medium">{study.study_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {study.patient_name} - {study.modality}
                            </p>
                          </div>
                          <span className="text-sm capitalize px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                            {study.status.replace('_', ' ')}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your centre's team</CardDescription>
                  </div>
                  <Dialog open={isAddTechnicianOpen} onOpenChange={setIsAddTechnicianOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="sm" className="bg-gradient-modern hover:opacity-90 transition-opacity">
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Technician
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="backdrop-blur-md bg-white/95">
                    <DialogHeader>
                      <DialogTitle>Create New Technician</DialogTitle>
                      <DialogDescription>Add a new technician to your centre</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tech-username">Username</Label>
                        <Input
                          id="tech-username"
                          value={newTechnician.username}
                          onChange={(e) => setNewTechnician({ ...newTechnician, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tech-email">Email</Label>
                        <Input
                          id="tech-email"
                          type="email"
                          value={newTechnician.email}
                          onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tech-fullname">Full Name</Label>
                        <Input
                          id="tech-fullname"
                          value={newTechnician.full_name}
                          onChange={(e) => setNewTechnician({ ...newTechnician, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tech-password">Password</Label>
                        <Input
                          id="tech-password"
                          type="password"
                          value={newTechnician.password}
                          onChange={(e) => setNewTechnician({ ...newTechnician, password: e.target.value })}
                          required
                        />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button onClick={handleCreateTechnician} className="w-full bg-gradient-modern hover:opacity-90">
                          Create Technician
                        </Button>
                      </motion.div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {users.map((user: any) => (
                    <motion.div 
                      key={user.id} 
                      className="flex items-center justify-between border-b pb-2 hover:bg-gray-50/50 rounded-lg p-3 transition-colors"
                      variants={fadeInUp}
                    >
                      <div>
                        <p className="font-medium">{user.full_name || user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-sm capitalize px-2 py-1 rounded-md bg-green-50 text-green-700">
                        {user.role.replace('_', ' ')}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="machines" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-sm bg-white/90 border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Imaging Machines</CardTitle>
                    <CardDescription>Configure DICOM servers and PACS connections</CardDescription>
                  </div>
                  <Dialog open={isAddMachineOpen} onOpenChange={setIsAddMachineOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="sm" className="bg-gradient-modern hover:opacity-90 transition-opacity">
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Machine
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="backdrop-blur-md bg-white/95">
                    <DialogHeader>
                      <DialogTitle>Configure Imaging Machine</DialogTitle>
                      <DialogDescription>Add a new DICOM imaging device</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="machine-name">Machine Name</Label>
                        <Input
                          id="machine-name"
                          value={newMachine.name}
                          onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                          placeholder="e.g., CT Scanner 1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="machine-ip">IP Address</Label>
                        <Input
                          id="machine-ip"
                          value={newMachine.ip_address}
                          onChange={(e) => setNewMachine({ ...newMachine, ip_address: e.target.value })}
                          placeholder="e.g., 192.168.1.100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="machine-port">Port</Label>
                        <Input
                          id="machine-port"
                          type="number"
                          value={newMachine.port}
                          onChange={(e) => setNewMachine({ ...newMachine, port: parseInt(e.target.value) })}
                          placeholder="104"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="machine-ae">AE Title</Label>
                        <Input
                          id="machine-ae"
                          value={newMachine.ae_title}
                          onChange={(e) => setNewMachine({ ...newMachine, ae_title: e.target.value })}
                          placeholder="e.g., CT_SCANNER_1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="machine-desc">Description</Label>
                        <Input
                          id="machine-desc"
                          value={newMachine.description}
                          onChange={(e) => setNewMachine({ ...newMachine, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button onClick={handleCreateMachine} className="w-full bg-gradient-modern hover:opacity-90">
                          Add Machine
                        </Button>
                      </motion.div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {imagingMachines.length === 0 ? (
                    <p className="text-muted-foreground">No imaging machines configured</p>
                  ) : (
                    imagingMachines.map((machine: any) => (
                      <motion.div 
                        key={machine.id} 
                        className="flex items-center justify-between border-b pb-2 hover:bg-gray-50/50 rounded-lg p-3 transition-colors"
                        variants={fadeInUp}
                      >
                        <div className="flex items-center gap-3">
                          <ComputerDesktopIcon className="h-5 w-5 text-indigo-500" />
                          <div>
                            <p className="font-medium">{machine.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {machine.ip_address}:{machine.port} ({machine.ae_title})
                            </p>
                            {machine.description && (
                              <p className="text-xs text-muted-foreground">{machine.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-md ${machine.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {machine.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};
