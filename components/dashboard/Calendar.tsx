
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import Card from '../ui/Card';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  color: 'red' | 'blue';
  title: string;
  type: 'task' | 'contract';
  id: number;
}

interface CalendarProps {
  events: CalendarEvent[];
  title: string;
  onEventClick?: (event: CalendarEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, title, onEventClick }) => {
  // To match the demo, we start in July 2025.
  const [currentDate, setCurrentDate] = useState(new Date('2025-07-01T00:00:00'));

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoid issues with month-end dates
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  // As per image: S, T, Q, Q, S, S, D for a week starting on Monday
  const dayNames = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = monthNames[month];

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // We want Monday as the first day of the week (index 0)
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; 

  const daysGrid: React.ReactNode[] = [];
  // Add blank cells for days before the 1st of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(<div key={`empty-start-${i}`} className="p-2"></div>);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dayDateStr);
    
    // Prioritize red event for coloring if both event types are on the same day
    const primaryEvent = dayEvents.find(e => e.color === 'red') || dayEvents[0];
    const hasEvent = !!primaryEvent;

    // Based on the image, red is for contracts, light blue for tasks
    const eventColorClass = hasEvent ? (primaryEvent.color === 'red' ? 'bg-red-500 text-white' : 'bg-sky-200 text-sky-800') : '';
    const tooltipText = dayEvents.map(e => e.title).join(' | ');
    const isClickable = hasEvent && onEventClick;

    const DayComponent = isClickable ? 'button' : 'div';

    daysGrid.push(
      <div key={day} className="p-1 flex justify-center items-center">
        <DayComponent
          title={tooltipText}
          onClick={isClickable ? () => onEventClick(primaryEvent) : undefined}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-sm transition-all duration-200",
            hasEvent ? eventColorClass : "text-gray-700",
            isClickable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500' : 'cursor-default',
            !hasEvent && 'hover:bg-gray-100'
          )}
          {...(isClickable && { 'aria-label': `Evento: ${tooltipText}` })}
        >
          {day}
        </DayComponent>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="px-6 pt-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="flex justify-between items-center px-4 py-2 mt-2">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Mês anterior">
          <ChevronLeft size={20} />
        </button>
        <h4 className="font-semibold text-gray-700 capitalize w-32 text-center">{`${monthName} ${year}`}</h4>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Próximo mês">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium px-4 pb-2">
        {dayNames.map((d, i) => <div key={i} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1 px-4 pb-4">
        {daysGrid}
      </div>
    </Card>
  );
};

export default Calendar;
