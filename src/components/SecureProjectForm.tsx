
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sanitizeAndValidateText } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormData {
  name: string;
  hourlyRate: number;
  currency: string;
  weeklyHours: number;
}

interface SecureProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const SecureProjectForm = ({ onSubmit, onCancel, loading = false }: SecureProjectFormProps) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    hourlyRate: 0,
    currency: 'USD',
    weeklyHours: 40,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate project name
    try {
      const sanitizedName = sanitizeAndValidateText(formData.name, 100);
      if (!sanitizedName) {
        newErrors.name = 'Project name is required';
      } else if (sanitizedName.length < 2) {
        newErrors.name = 'Project name must be at least 2 characters';
      }
    } catch (error) {
      newErrors.name = 'Project name is too long (max 100 characters)';
    }

    // Validate hourly rate
    if (formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0';
    } else if (formData.hourlyRate > 10000) {
      newErrors.hourlyRate = 'Hourly rate cannot exceed $10,000';
    }

    // Validate weekly hours
    if (formData.weeklyHours <= 0) {
      newErrors.weeklyHours = 'Weekly hours must be greater than 0';
    } else if (formData.weeklyHours > 168) {
      newErrors.weeklyHours = 'Weekly hours cannot exceed 168 (hours in a week)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    try {
      // Sanitize the project name before submission
      const sanitizedData = {
        ...formData,
        name: sanitizeAndValidateText(formData.name, 100),
      };

      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              maxLength={100}
              className={errors.name ? 'border-red-500' : ''}
              disabled={loading}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="hourlyRate">Hourly Rate *</Label>
            <Input
              id="hourlyRate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0.01"
              max="10000"
              step="0.01"
              className={errors.hourlyRate ? 'border-red-500' : ''}
              disabled={loading}
              required
            />
            {errors.hourlyRate && (
              <p className="text-sm text-red-500 mt-1">{errors.hourlyRate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => handleInputChange('currency', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="weeklyHours">Committed Weekly Hours *</Label>
            <Input
              id="weeklyHours"
              type="number"
              value={formData.weeklyHours}
              onChange={(e) => handleInputChange('weeklyHours', parseInt(e.target.value) || 0)}
              placeholder="40"
              min="1"
              max="168"
              className={errors.weeklyHours ? 'border-red-500' : ''}
              disabled={loading}
              required
            />
            {errors.weeklyHours && (
              <p className="text-sm text-red-500 mt-1">{errors.weeklyHours}</p>
            )}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecureProjectForm;
