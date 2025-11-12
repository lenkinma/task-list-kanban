import { describe, expect, it } from "vitest";
import { DoneFilterType, matchesFilter, getFilterLabel } from "../done_filter_store";

describe("Done Filter Store", () => {
	describe("getFilterLabel", () => {
		it("returns correct Russian labels for all filter types", () => {
			expect(getFilterLabel(DoneFilterType.All)).toBe("Все");
			expect(getFilterLabel(DoneFilterType.Today)).toBe("Сделанные сегодня");
			expect(getFilterLabel(DoneFilterType.Yesterday)).toBe("Сделанные вчера");
			expect(getFilterLabel(DoneFilterType.ThisWeek)).toBe("Сделанные за эту неделю");
			expect(getFilterLabel(DoneFilterType.LastWeek)).toBe("Сделанные за прошлую неделю");
			expect(getFilterLabel(DoneFilterType.ThisMonth)).toBe("Сделанные за этот месяц");
			expect(getFilterLabel(DoneFilterType.LastMonth)).toBe("Сделанные за прошлый месяц");
		});
	});

	describe("matchesFilter", () => {
		// Helper to get date string in YYYY-MM-DD format
		function getDateString(daysOffset: number = 0): string {
			const date = new Date();
			date.setDate(date.getDate() + daysOffset);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}

		describe("All filter", () => {
			it("matches tasks with any date", () => {
				expect(matchesFilter("2025-10-02", DoneFilterType.All)).toBe(true);
				expect(matchesFilter("2024-01-01", DoneFilterType.All)).toBe(true);
				expect(matchesFilter(getDateString(0), DoneFilterType.All)).toBe(true);
			});

			it("matches tasks without date", () => {
				expect(matchesFilter(undefined, DoneFilterType.All)).toBe(true);
			});
		});

		describe("Today filter", () => {
			it("matches task done today", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.Today)).toBe(true);
			});

			it("does not match task done yesterday", () => {
				const yesterday = getDateString(-1);
				expect(matchesFilter(yesterday, DoneFilterType.Today)).toBe(false);
			});

			it("does not match task done tomorrow", () => {
				const tomorrow = getDateString(1);
				expect(matchesFilter(tomorrow, DoneFilterType.Today)).toBe(false);
			});

			it("does not match task without date", () => {
				expect(matchesFilter(undefined, DoneFilterType.Today)).toBe(false);
			});
		});

		describe("Yesterday filter", () => {
			it("matches task done yesterday", () => {
				const yesterday = getDateString(-1);
				expect(matchesFilter(yesterday, DoneFilterType.Yesterday)).toBe(true);
			});

			it("does not match task done today", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.Yesterday)).toBe(false);
			});

			it("does not match task done two days ago", () => {
				const twoDaysAgo = getDateString(-2);
				expect(matchesFilter(twoDaysAgo, DoneFilterType.Yesterday)).toBe(false);
			});
		});

		describe("This Week filter", () => {
			it("matches task done today", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.ThisWeek)).toBe(true);
			});

			it("matches task done earlier this week", () => {
				// This test assumes the task was done on the same week
				// In a real scenario, you'd need to calculate actual week boundaries
				const now = new Date();
				const dayOfWeek = now.getDay();
				const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
				
				if (daysFromMonday > 0) {
					const earlierThisWeek = getDateString(-daysFromMonday);
					expect(matchesFilter(earlierThisWeek, DoneFilterType.ThisWeek)).toBe(true);
				}
			});

			it("does not match task done last week", () => {
				const lastWeek = getDateString(-8); // 8 days ago is definitely last week
				expect(matchesFilter(lastWeek, DoneFilterType.ThisWeek)).toBe(false);
			});
		});

		describe("Last Week filter", () => {
			it("does not match task done today", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.LastWeek)).toBe(false);
			});

			it("does not match task done two weeks ago", () => {
				const twoWeeksAgo = getDateString(-15);
				expect(matchesFilter(twoWeeksAgo, DoneFilterType.LastWeek)).toBe(false);
			});
		});

		describe("This Month filter", () => {
			it("matches task done today", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.ThisMonth)).toBe(true);
			});

			it("matches task done at the beginning of this month", () => {
				const now = new Date();
				const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const firstDayStr = `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
				expect(matchesFilter(firstDayStr, DoneFilterType.ThisMonth)).toBe(true);
			});

			it("does not match task done last month", () => {
				const now = new Date();
				const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
				const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-15`;
				expect(matchesFilter(lastMonthStr, DoneFilterType.ThisMonth)).toBe(false);
			});
		});

		describe("Last Month filter", () => {
			it("matches task done last month", () => {
				const now = new Date();
				const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
				const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-15`;
				expect(matchesFilter(lastMonthStr, DoneFilterType.LastMonth)).toBe(true);
			});

			it("does not match task done this month", () => {
				const today = getDateString(0);
				expect(matchesFilter(today, DoneFilterType.LastMonth)).toBe(false);
			});

			it("does not match task done two months ago", () => {
				const now = new Date();
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);
				const twoMonthsAgoStr = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}-15`;
				expect(matchesFilter(twoMonthsAgoStr, DoneFilterType.LastMonth)).toBe(false);
			});
		});

		describe("Invalid dates", () => {
			it("returns false for invalid date strings", () => {
				expect(matchesFilter("invalid-date", DoneFilterType.Today)).toBe(false);
				expect(matchesFilter("2025-13-01", DoneFilterType.Today)).toBe(false);
				expect(matchesFilter("not-a-date", DoneFilterType.All)).toBe(false);
			});

			it("returns false for malformed dates", () => {
				expect(matchesFilter("2025-1-1", DoneFilterType.Today)).toBe(false);
				expect(matchesFilter("25-10-02", DoneFilterType.Today)).toBe(false);
			});
		});
	});
});

