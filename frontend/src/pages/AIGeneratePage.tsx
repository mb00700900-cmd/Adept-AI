import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumb } from '@/components/Breadcrumb';
import apiClient, { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Loader2, Edit2, Trash2, Plus, Info, ArrowRight, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISuggestion {
  suggestion_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  priority_reasoning?: string;
  effort_estimate: number;
  effort_confidence?: string;
  effort_reasoning?: string;
  is_editable: boolean;
  source: string;
  modified?: boolean;
}

const AIGeneratePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectDescription, setProjectDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!projectDescription.trim()) {
      toast.error('Please enter a project description');
      return;
    }

    setIsGenerating(true);
    try {
      const { data } = await apiClient.post<{ suggestions: AISuggestion[] }>('/ai/task-decompose', {
        projectDescription: projectDescription.trim()
      });

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.map((s: any) => ({
          ...s,
          suggestion_id: s.suggestion_id || `temp-${Date.now()}-${Math.random()}`,
          modified: false,
        })));
        setStep(2);
        toast.success('AI suggestions generated!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(handleApiError(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<AISuggestion>) => {
    setSuggestions(suggestions.map(s => 
      s.suggestion_id === id ? { ...s, ...updates, modified: true } : s
    ));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    setSuggestions(suggestions.filter(s => s.suggestion_id !== id));
    toast.success('Task removed');
  };

  const handleAddManual = () => {
    const newTask: AISuggestion = {
      suggestion_id: `manual-${Date.now()}`,
      title: '',
      description: '',
      priority: 'medium',
      effort_estimate: 4,
      is_editable: true,
      source: 'user',
      modified: false,
    };
    setSuggestions([...suggestions, newTask]);
    setEditingId(newTask.suggestion_id);
  };

  const handleConfirm = async () => {
    const validTasks = suggestions.filter(s => s.title.trim());
    
    if (validTasks.length === 0) {
      toast.error('Please add at least one task');
      return;
    }

    setStep(3);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tasksToCreate = suggestions
        .filter(s => s.title.trim())
        .map(s => ({
          title: s.title.trim(),
          description: s.description.trim() || null,
          priority: s.priority,
          effort_estimate: s.effort_estimate,
          ai_generated: s.source === 'gemini',
          ai_priority_suggestion: s.source === 'gemini' ? s.priority : null,
          ai_effort_suggestion: s.source === 'gemini' ? s.effort_estimate : null,
          created_by: (s.source === 'gemini' ? 'ai' : 'user') as 'ai' | 'user',
        }));

      await apiClient.post(`/projects/${projectId}/tasks/bulk`, { tasks: tasksToCreate });

      toast.success(`✓ ${tasksToCreate.length} tasks created successfully!`);
      navigate(`/project/${projectId}`);
    } catch (error: any) {
      console.error('Task creation error:', error);
      toast.error(handleApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const modifiedCount = suggestions.filter(s => s.modified).length;
  const aiGeneratedCount = suggestions.filter(s => s.source === 'gemini').length;
  const manualCount = suggestions.filter(s => s.source === 'user').length;
  const totalEffort = suggestions.reduce((sum, s) => sum + (s.effort_estimate || 0), 0);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Projects', href: '/' },
            { label: 'AI Task Generation' }
          ]} 
        />

        {/* Step 1: Project Description Input */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Task Generation</h1>
              <p className="text-muted-foreground">
                Describe your project and let AI break it down into actionable tasks
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription>
                  Provide details about your project (50-500 characters recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Example: Build a mobile app for tracking daily habits with reminders, statistics, and social sharing features..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {projectDescription.length} characters
                  </p>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !projectDescription.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      🤖 Gemini is analyzing your project...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate with AI
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => navigate(`/project/${projectId}`)}
                  >
                    Or Create Tasks Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Review & Edit Suggestions */}
        {step === 2 && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  🎯 AI Suggestions
                  <Badge variant="secondary" className="text-sm">You can edit everything!</Badge>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Review and modify the AI-generated tasks below
                </p>
              </div>
              <Button onClick={handleAddManual} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add More Tasks
              </Button>
            </div>

            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <Card key={suggestion.suggestion_id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Task #{index + 1}
                          </span>
                          {suggestion.source === 'gemini' && (
                            <Badge className="bg-accent text-accent-foreground">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                          {suggestion.modified && (
                            <Badge className="bg-user-badge text-user-badge-foreground">
                              <Edit2 className="h-3 w-3 mr-1" />
                              Modified
                            </Badge>
                          )}
                        </div>

                        {editingId === suggestion.suggestion_id ? (
                          <Input
                            value={suggestion.title}
                            onChange={(e) => setSuggestions(suggestions.map(s =>
                              s.suggestion_id === suggestion.suggestion_id 
                                ? { ...s, title: e.target.value, modified: true }
                                : s
                            ))}
                            placeholder="Task title"
                            className="text-lg font-semibold"
                          />
                        ) : (
                          <CardTitle className="text-lg">{suggestion.title || 'Untitled Task'}</CardTitle>
                        )}

                        {editingId === suggestion.suggestion_id ? (
                          <Textarea
                            value={suggestion.description}
                            onChange={(e) => setSuggestions(suggestions.map(s =>
                              s.suggestion_id === suggestion.suggestion_id
                                ? { ...s, description: e.target.value, modified: true }
                                : s
                            ))}
                            placeholder="Task description"
                            rows={3}
                          />
                        ) : (
                          <CardDescription>{suggestion.description}</CardDescription>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {editingId === suggestion.suggestion_id ? (
                          <Button
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Done
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(suggestion.suggestion_id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemove(suggestion.suggestion_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Priority
                          {suggestion.priority_reasoning && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{suggestion.priority_reasoning}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        <Select
                          value={suggestion.priority}
                          onValueChange={(value) => handleUpdate(suggestion.suggestion_id, {
                            priority: value as 'low' | 'medium' | 'high'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Effort Estimate (hours)
                          {suggestion.effort_reasoning && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">
                                    <strong>Confidence:</strong> {suggestion.effort_confidence}
                                    <br />
                                    {suggestion.effort_reasoning}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </Label>
                        <Input
                          type="number"
                          value={suggestion.effort_estimate}
                          onChange={(e) => handleUpdate(suggestion.suggestion_id, {
                            effort_estimate: parseInt(e.target.value) || 0
                          })}
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setSuggestions([]);
                  }}
                >
                  Cancel & Start Over
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  Continue to Review
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation & Save */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-8 w-8 text-[hsl(var(--success))]" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Ready to Create Tasks</h1>
              <p className="text-muted-foreground">
                Review the summary below and confirm
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{suggestions.length}</div>
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <div className="text-2xl font-bold">{aiGeneratedCount}</div>
                    <div className="text-sm text-muted-foreground">AI Generated</div>
                  </div>
                  <div className="text-center p-4 bg-user-badge/10 rounded-lg">
                    <div className="text-2xl font-bold">{manualCount}</div>
                    <div className="text-sm text-muted-foreground">Manual</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold">{totalEffort}h</div>
                    <div className="text-sm text-muted-foreground">Est. Effort</div>
                  </div>
                </div>

                {modifiedCount > 0 && (
                  <div className="p-4 bg-user-badge/10 rounded-lg border border-user-badge/20">
                    <p className="text-sm">
                      <strong>{modifiedCount}</strong> task{modifiedCount !== 1 ? 's' : ''} modified from AI suggestions
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Tasks...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Confirm & Save {suggestions.length} Task{suggestions.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIGeneratePage;
