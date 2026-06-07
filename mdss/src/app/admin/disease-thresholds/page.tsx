'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface DiseaseThreshold {
  disease_id: string;
  icd10Code: string | null;
  disease_name: string;
  outbreak_threshold: number;
  warning_threshold: number;
  monitoring_enabled: boolean;
  alert_recipients: string[];
  alert_cooldown_hours: number;
}

const FOCUS_DISEASE_CODES = ['B20', 'B50', 'A15', 'A00'];
const FOCUS_DISEASE_NAMES: Record<string, string> = {
  B20: 'HIV/AIDS',
  B50: 'Malaria',
  A15: 'Tuberculosis',
  A00: 'Cholera',
};

export default function DiseaseThresholdsPage() {
  const [diseases, setDiseases] = useState<DiseaseThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [highlightedDisease, setHighlightedDisease] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      setError('');
      const response = await fetch('/api/admin/diseases/thresholds');
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.error || 'Failed to load disease thresholds');
      }

      setDiseases(
        data
          .filter((disease: DiseaseThreshold) => disease.icd10Code && FOCUS_DISEASE_CODES.includes(disease.icd10Code))
          .sort(
            (a: DiseaseThreshold, b: DiseaseThreshold) =>
              FOCUS_DISEASE_CODES.indexOf(a.icd10Code || '') -
              FOCUS_DISEASE_CODES.indexOf(b.icd10Code || '')
          )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disease thresholds');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalDisease = (diseaseId: string, updates: Partial<DiseaseThreshold>) => {
    setDiseases((current) =>
      current.map((disease) =>
        disease.disease_id === diseaseId ? { ...disease, ...updates } : disease
      )
    );
  };

  const triggerAlertMonitoring = async (diseaseId?: string) => {
    const response = await fetch('/api/alerts/trigger-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diseaseId ? { diseaseId } : {}),
    });
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error || 'Failed to trigger outbreak monitoring');
    }

    return result;
  };

  const updateThreshold = async (diseaseId: string, updates: Partial<DiseaseThreshold>) => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/diseases/${diseaseId}/thresholds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Failed to update threshold');
      }

      const monitoringResult = await triggerAlertMonitoring(diseaseId);
      const diseaseName = diseases.find((disease) => disease.disease_id === diseaseId)?.disease_name || diseaseId;

      setHighlightedDisease(diseaseId);
      setSuccessMessage(
        `${diseaseName} threshold saved. Checked ${monitoringResult.checked} locations, found ${monitoringResult.thresholdBreaches} breach${monitoringResult.thresholdBreaches === 1 ? '' : 'es'}, created ${monitoringResult.alertsCreated} alert${monitoringResult.alertsCreated === 1 ? '' : 's'}.`
      );

      setTimeout(() => {
        setHighlightedDisease(null);
        setSuccessMessage('');
      }, 5000);

      await fetchDiseases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating threshold');
      await fetchDiseases();
    } finally {
      setSaving(false);
    }
  };

  const runAllMonitoring = async () => {
    setMonitoring(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await triggerAlertMonitoring();
      setSuccessMessage(
        `Monitoring completed. Checked ${result.checked} locations, found ${result.thresholdBreaches} breach${result.thresholdBreaches === 1 ? '' : 'es'}, created ${result.alertsCreated} alert${result.alertsCreated === 1 ? '' : 's'}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run monitoring');
    } finally {
      setMonitoring(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading disease thresholds...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Key Disease Alert Thresholds</h1>
          <p className="text-muted-foreground">
            Configure outbreak detection thresholds for HIV, Malaria, TB, and Cholera.
            Monitoring checks national and district case rates and creates dashboard alerts
            when thresholds are exceeded.
          </p>
        </div>
        <Button onClick={runAllMonitoring} disabled={monitoring || saving} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${monitoring ? 'animate-spin' : ''}`} />
          Run Monitoring
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {diseases.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No focused disease thresholds found. Seed HIV, Malaria, TB, and Cholera first.
              </p>
            </CardContent>
          </Card>
        ) : (
          diseases.map((disease) => (
            <Card
              key={disease.disease_id}
              className={`transition-all ${
                highlightedDisease === disease.disease_id ? 'border-green-500 shadow-lg' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>
                      {FOCUS_DISEASE_NAMES[disease.icd10Code || ''] || disease.disease_name}
                    </CardTitle>
                    <Badge variant={disease.monitoring_enabled ? 'default' : 'secondary'}>
                      <Activity className="mr-1 h-3 w-3" />
                      {disease.monitoring_enabled ? 'Monitoring Active' : 'Monitoring Off'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div>
                    <Label className="text-base font-semibold">Active Monitoring</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable outbreak detection for this disease.
                    </p>
                  </div>
                  <Switch
                    checked={disease.monitoring_enabled}
                    onCheckedChange={(checked) => {
                      updateLocalDisease(disease.disease_id, { monitoring_enabled: checked });
                      updateThreshold(disease.disease_id, { monitoring_enabled: checked });
                    }}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">
                    Alert Thresholds (cases per 100,000 population over the last 7 days)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`warning-${disease.disease_id}`} className="text-sm">
                        Warning Threshold
                      </Label>
                      <Input
                        id={`warning-${disease.disease_id}`}
                        type="number"
                        min={0}
                        value={disease.warning_threshold}
                        onChange={(event) =>
                          updateLocalDisease(disease.disease_id, {
                            warning_threshold: parseInt(event.target.value) || 0,
                          })
                        }
                        onBlur={(event) =>
                          updateThreshold(disease.disease_id, {
                            warning_threshold: parseInt(event.target.value) || 0,
                          })
                        }
                        disabled={saving}
                        className="mt-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creates a warning alert when this rate is reached.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`outbreak-${disease.disease_id}`} className="text-sm">
                        Outbreak Threshold
                      </Label>
                      <Input
                        id={`outbreak-${disease.disease_id}`}
                        type="number"
                        min={0}
                        value={disease.outbreak_threshold}
                        onChange={(event) =>
                          updateLocalDisease(disease.disease_id, {
                            outbreak_threshold: parseInt(event.target.value) || 0,
                          })
                        }
                        onBlur={(event) =>
                          updateThreshold(disease.disease_id, {
                            outbreak_threshold: parseInt(event.target.value) || 0,
                          })
                        }
                        disabled={saving}
                        className="mt-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Creates an outbreak alert when this rate is reached.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Alert Configuration</h3>
                  <div>
                    <Label htmlFor={`cooldown-${disease.disease_id}`} className="text-sm">
                      Alert Cooldown Period (hours)
                    </Label>
                    <Input
                      id={`cooldown-${disease.disease_id}`}
                      type="number"
                      min={0}
                      value={disease.alert_cooldown_hours}
                      onChange={(event) =>
                        updateLocalDisease(disease.disease_id, {
                          alert_cooldown_hours: parseInt(event.target.value) || 0,
                        })
                      }
                      onBlur={(event) =>
                        updateThreshold(disease.disease_id, {
                          alert_cooldown_hours: parseInt(event.target.value) || 0,
                        })
                      }
                      disabled={saving}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Minimum time before a repeated alert can be created for the same disease,
                      location, and alert type.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor={`recipients-${disease.disease_id}`} className="text-sm">
                      Alert Recipients
                    </Label>
                    <Input
                      id={`recipients-${disease.disease_id}`}
                      value={disease.alert_recipients.join(', ')}
                      onChange={(event) =>
                        updateLocalDisease(disease.disease_id, {
                          alert_recipients: event.target.value
                            .split(',')
                            .map((recipient) => recipient.trim())
                            .filter(Boolean),
                        })
                      }
                      onBlur={(event) =>
                        updateThreshold(disease.disease_id, {
                          alert_recipients: event.target.value
                            .split(',')
                            .map((recipient) => recipient.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="email1@example.com, email2@example.com"
                      disabled={saving}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recipients are stored with the threshold settings. Dashboard alerts are created immediately.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      When thresholds are exceeded, an active alert appears on the alert page and
                      triage dashboards. Duplicate active alerts are suppressed until acknowledged
                      or the cooldown period passes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
