import { writable } from "svelte/store";

export enum DoneFilterType {
	All = "all",
	Today = "today",
	Yesterday = "yesterday",
	ThisWeek = "this-week",
	LastWeek = "last-week",
	ThisMonth = "this-month",
	LastMonth = "last-month",
}

export const doneFilterStore = writable<DoneFilterType>(DoneFilterType.Today);

/**
 * Get the label for a filter type in Russian
 */
export function getFilterLabel(filter: DoneFilterType): string {
	switch (filter) {
		case DoneFilterType.All:
			return "Все";
		case DoneFilterType.Today:
			return "Сделанные сегодня";
		case DoneFilterType.Yesterday:
			return "Сделанные вчера";
		case DoneFilterType.ThisWeek:
			return "Сделанные за эту неделю";
		case DoneFilterType.LastWeek:
			return "Сделанные за прошлую неделю";
		case DoneFilterType.ThisMonth:
			return "Сделанные за этот месяц";
		case DoneFilterType.LastMonth:
			return "Сделанные за прошлый месяц";
	}
}

/**
 * Get start of day (00:00:00) for a given date
 */
function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get end of day (23:59:59.999) for a given date
 */
function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Get the start of the week (Monday)
 */
function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the end of the week (Sunday)
 */
function endOfWeek(date: Date): Date {
	const d = startOfWeek(date);
	d.setDate(d.getDate() + 6);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Get the start of the month
 */
function startOfMonth(date: Date): Date {
	const d = new Date(date);
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the end of the month
 */
function endOfMonth(date: Date): Date {
	const d = new Date(date);
	d.setMonth(d.getMonth() + 1, 0);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Parse a date string in YYYY-MM-DD format to Date object
 */
function parseDate(dateStr: string): Date | null {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;
	
	const [, year, month, day] = match;
	if (!year || !month || !day) return null;
	
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Check if a task's done date matches the given filter
 */
export function matchesFilter(doneDate: string | undefined, filter: DoneFilterType): boolean {
	if (!doneDate) return filter === DoneFilterType.All;
	
	const taskDate = parseDate(doneDate);
	if (!taskDate) return false;
	
	const now = new Date();
	const today = startOfDay(now);
	
	switch (filter) {
		case DoneFilterType.All:
			return true;
			
		case DoneFilterType.Today: {
			const todayEnd = endOfDay(now);
			return taskDate >= today && taskDate <= todayEnd;
		}
		
		case DoneFilterType.Yesterday: {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayEnd = endOfDay(yesterday);
			return taskDate >= yesterday && taskDate <= yesterdayEnd;
		}
		
		case DoneFilterType.ThisWeek: {
			const weekStart = startOfWeek(now);
			const weekEnd = endOfWeek(now);
			return taskDate >= weekStart && taskDate <= weekEnd;
		}
		
		case DoneFilterType.LastWeek: {
			const lastWeekStart = startOfWeek(now);
			lastWeekStart.setDate(lastWeekStart.getDate() - 7);
			const lastWeekEnd = endOfWeek(lastWeekStart);
			return taskDate >= lastWeekStart && taskDate <= lastWeekEnd;
		}
		
		case DoneFilterType.ThisMonth: {
			const monthStart = startOfMonth(now);
			const monthEnd = endOfMonth(now);
			return taskDate >= monthStart && taskDate <= monthEnd;
		}
		
		case DoneFilterType.LastMonth: {
			const lastMonth = new Date(now);
			lastMonth.setMonth(lastMonth.getMonth() - 1);
			const lastMonthStart = startOfMonth(lastMonth);
			const lastMonthEnd = endOfMonth(lastMonth);
			return taskDate >= lastMonthStart && taskDate <= lastMonthEnd;
		}
		
		default:
			return false;
	}
}

