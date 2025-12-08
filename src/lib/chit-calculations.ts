// Chit fund calculation utilities based on PRD formulas

export interface ChitScheduleRow {
  month: number;
  amountReceived: number;
  totalPaid: number;
  netProfitLoss: number;
  monthlyPaymentBeforeTake: number;
  monthlyPaymentAfterTake: number;
}

/**
 * Calculate amount received when taking chit in month m
 * Formula: amountReceived(m) = (n − 1) * B + (m − 1) * (A − B)
 */
export function calculateAmountReceived(
  month: number,
  membersCount: number,
  basePayment: number,
  postTakePayment: number
): number {
  const n = membersCount;
  const B = basePayment;
  const A = postTakePayment;
  return (n - 1) * B + (month - 1) * (A - B);
}

/**
 * Calculate total paid by member who takes in month p
 * Formula: totalPaid(p) = (p − 1) * B + (n − p) * A
 */
export function calculateTotalPaid(
  takingMonth: number,
  membersCount: number,
  basePayment: number,
  postTakePayment: number
): number {
  const n = membersCount;
  const B = basePayment;
  const A = postTakePayment;
  return (takingMonth - 1) * B + (n - takingMonth) * A;
}

/**
 * Calculate net profit/loss
 * Formula: net = amountReceived − totalPaid
 */
export function calculateNetProfitLoss(
  amountReceived: number,
  totalPaid: number
): number {
  return amountReceived - totalPaid;
}

/**
 * Generate complete chit schedule for all months
 */
export function generateChitSchedule(
  membersCount: number,
  basePayment: number,
  postTakePayment: number
): ChitScheduleRow[] {
  const schedule: ChitScheduleRow[] = [];
  
  for (let month = 1; month <= membersCount; month++) {
    const amountReceived = calculateAmountReceived(month, membersCount, basePayment, postTakePayment);
    const totalPaid = calculateTotalPaid(month, membersCount, basePayment, postTakePayment);
    const netProfitLoss = calculateNetProfitLoss(amountReceived, totalPaid);
    
    schedule.push({
      month,
      amountReceived,
      totalPaid,
      netProfitLoss,
      monthlyPaymentBeforeTake: basePayment,
      monthlyPaymentAfterTake: postTakePayment
    });
  }
  
  return schedule;
}

/**
 * Determine warning type based on A vs B comparison
 */
export type ChitWarningType = 'early-takers-benefit' | 'rosca-mode' | 'standard-chit';

export function getChitWarningType(
  basePayment: number,
  postTakePayment: number
): ChitWarningType {
  if (postTakePayment < basePayment) {
    return 'early-takers-benefit';
  } else if (postTakePayment === basePayment) {
    return 'rosca-mode';
  } else {
    return 'standard-chit';
  }
}

export function getWarningMessage(warningType: ChitWarningType): {
  title: string;
  description: string;
  variant: 'destructive' | 'warning' | 'default';
} {
  switch (warningType) {
    case 'early-takers-benefit':
      return {
        title: 'Early Takers Benefit',
        description: 'A < B: Early takers benefit heavily; later takers lose. Continue?',
        variant: 'destructive'
      };
    case 'rosca-mode':
      return {
        title: 'ROSCA Mode',
        description: 'A = B: All members pay equally. No profit/loss — standard ROSCA mode.',
        variant: 'default'
      };
    case 'standard-chit':
      return {
        title: 'Standard Chit',
        description: 'A > B: Standard chit mode. Early takers lose, late takers gain.',
        variant: 'warning'
      };
  }
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
