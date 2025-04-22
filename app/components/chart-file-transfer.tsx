"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "July", desktop: 123, mobile: 95 },
  { month: "August", desktop: 298, mobile: 210 },
  { month: "September", desktop: 175, mobile: 150 },
  { month: "October", desktop: 290, mobile: 180 },
  { month: "November", desktop: 220, mobile: 160 },
  { month: "December", desktop: 310, mobile: 200 }
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

export function ChartFileTransfer() {
  return (
    <Card>
      <CardHeader className="grid-cols-1">
        <CardTitle>Monthly File Transfer</CardTitle>
        <CardDescription>Last 28 days</CardDescription>
        <CardAction className="relative">
          <div className="end-0 top-0 md:absolute">
            <CalendarDateRangePicker />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer className="w-full md:h-[280px]" config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[0, 0, 5, 5]} />
            <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
