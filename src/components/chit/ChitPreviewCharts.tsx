import { ChitScheduleRow, formatCurrency } from '@/lib/chit-calculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChitPreviewChartsProps {
  schedule: ChitScheduleRow[];
}

export function ChitPreviewCharts({ schedule }: ChitPreviewChartsProps) {
  if (schedule.length === 0) {
    return null;
  }

  const chartData = schedule.map((row) => ({
    month: `M${row.month}`,
    amountReceived: row.amountReceived,
    totalPaid: row.totalPaid,
    netProfitLoss: row.netProfitLoss,
  }));

  return (
    <Tabs defaultValue="payout" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="payout">Payout Graph</TabsTrigger>
        <TabsTrigger value="profitloss">Profit/Loss Graph</TabsTrigger>
      </TabsList>

      <TabsContent value="payout">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payout vs Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Month ${label.replace('M', '')}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amountReceived"
                    name="Amount Received"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalPaid"
                    name="Total Paid"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profitloss">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net Profit/Loss vs Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Net']}
                    labelFormatter={(label) => `Month ${label.replace('M', '')}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="netProfitLoss"
                    name="Net Profit/Loss"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color = payload.netProfitLoss >= 0 ? '#16a34a' : '#dc2626';
                      return (
                        <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
