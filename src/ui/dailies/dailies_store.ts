import { writable } from "svelte/store";
import { addPoints } from "../points/points_store";

export interface Daily {
	id: string;
	name: string;
	description?: string;
	reward: number; // баллы за выполнение
	emoji?: string;
	completedToday: boolean;
	lastCompletedDate: string | null; // YYYY-MM-DD
	streak: number; // сколько дней подряд выполнен
	totalCompletions: number;
	createdAt: string;
}

const STORAGE_KEY = "task-kanban-dailies";

export const dailiesStore = writable<Daily[]>([]);

function getTodayString(): string {
	const today = new Date();
	const dateStr = today.toISOString().split("T")[0];
	return dateStr || "";
}

function getYesterdayString(): string {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const dateStr = yesterday.toISOString().split("T")[0];
	return dateStr || "";
}

function checkAndResetDailies(dailies: Daily[]): Daily[] {
	const today = getTodayString();
	const yesterday = getYesterdayString();
	
	return dailies.map(daily => {
		// Если задание было выполнено, но не сегодня
		if (daily.completedToday && daily.lastCompletedDate !== today) {
			// Если последнее выполнение было не вчера, сбрасываем streak
			if (daily.lastCompletedDate !== yesterday) {
				return {
					...daily,
					completedToday: false,
					streak: 0
				};
			}
			// Если было выполнено вчера, просто сбрасываем статус, streak сохраняем
			return {
				...daily,
				completedToday: false
			};
		}
		return daily;
	});
}

export function loadDailies(): void {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			const dailies = JSON.parse(stored) as Daily[];
			const updatedDailies = checkAndResetDailies(dailies);
			dailiesStore.set(updatedDailies);
			saveDailies(updatedDailies);
		} catch (e) {
			console.error("Failed to load dailies from localStorage", e);
			dailiesStore.set([]);
		}
	}
}

export function checkDailiesDate(): void {
	dailiesStore.update(dailies => {
		const updated = checkAndResetDailies(dailies);
		if (JSON.stringify(updated) !== JSON.stringify(dailies)) {
			saveDailies(updated);
		}
		return updated;
	});
}

function saveDailies(dailies: Daily[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(dailies));
}

export function addDaily(
	name: string,
	reward: number,
	description?: string,
	emoji?: string
): void {
	dailiesStore.update(dailies => {
		const newDaily: Daily = {
			id: crypto.randomUUID(),
			name,
			description,
			reward,
			emoji,
			completedToday: false,
			lastCompletedDate: null,
			streak: 0,
			totalCompletions: 0,
			createdAt: new Date().toISOString()
		};
		const updated = [...dailies, newDaily];
		saveDailies(updated);
		return updated;
	});
}

export function updateDaily(
	id: string,
	updates: Partial<Omit<Daily, "id" | "createdAt" | "completedToday" | "lastCompletedDate" | "streak" | "totalCompletions">>
): void {
	dailiesStore.update(dailies => {
		const updated = dailies.map(daily =>
			daily.id === id ? { ...daily, ...updates } : daily
		);
		saveDailies(updated);
		return updated;
	});
}

export function removeDaily(id: string): void {
	dailiesStore.update(dailies => {
		const updated = dailies.filter(daily => daily.id !== id);
		saveDailies(updated);
		return updated;
	});
}

export function completeDaily(id: string): void {
	const today = getTodayString();
	const yesterday = getYesterdayString();
	
	dailiesStore.update(dailies => {
		const updated = dailies.map(daily => {
			if (daily.id === id && !daily.completedToday) {
				// Начисляем баллы
				addPoints(daily.reward);
				
				// Обновляем streak
				let newStreak = daily.streak;
				if (daily.lastCompletedDate === yesterday) {
					// Продолжаем серию
					newStreak = daily.streak + 1;
				} else {
					// Начинаем новую серию
					newStreak = 1;
				}
				
				return {
					...daily,
					completedToday: true,
					lastCompletedDate: today,
					streak: newStreak,
					totalCompletions: daily.totalCompletions + 1
				};
			}
			return daily;
		});
		saveDailies(updated);
		return updated;
	});
}

export function uncompleteDaily(id: string): void {
	dailiesStore.update(dailies => {
		const updated = dailies.map(daily => {
			if (daily.id === id && daily.completedToday) {
				// Возвращаем баллы
				addPoints(-daily.reward);
				
				return {
					...daily,
					completedToday: false,
					lastCompletedDate: null,
					streak: Math.max(0, daily.streak - 1),
					totalCompletions: Math.max(0, daily.totalCompletions - 1)
				};
			}
			return daily;
		});
		saveDailies(updated);
		return updated;
	});
}

