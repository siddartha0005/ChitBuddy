import { ChitScheduleRow, formatCurrency } from '@/lib/chit-calculations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChitPreviewScheduleProps {
  schedule: ChitScheduleRow[];
}

export function ChitPreviewSchedule({ schedule }: ChitPreviewScheduleProps) {
  if (schedule.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Enter chit details to see the schedule preview
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-[80px]">Month</TableHead>
            <TableHead className="text-right">Amount Received</TableHead>
            <TableHead className="text-right">Total Paid</TableHead>
            <TableHead className="text-right">Net Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium">{row.month}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.amountReceived)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(row.totalPaid)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono font-semibold',
                  row.netProfitLoss > 0
                    ? 'text-green-600 dark:text-green-400'
                    : row.netProfitLoss < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
                )}
              >
                {row.netProfitLoss >= 0 ? '+' : ''}
                {formatCurrency(row.netProfitLoss)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
