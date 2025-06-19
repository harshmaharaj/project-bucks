
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFormProps {
  onProjectCreated: (project: any) => void;
}

const ProjectForm = ({ onProjectCreated }: ProjectFormProps) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState<number>(50);
  const [newProjectCurrency, setNewProjectCurrency] = useState<string>('USD');
  const [newProjectWeeklyHours, setNewProjectWeeklyHours] = useState<number>(40);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    if (newProjectRate <= 0 || newProjectWeeklyHours <= 0) {
      toast({
        title: "Error", 
        description: "Hourly rate and weekly hours must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProjectName.trim(),
          hourly_rate: newProjectRate,
          rate_currency: newProjectCurrency,
          committed_weekly_hours: newProjectWeeklyHours,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newProject = {
        ...data,
        sessions: [],
        user_email: user?.email || 'Unknown'
      };

      onProjectCreated(newProject);

      setNewProjectName('');
      setNewProjectRate(50);
      setNewProjectCurrency('USD');
      setNewProjectWeeklyHours(40);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Project "${data.name}" created successfully!`
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mb-6 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="w-6 h-6 mr-2" />
          Add New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="w-11/12 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={newProjectRate}
                onChange={(e) => setNewProjectRate(Number(e.target.value))}
                placeholder="50"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={newProjectCurrency} onValueChange={setNewProjectCurrency}>
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
            <Label htmlFor="weeklyHours">Committed Weekly Hours</Label>
            <Input
              id="weeklyHours"
              type="number"
              value={newProjectWeeklyHours}
              onChange={(e) => setNewProjectWeeklyHours(Number(e.target.value))}
              placeholder="40"
              className="mt-1"
            />
          </div>
          <Button onClick={createProject} className="w-full">
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
