import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studiesAPI, reportsAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { FileImage, Clock, CheckCircle } from 'lucide-react';

export const RadiologistDashboard: React.FC = () => {
  const [studies, setStudies] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    inReview: 0,
    completed: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const response = await studiesAPI.list({ limit: 20 });
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

  const handleAssignToMe = async (studyId: number) => {
    try {
      await studiesAPI.assign(studyId, 0);
      fetchStudies();
    } catch (error) {
      console.error('Failed to assign study:', error);
    }
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Radiologist Dashboard</h2>
          <p className="text-muted-foreground">
            Review studies and generate verified reports
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Studies</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inReview}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Studies</CardTitle>
            <CardDescription>Assign studies to yourself and start reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studies.length === 0 ? (
                <p className="text-muted-foreground">No studies available</p>
              ) : (
                studies.map((study: any) => (
                  <div key={study.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{study.study_id}</p>
                        {study.is_urgent && (
                          <Badge variant="destructive">Urgent</Badge>
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
                      <Badge className={getStatusColor(study.status)}>
                        {study.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/viewer/${study.id}`)}
                      >
                        View Study
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
