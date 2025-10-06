import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DicomViewer } from '@/components/DicomViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studiesAPI } from '@/lib/api';
import { ArrowLeft, User, Calendar, Activity } from 'lucide-react';

export const ViewStudy: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudy = async () => {
      if (!studyId) return;

      try {
        setIsLoading(true);
        const studyResponse = await studiesAPI.get(studyId);
        setStudy(studyResponse.data);

        const instancesResponse = await studiesAPI.getInstances(studyId);
        setInstances(instancesResponse.data.instances);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load study');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudy();
  }, [studyId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div>Loading study...</div>
        </div>
      </Layout>
    );
  }

  if (error || !study) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">{error || 'Study not found'}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge variant={study.is_urgent ? 'destructive' : 'default'}>
            {study.is_urgent ? 'URGENT' : study.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {instances.length > 0 ? (
              <DicomViewer studyId={studyId!} instances={instances} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No DICOM instances available</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Study Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Patient</p>
                    <p className="text-sm text-muted-foreground">{study.patient_name}</p>
                    {study.patient_age && (
                      <p className="text-xs text-muted-foreground">Age: {study.patient_age}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Modality</p>
                    <p className="text-sm text-muted-foreground">{study.modality}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Study ID</p>
                    <p className="text-sm text-muted-foreground">{study.study_id}</p>
                  </div>
                </div>

                {study.study_type && (
                  <div>
                    <p className="text-sm font-medium">Study Type</p>
                    <p className="text-sm text-muted-foreground">{study.study_type}</p>
                  </div>
                )}

                {study.study_description && (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{study.study_description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium">Instances</p>
                  <p className="text-sm text-muted-foreground">{instances.length} images</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
