import { writable, get } from "svelte/store";

export interface ShopItem {
	id: string;
	name: string;
	price: number;
	description?: string;
	emoji?: string;
	category?: string;
	createdAt: string;
}

export interface Purchase {
	id: string;
	itemId: string;
	itemName: string;
	itemEmoji?: string;
	price: number;
	purchasedAt: string;
}

/**
 * Store for shop items (rewards)
 */
export const shopItemsStore = writable<ShopItem[]>([]);

/**
 * Store for purchase history
 */
export const purchaseHistoryStore = writable<Purchase[]>([]);

/**
 * Load shop items from localStorage
 */
export function loadShopItems(): ShopItem[] {
	try {
		const stored = localStorage.getItem('task-kanban-shop-items');
		if (stored) {
			const items = JSON.parse(stored) as ShopItem[];
			shopItemsStore.set(items);
			return items;
		}
	} catch (error) {
		console.error('Failed to load shop items:', error);
	}
	return [];
}

/**
 * Save shop items to localStorage
 */
export function saveShopItems(items: ShopItem[]): void {
	try {
		localStorage.setItem('task-kanban-shop-items', JSON.stringify(items));
		shopItemsStore.set(items);
	} catch (error) {
		console.error('Failed to save shop items:', error);
	}
}

/**
 * Load purchase history from localStorage
 */
export function loadPurchaseHistory(): Purchase[] {
	try {
		const stored = localStorage.getItem('task-kanban-purchase-history');
		if (stored) {
			const history = JSON.parse(stored) as Purchase[];
			purchaseHistoryStore.set(history);
			return history;
		}
	} catch (error) {
		console.error('Failed to load purchase history:', error);
	}
	return [];
}

/**
 * Save purchase history to localStorage
 */
export function savePurchaseHistory(history: Purchase[]): void {
	try {
		localStorage.setItem('task-kanban-purchase-history', JSON.stringify(history));
		purchaseHistoryStore.set(history);
	} catch (error) {
		console.error('Failed to save purchase history:', error);
	}
}

/**
 * Add new shop item
 */
export function addShopItem(name: string, price: number, description?: string, emoji?: string, category?: string): ShopItem {
	const item: ShopItem = {
		id: `shop-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name,
		price,
		description,
		emoji,
		category,
		createdAt: new Date().toISOString(),
	};
	
	const currentItems = get(shopItemsStore);
	const newItems = [...currentItems, item];
	saveShopItems(newItems);
	
	return item;
}

/**
 * Get all unique categories from shop items
 */
export function getCategories(): string[] {
	const items = get(shopItemsStore);
	const categories = new Set<string>();
	
	items.forEach(item => {
		if (item.category) {
			categories.add(item.category);
		}
	});
	
	return Array.from(categories).sort();
}

/**
 * Remove shop item
 */
export function removeShopItem(itemId: string): void {
	const currentItems = get(shopItemsStore);
	const newItems = currentItems.filter(item => item.id !== itemId);
	saveShopItems(newItems);
}

/**
 * Update shop item
 */
export function updateShopItem(itemId: string, updates: Partial<Omit<ShopItem, 'id' | 'createdAt'>>): void {
	const currentItems = get(shopItemsStore);
	const newItems = currentItems.map(item => 
		item.id === itemId ? { ...item, ...updates } : item
	);
	saveShopItems(newItems);
}

/**
 * Record a purchase
 */
export function recordPurchase(item: ShopItem): Purchase {
	const purchase: Purchase = {
		id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		itemId: item.id,
		itemName: item.name,
		itemEmoji: item.emoji,
		price: item.price,
		purchasedAt: new Date().toISOString(),
	};
	
	const currentHistory = get(purchaseHistoryStore);
	const newHistory = [purchase, ...currentHistory]; // New purchases first
	savePurchaseHistory(newHistory);
	
	return purchase;
}

/**
 * Get purchase statistics
 */
export function getPurchaseStats() {
	const history = get(purchaseHistoryStore);
	
	const totalPurchases = history.length;
	const totalSpent = history.reduce((sum, purchase) => sum + purchase.price, 0);
	
	// Count purchases by item
	const itemCounts = history.reduce((acc, purchase) => {
		acc[purchase.itemName] = (acc[purchase.itemName] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);
	
	return {
		totalPurchases,
		totalSpent,
		itemCounts,
	};
}

