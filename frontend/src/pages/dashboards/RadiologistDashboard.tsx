import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { studiesAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';
import { 
  PhotoIcon, 
  ClockIcon, 
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { fadeInUp, staggerContainer } from '@/lib/utils';

export const RadiologistDashboard: React.FC = () => {
  const [studies, setStudies] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    inReview: 0,
    completed: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const params: any = { limit: 50 };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (modalityFilter && modalityFilter !== 'all') {
        params.modality = modalityFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }

      const response = await studiesAPI.list(params);
      const studiesData = response.data;
      setStudies(studiesData);

      setStats({
        pending: studiesData.filter((s: any) => s.status === 'uploaded').length,
        inReview: studiesData.filter((s: any) => s.status === 'in_review').length,
        completed: studiesData.filter((s: any) => s.status === 'verified').length,
      });
    } catch (error) {
      console.error('Failed to fetch studies:', error);
    }
  };

  const handleSearch = () => {
    fetchStudies();
  };

  const handleReset = () => {
    setSearchTerm('');
    setModalityFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setTimeout(fetchStudies, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-orange-100 text-orange-800';
      case 'report_generated':
        return 'bg-purple-100 text-purple-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-modern bg-clip-text text-transparent">
            Radiologist Dashboard
          </h2>
          <p className="text-muted-foreground">
            Review studies and generate verified reports
          </p>
        </motion.div>

        <motion.div 
          className="grid gap-4 md:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Studies</CardTitle>
                <ClockIcon className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                <PhotoIcon className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inReview}</div>
                <p className="text-xs text-muted-foreground">Currently reviewing</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-modern transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Reports verified</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="backdrop-blur-sm bg-white/90 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Studies</CardTitle>
                  <CardDescription>Assign studies to yourself and start reporting</CardDescription>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                </motion.div>
              </div>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Patient name or Study ID"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modality">Modality</Label>
                      <Select value={modalityFilter} onValueChange={setModalityFilter}>
                        <SelectTrigger id="modality">
                          <SelectValue placeholder="All modalities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modalities</SelectItem>
                          <SelectItem value="xray">X-Ray</SelectItem>
                          <SelectItem value="ct">CT Scan</SelectItem>
                          <SelectItem value="mri">MRI</SelectItem>
                          <SelectItem value="ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="pet">PET Scan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="uploaded">Uploaded</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="report_generated">Report Generated</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleSearch}
                        className="bg-gradient-modern hover:opacity-90"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                        Apply Filters
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleReset}
                        variant="outline"
                      >
                        Reset
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </CardHeader>
            <CardContent>
              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {studies.length === 0 ? (
                  <p className="text-muted-foreground">No studies available</p>
                ) : (
                  studies.map((study: any) => (
                    <motion.div
                      key={study.id}
                      variants={fadeInUp}
                      className="flex items-center justify-between border-b pb-4 hover:bg-gray-50/50 rounded-lg p-3 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{study.study_id}</p>
                          {study.is_urgent && (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Badge variant="destructive" className="animate-pulse-slow">
                                Urgent
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {study.patient_name} - {study.modality}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(study.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge className={getStatusColor(study.status)}>
                            {study.status.replace('_', ' ')}
                          </Badge>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            size="sm"
                            onClick={() => navigate(`/viewer/${study.id}`)}
                            className="bg-gradient-modern hover:opacity-90 transition-opacity"
                          >
                            <PhotoIcon className="h-4 w-4 mr-2" />
                            View Study
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};
