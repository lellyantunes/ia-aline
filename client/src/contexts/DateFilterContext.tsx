import React, { createContext, useContext, useState, useEffect } from 'react';

export type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateFilterContextType {
  preset: DateRangePreset;
  dateRange: DateRange;
  setPreset: (preset: DateRangePreset) => void;
  setCustomDateRange: (range: DateRange) => void;
  resetFilter: () => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  switch (preset) {
    case 'today':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
        endDate,
      };
    case 'last7days':
      const start7 = new Date(now);
      start7.setDate(start7.getDate() - 6);
      return {
        startDate: new Date(start7.getFullYear(), start7.getMonth(), start7.getDate(), 0, 0, 0, 0),
        endDate,
      };
    case 'last30days':
      const start30 = new Date(now);
      start30.setDate(start30.getDate() - 29);
      return {
        startDate: new Date(start30.getFullYear(), start30.getMonth(), start30.getDate(), 0, 0, 0, 0),
        endDate,
      };
    case 'custom':
      // Para custom, retornar últimos 30 dias como padrão
      const startCustom = new Date(now);
      startCustom.setDate(startCustom.getDate() - 29);
      return {
        startDate: new Date(startCustom.getFullYear(), startCustom.getMonth(), startCustom.getDate(), 0, 0, 0, 0),
        endDate,
      };
  }
}

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  // Tentar carregar do localStorage
  const [preset, setPresetState] = useState<DateRangePreset>(() => {
    const saved = localStorage.getItem('dateFilterPreset');
    return (saved as DateRangePreset) || 'last30days';
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const savedRange = localStorage.getItem('dateFilterRange');
    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        return {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
        };
      } catch {
        return getDateRangeForPreset('last30days');
      }
    }
    return getDateRangeForPreset('last30days');
  });

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('dateFilterPreset', preset);
    localStorage.setItem('dateFilterRange', JSON.stringify({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    }));
  }, [preset, dateRange]);

  const setPreset = (newPreset: DateRangePreset) => {
    setPresetState(newPreset);
    if (newPreset !== 'custom') {
      setDateRange(getDateRangeForPreset(newPreset));
    }
  };

  const setCustomDateRange = (range: DateRange) => {
    setPresetState('custom');
    setDateRange(range);
  };

  const resetFilter = () => {
    setPresetState('last30days');
    setDateRange(getDateRangeForPreset('last30days'));
  };

  return (
    <DateFilterContext.Provider
      value={{
        preset,
        dateRange,
        setPreset,
        setCustomDateRange,
        resetFilter,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within DateFilterProvider');
  }
  return context;
}
