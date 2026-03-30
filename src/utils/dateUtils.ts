import { format, differenceInDays, addDays, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { ko } from 'date-fns/locale';

/** "M월 d일 (E)" 형식으로 변환 */
export function formatDisplayDate(dateStr: string): string {
  return format(new Date(dateStr), 'M월 d일 (E)', { locale: ko });
}

/** "yyyy.M.d" 형식으로 변환 */
export function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy.M.d');
}

/** 여행 기간(일수) 계산 */
export function getTripDuration(startDate: string, endDate: string): number {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
}

/** Day N 레이블 생성 */
export function getDayLabel(dayNumber: number): string {
  return `Day ${dayNumber}`;
}

/** 여행 상태 판단 */
export function getTripStatus(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isFuture(start)) return 'upcoming' as const;
  if (isPast(end)) return 'completed' as const;
  return 'ongoing' as const;
}

/** D-Day 문자열 반환 */
export function getDDay(startDate: string): string {
  const diff = differenceInDays(new Date(startDate), new Date());
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** 여행 날짜 배열 생성 (startDate ~ endDate) */
export function generateTripDates(startDate: string, endDate: string): string[] {
  const days = getTripDuration(startDate, endDate);
  return Array.from({ length: days }, (_, i) =>
    format(addDays(new Date(startDate), i), 'yyyy-MM-dd'),
  );
}
