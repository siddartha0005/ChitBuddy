import { ChitWarningType, getWarningMessage } from '@/lib/chit-calculations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChitWarningAlertProps {
  warningType: ChitWarningType;
}

export function ChitWarningAlert({ warningType }: ChitWarningAlertProps) {
  const { title, description, variant } = getWarningMessage(warningType);

  const Icon = warningType === 'early-takers-benefit'
    ? TrendingDown
    : warningType === 'rosca-mode'
    ? Info
    : AlertTriangle;

  return (
    <Alert
      className={cn(
        'border-2',
        variant === 'destructive' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
        variant === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
        variant === 'default' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5',
          variant === 'destructive' && 'text-red-600',
          variant === 'warning' && 'text-yellow-600',
          variant === 'default' && 'text-blue-600'
        )}
      />
      <AlertTitle
        className={cn(
          variant === 'destructive' && 'text-red-800 dark:text-red-200',
          variant === 'warning' && 'text-yellow-800 dark:text-yellow-200',
          variant === 'default' && 'text-blue-800 dark:text-blue-200'
        )}
      >
        {title}
      </AlertTitle>
      <AlertDescription
        className={cn(
          variant === 'destructive' && 'text-red-700 dark:text-red-300',
          variant === 'warning' && 'text-yellow-700 dark:text-yellow-300',
          variant === 'default' && 'text-blue-700 dark:text-blue-300'
        )}
      >
        {description}
      </AlertDescription>
    </Alert>
  );
}
