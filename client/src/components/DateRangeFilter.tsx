import { useDateFilter, type DateRangePreset } from "@/contexts/DateFilterContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const presetLabels: Record<DateRangePreset, string> = {
  today: "Hoje",
  last7days: "Últimos 7 dias",
  last30days: "Últimos 30 dias",
  custom: "Personalizado",
};

export function DateRangeFilter() {
  const { preset, dateRange, setPreset, setCustomDateRange } = useDateFilter();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(dateRange.startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(dateRange.endDate);

  const handlePresetClick = (newPreset: DateRangePreset) => {
    if (newPreset !== 'custom') {
      setPreset(newPreset);
      setIsOpen(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomDateRange({
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (preset === 'custom') {
      return `${format(dateRange.startDate, "dd/MM/yy", { locale: ptBR })} - ${format(dateRange.endDate, "dd/MM/yy", { locale: ptBR })}`;
    }
    return presetLabels[preset];
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            !preset && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-2 border-b">
          <div className="text-sm font-medium mb-2">Período</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={preset === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('today')}
              className="w-full"
            >
              Hoje
            </Button>
            <Button
              variant={preset === 'last7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('last7days')}
              className="w-full"
            >
              Últimos 7 dias
            </Button>
            <Button
              variant={preset === 'last30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('last30days')}
              className="w-full col-span-2"
            >
              Últimos 30 dias
            </Button>
          </div>
        </div>
        
        <div className="p-3 space-y-3">
          <div className="text-sm font-medium">Personalizado</div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground">Data inicial</label>
              <Calendar
                mode="single"
                selected={tempStartDate}
                onSelect={setTempStartDate}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Data final</label>
              <Calendar
                mode="single"
                selected={tempEndDate}
                onSelect={setTempEndDate}
                locale={ptBR}
                disabled={(date) => tempStartDate ? date < tempStartDate : false}
                className="rounded-md border"
              />
            </div>
            <Button
              onClick={handleApplyCustomRange}
              disabled={!tempStartDate || !tempEndDate}
              className="w-full"
              size="sm"
            >
              Aplicar período personalizado
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
