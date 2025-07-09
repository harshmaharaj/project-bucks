import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  hourly_rate: number;
  rate_currency: string;
  committed_weekly_hours: number;
}

interface EditProjectModalProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

const EditProjectModal = ({ project, onProjectUpdated, isOpen, onClose, trigger }: EditProjectModalProps) => {
  const [projectName, setProjectName] = useState(project.name);
  const [projectRate, setProjectRate] = useState(project.hourly_rate);
  const [projectCurrency, setProjectCurrency] = useState(project.rate_currency);
  const [projectWeeklyHours, setProjectWeeklyHours] = useState(project.committed_weekly_hours);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const isDialogOpen = isOpen ?? false;
  const handleClose = onClose ?? (() => {});

  // Reset form when project changes or dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setProjectName(project.name);
      setProjectRate(project.hourly_rate);
      setProjectCurrency(project.rate_currency);
      setProjectWeeklyHours(project.committed_weekly_hours);
    }
  }, [project, isDialogOpen]);

  const updateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    if (projectRate <= 0 || projectWeeklyHours <= 0) {
      toast({
        title: "Error", 
        description: "Hourly rate and weekly hours must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: projectName.trim(),
          hourly_rate: projectRate,
          rate_currency: projectCurrency,
          committed_weekly_hours: projectWeeklyHours,
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;

      onProjectUpdated(data);
      handleClose();
      
      toast({
        title: "Success",
        description: `Project "${data.name}" updated successfully!`
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="w-11/12 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="editProjectName">Project Name</Label>
            <Input
              id="editProjectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editHourlyRate">Hourly Rate</Label>
              <Input
                id="editHourlyRate"
                type="number"
                value={projectRate}
                onChange={(e) => setProjectRate(Number(e.target.value))}
                placeholder="50"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editCurrency">Currency</Label>
              <Select value={projectCurrency} onValueChange={setProjectCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="editWeeklyHours">Committed Weekly Hours</Label>
            <Input
              id="editWeeklyHours"
              type="number"
              value={projectWeeklyHours}
              onChange={(e) => setProjectWeeklyHours(Number(e.target.value))}
              placeholder="40"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateProject} 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;