import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChitPreviewSchedule } from '@/components/chit/ChitPreviewSchedule';
import { ChitPreviewCharts } from '@/components/chit/ChitPreviewCharts';
import { ChitWarningAlert } from '@/components/chit/ChitWarningAlert';
import {
  generateChitSchedule,
  getChitWarningType,
  formatCurrency,
} from '@/lib/chit-calculations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const chitSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  chitAmount: z.number().positive('Chit amount must be positive'),
  membersCount: z.number().int().min(2, 'At least 2 members required'),
  basePayment: z.number().positive('Base payment must be positive'),
  postTakePayment: z.number().positive('Post-take payment must be positive'),
  startDate: z.string().optional(),
});

export default function CreateChit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState('');
  const [chitAmount, setChitAmount] = useState('');
  const [membersCount, setMembersCount] = useState('');
  const [basePayment, setBasePayment] = useState('');
  const [postTakePayment, setPostTakePayment] = useState('');
  const [startDate, setStartDate] = useState('');

  // Parsed values
  const parsedValues = useMemo(() => ({
    chitAmount: parseFloat(chitAmount) || 0,
    membersCount: parseInt(membersCount) || 0,
    basePayment: parseFloat(basePayment) || 0,
    postTakePayment: parseFloat(postTakePayment) || 0,
  }), [chitAmount, membersCount, basePayment, postTakePayment]);

  // Auto-calculate base payment suggestion
  const suggestedBasePayment = useMemo(() => {
    if (parsedValues.chitAmount > 0 && parsedValues.membersCount >= 2) {
      return parsedValues.chitAmount / parsedValues.membersCount;
    }
    return 0;
  }, [parsedValues.chitAmount, parsedValues.membersCount]);

  // Generate schedule preview
  const schedule = useMemo(() => {
    if (
      parsedValues.membersCount >= 2 &&
      parsedValues.basePayment > 0 &&
      parsedValues.postTakePayment > 0
    ) {
      return generateChitSchedule(
        parsedValues.membersCount,
        parsedValues.basePayment,
        parsedValues.postTakePayment
      );
    }
    return [];
  }, [parsedValues]);

  // Warning type
  const warningType = useMemo(() => {
    if (parsedValues.basePayment > 0 && parsedValues.postTakePayment > 0) {
      return getChitWarningType(parsedValues.basePayment, parsedValues.postTakePayment);
    }
    return null;
  }, [parsedValues.basePayment, parsedValues.postTakePayment]);

  const validateForm = (): boolean => {
    try {
      chitSchema.parse({
        name,
        chitAmount: parsedValues.chitAmount,
        membersCount: parsedValues.membersCount,
        basePayment: parsedValues.basePayment,
        postTakePayment: parsedValues.postTakePayment,
        startDate: startDate || undefined,
      });
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    const { data, error } = await supabase
      .from('chits')
      .insert({
        name,
        chit_amount: parsedValues.chitAmount,
        members_count: parsedValues.membersCount,
        months: parsedValues.membersCount, // Default months = members
        base_monthly_payment: parsedValues.basePayment,
        post_take_monthly_payment: parsedValues.postTakePayment,
        foreman_id: user.id,
        start_date: startDate || null,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create chit',
        description: error.message,
      });
    } else {
      toast({
        title: 'Chit created successfully!',
        description: `"${name}" has been created with ${parsedValues.membersCount} members.`,
      });
      navigate('/');
    }
  };

  const applySuggestedPayment = () => {
    if (suggestedBasePayment > 0) {
      setBasePayment(suggestedBasePayment.toString());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Create Chit Group</span>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chit Details</CardTitle>
                <CardDescription>Enter the basic information for your chit fund</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Chit Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Savings Group"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chitAmount">Chit Amount (₹)</Label>
                  <Input
                    id="chitAmount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={chitAmount}
                    onChange={(e) => setChitAmount(e.target.value)}
                  />
                  {errors.chitAmount && (
                    <p className="text-sm text-destructive">{errors.chitAmount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membersCount">Number of Members</Label>
                  <Input
                    id="membersCount"
                    type="number"
                    min="2"
                    placeholder="e.g., 10"
                    value={membersCount}
                    onChange={(e) => setMembersCount(e.target.value)}
                  />
                  {errors.membersCount && (
                    <p className="text-sm text-destructive">{errors.membersCount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
                <CardDescription>
                  Set the monthly payment amounts for members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="basePayment">Base Monthly Payment (B)</Label>
                    {suggestedBasePayment > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={applySuggestedPayment}
                      >
                        Suggested: {formatCurrency(suggestedBasePayment)}
                      </Button>
                    )}
                  </div>
                  <Input
                    id="basePayment"
                    type="number"
                    placeholder="Amount paid before taking chit"
                    value={basePayment}
                    onChange={(e) => setBasePayment(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount each member pays monthly before they take the chit
                  </p>
                  {errors.basePayment && (
                    <p className="text-sm text-destructive">{errors.basePayment}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postTakePayment">Post-Take Monthly Payment (A)</Label>
                  <Input
                    id="postTakePayment"
                    type="number"
                    placeholder="Amount paid after taking chit"
                    value={postTakePayment}
                    onChange={(e) => setPostTakePayment(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount each member pays monthly after they've taken the chit
                  </p>
                  {errors.postTakePayment && (
                    <p className="text-sm text-destructive">{errors.postTakePayment}</p>
                  )}
                </div>

                {/* Warning Alert */}
                {warningType && <ChitWarningAlert warningType={warningType} />}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePreview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Preview & Create Chit'
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Preview</CardTitle>
                <CardDescription>
                  Projected payouts and payments for each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChitPreviewSchedule schedule={schedule} />
              </CardContent>
            </Card>

            <ChitPreviewCharts schedule={schedule} />
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Confirm Chit Creation
            </DialogTitle>
            <DialogDescription>
              Please review the chit details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Chit Name</p>
                <p className="font-medium">{name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chit Amount</p>
                <p className="font-medium">{formatCurrency(parsedValues.chitAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Members</p>
                <p className="font-medium">{parsedValues.membersCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{parsedValues.membersCount} months</p>
              </div>
              <div>
                <p className="text-muted-foreground">Base Payment (B)</p>
                <p className="font-medium">{formatCurrency(parsedValues.basePayment)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Post-Take Payment (A)</p>
                <p className="font-medium">{formatCurrency(parsedValues.postTakePayment)}</p>
              </div>
            </div>

            {warningType && <ChitWarningAlert warningType={warningType} />}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Confirm & Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
