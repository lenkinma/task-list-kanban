import { writable, get } from "svelte/store";

/**
 * Store for tracking user's total points balance from completed tasks
 */
export const pointsBalanceStore = writable<number>(0);

/**
 * Load points balance from localStorage
 */
export function loadPointsBalance(): number {
	try {
		const stored = localStorage.getItem('task-kanban-points-balance');
		if (stored) {
			const balance = parseInt(stored, 10);
			if (!isNaN(balance)) {
				pointsBalanceStore.set(balance);
				return balance;
			}
		}
	} catch (error) {
		console.error('Failed to load points balance:', error);
	}
	return 0;
}

/**
 * Save points balance to localStorage
 */
export function savePointsBalance(balance: number): void {
	try {
		localStorage.setItem('task-kanban-points-balance', balance.toString());
		pointsBalanceStore.set(balance);
	} catch (error) {
		console.error('Failed to save points balance:', error);
	}
}

/**
 * Add points to the balance
 */
export function addPoints(points: number): void {
	const currentBalance = get(pointsBalanceStore);
	const newBalance = currentBalance + points;
	savePointsBalance(newBalance);
}

/**
 * Subtract points from the balance
 */
export function subtractPoints(points: number): void {
	const currentBalance = get(pointsBalanceStore);
	const newBalance = Math.max(0, currentBalance - points); // Don't go below 0
	savePointsBalance(newBalance);
}

/**
 * Reset points balance to zero
 */
export function resetPoints(): void {
	savePointsBalance(0);
}

/**
 * Get current points balance
 */
export function getCurrentBalance(): number {
	return get(pointsBalanceStore);
}

