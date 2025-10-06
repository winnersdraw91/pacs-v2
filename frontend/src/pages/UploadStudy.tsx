import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { studiesAPI } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Upload, ArrowLeft } from 'lucide-react';

export const UploadStudy: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    modality: '',
    study_type: '',
    study_description: '',
    is_urgent: false,
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);

    try {
      const studyData = {
        ...formData,
        patient_age: parseInt(formData.patient_age) || null,
      };

      const studyResponse = await studiesAPI.create(studyData);
      const study = studyResponse.data;

      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        await studiesAPI.upload(study.id, fileArray);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload study');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Upload Study</h2>
            <p className="text-muted-foreground">Upload DICOM files and patient information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Study Information</CardTitle>
            <CardDescription>Enter patient details and upload DICOM files</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient Name *</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_age">Age</Label>
                  <Input
                    id="patient_age"
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_gender">Gender</Label>
                  <Select
                    value={formData.patient_gender}
                    onValueChange={(value) => setFormData({ ...formData, patient_gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modality">Modality *</Label>
                  <Select
                    value={formData.modality}
                    onValueChange={(value) => setFormData({ ...formData, modality: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select modality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xray">X-Ray</SelectItem>
                      <SelectItem value="ct">CT</SelectItem>
                      <SelectItem value="mri">MRI</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="pet">PET</SelectItem>
                      <SelectItem value="mammography">Mammography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="study_type">Study Type</Label>
                <Input
                  id="study_type"
                  value={formData.study_type}
                  onChange={(e) => setFormData({ ...formData, study_type: e.target.value })}
                  placeholder="e.g., Chest X-Ray, Brain MRI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="study_description">Description</Label>
                <Input
                  id="study_description"
                  value={formData.study_description}
                  onChange={(e) => setFormData({ ...formData, study_description: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="files">DICOM Files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".dcm"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <p className="text-sm text-muted-foreground">
                  Select one or more DICOM files (.dcm)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_urgent: checked as boolean })
                  }
                />
                <Label htmlFor="is_urgent" className="text-sm font-normal">
                  Mark as urgent
                </Label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={isUploading} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Study'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
