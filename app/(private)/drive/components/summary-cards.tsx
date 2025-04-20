import { FileText, Video, File, ImageIcon } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CountAnimation from "@/components/ui/custom/count-animation";
import { Progress } from "@/components/ui/progress";

interface DataType {
  type: string;
  icon: React.ReactNode;
  count: number;
  size: string;
  color: string;
  indicatorColor: string;
  usagePercentage: number;
}

const data: DataType[] = [
  {
    type: "Documents",
    icon: <FileText className="size-6" />,
    count: 1390,
    size: "2.1 GB",
    color: "text-blue-500",
    indicatorColor: "bg-blue-500",
    usagePercentage: 35
  },
  {
    type: "Images",
    icon: <ImageIcon className="size-6" />,
    count: 5678,
    size: "3.8 GB",
    color: "text-green-500",
    indicatorColor: "bg-green-500",
    usagePercentage: 62
  },
  {
    type: "Videos",
    icon: <Video className="size-6" />,
    count: 901,
    size: "7.5 GB",
    color: "text-red-500",
    indicatorColor: "bg-red-500",
    usagePercentage: 89
  },
  {
    type: "Others",
    icon: <File className="size-6" />,
    count: 234,
    size: "1.2 GB",
    color: "text-yellow-500",
    indicatorColor: "bg-yellow-500",
    usagePercentage: 28
  }
];

export function SummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((item, key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{item.type}</CardTitle>
            <CardAction>
              <span className={item.color}>{item.icon}</span>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-semibold lg:text-3xl">
              <CountAnimation number={item.count} />
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">{item.size} used</div>
              <Progress value={item.usagePercentage} indicatorColor={item.indicatorColor} />
              <div className="text-muted-foreground text-sm">
                {item.usagePercentage}% of storage used
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
