'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface DiseaseThreshold {
  disease_id: string;
  disease_name: string;
  outbreak_threshold: number;
  warning_threshold: number;
  monitoring_enabled: boolean;
  alert_recipients: string[];
  alert_cooldown_hours: number;
}

export default function DiseaseThresholdsPage() {
  const [diseases, setDiseases] = useState<DiseaseThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      const response = await fetch('/api/admin/diseases/thresholds');
      const data = await response.json();
      setDiseases(data);
    } catch (error) {
      console.error('Failed to fetch diseases:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateThreshold = async (diseaseId: string, updates: Partial<DiseaseThreshold>) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/diseases/${diseaseId}/thresholds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchDiseases();
    } catch (error) {
      console.error('Failed to update threshold:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Disease Alert Thresholds</h1>
          <p className="text-muted-foreground">
            Configure outbreak detection thresholds for each disease
          </p>
        </div>

        {diseases.map((disease) => (
          <Card key={disease.disease_id}>
            <CardHeader>
              <CardTitle>{disease.disease_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={disease.monitoring_enabled}
                  onCheckedChange={(checked) =>
                    updateThreshold(disease.disease_id, { monitoring_enabled: checked })
                  }
                />
                <Label>Enable Monitoring</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warning Threshold (cases/100k)</Label>
                  <Input
                    type="number"
                    value={disease.warning_threshold}
                    onChange={(e) =>
                      updateThreshold(disease.disease_id, {
                        warning_threshold: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Outbreak Threshold (cases/100k)</Label>
                  <Input
                    type="number"
                    value={disease.outbreak_threshold}
                    onChange={(e) =>
                      updateThreshold(disease.disease_id, {
                        outbreak_threshold: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Alert Cooldown (hours)</Label>
                <Input
                  type="number"
                  value={disease.alert_cooldown_hours}
                  onChange={(e) =>
                    updateThreshold(disease.disease_id, {
                      alert_cooldown_hours: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Alert Recipients (comma-separated emails)</Label>
                <Input
                  value={disease.alert_recipients.join(', ')}
                  onChange={(e) =>
                    updateThreshold(disease.disease_id, {
                      alert_recipients: e.target.value.split(',').map(e => e.trim()),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
  );
}