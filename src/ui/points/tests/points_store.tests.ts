import { describe, expect, it, beforeEach } from "vitest";
import { 
	pointsBalanceStore, 
	loadPointsBalance, 
	savePointsBalance, 
	addPoints, 
	subtractPoints, 
	resetPoints, 
	getCurrentBalance 
} from "../points_store";
import { get } from "svelte/store";

describe("Points Store", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		pointsBalanceStore.set(0);
	});

	describe("savePointsBalance and loadPointsBalance", () => {
		it("saves and loads points balance", () => {
			savePointsBalance(100);
			const loaded = loadPointsBalance();
			expect(loaded).toBe(100);
		});

		it("returns 0 when no balance is saved", () => {
			const loaded = loadPointsBalance();
			expect(loaded).toBe(0);
		});

		it("updates the store when saving", () => {
			savePointsBalance(50);
			expect(get(pointsBalanceStore)).toBe(50);
		});
	});

	describe("addPoints", () => {
		it("adds points to current balance", () => {
			savePointsBalance(10);
			addPoints(5);
			expect(getCurrentBalance()).toBe(15);
		});

		it("adds points starting from zero", () => {
			addPoints(25);
			expect(getCurrentBalance()).toBe(25);
		});

		it("handles multiple additions", () => {
			addPoints(10);
			addPoints(20);
			addPoints(5);
			expect(getCurrentBalance()).toBe(35);
		});
	});

	describe("subtractPoints", () => {
		it("subtracts points from current balance", () => {
			savePointsBalance(50);
			subtractPoints(20);
			expect(getCurrentBalance()).toBe(30);
		});

		it("does not go below zero", () => {
			savePointsBalance(10);
			subtractPoints(20);
			expect(getCurrentBalance()).toBe(0);
		});

		it("handles multiple subtractions", () => {
			savePointsBalance(100);
			subtractPoints(10);
			subtractPoints(20);
			subtractPoints(30);
			expect(getCurrentBalance()).toBe(40);
		});
	});

	describe("resetPoints", () => {
		it("resets balance to zero", () => {
			savePointsBalance(100);
			resetPoints();
			expect(getCurrentBalance()).toBe(0);
		});

		it("clears localStorage", () => {
			savePointsBalance(100);
			resetPoints();
			const loaded = loadPointsBalance();
			expect(loaded).toBe(0);
		});
	});

	describe("getCurrentBalance", () => {
		it("returns current balance from store", () => {
			savePointsBalance(75);
			expect(getCurrentBalance()).toBe(75);
		});

		it("returns 0 for uninitialized balance", () => {
			expect(getCurrentBalance()).toBe(0);
		});
	});
});

