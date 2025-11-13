<script lang="ts">
	import { onMount } from "svelte";
	import { 
		shopItemsStore, 
		purchaseHistoryStore,
		loadShopItems,
		loadPurchaseHistory,
		addShopItem,
		removeShopItem,
		updateShopItem,
		recordPurchase,
		getCategories,
		type ShopItem 
	} from "../shop/shop_store";
	import { pointsBalanceStore, subtractPoints } from "../points/points_store";
	import { Notice } from "obsidian";

	export let isOpen = false;
	export let onClose: () => void;

	let activeTab: 'shop' | 'history' = 'shop';
	let selectedCategory: string = 'all';
	let showAddForm = false;
	let editingItemId: string | null = null;
	let newItemName = '';
	let newItemPrice = 10;
	let newItemDescription = '';
	let newItemEmoji = '🎁';
	let newItemCategory = '';

	onMount(() => {
		loadShopItems();
		loadPurchaseHistory();
	});

	$: categories = getCategories();
	$: filteredItems = selectedCategory === 'all' 
		? $shopItemsStore 
		: $shopItemsStore.filter(item => item.category === selectedCategory);

	function handleAddItem() {
		if (!newItemName.trim()) {
			new Notice('Введите название товара');
			return;
		}
		
		if (newItemPrice <= 0) {
			new Notice('Цена должна быть больше нуля');
			return;
		}

		if (editingItemId) {
			// Редактируем существующий товар
			updateShopItem(editingItemId, {
				name: newItemName.trim(),
				price: newItemPrice,
				description: newItemDescription.trim() || undefined,
				emoji: newItemEmoji || undefined,
				category: newItemCategory.trim() || undefined,
			});
			new Notice('Товар обновлён!');
		} else {
			// Добавляем новый товар
			addShopItem(
				newItemName.trim(), 
				newItemPrice, 
				newItemDescription.trim() || undefined,
				newItemEmoji || undefined,
				newItemCategory.trim() || undefined
			);
			new Notice('Товар добавлен!');
		}

		// Reset form
		resetForm();
	}

	function resetForm() {
		newItemName = '';
		newItemPrice = 10;
		newItemDescription = '';
		newItemEmoji = '🎁';
		newItemCategory = '';
		showAddForm = false;
		editingItemId = null;
	}

	function handleEditItem(item: ShopItem) {
		newItemName = item.name;
		newItemPrice = item.price;
		newItemDescription = item.description || '';
		newItemEmoji = item.emoji || '🎁';
		newItemCategory = item.category || '';
		editingItemId = item.id;
		showAddForm = true;
	}

	function handleRemoveItem(itemId: string) {
		if (confirm('Удалить этот товар?')) {
			removeShopItem(itemId);
			new Notice('Товар удалён');
		}
	}

	function handlePurchase(item: ShopItem) {
		const currentBalance = $pointsBalanceStore;
		
		if (currentBalance < item.price) {
			new Notice('Недостаточно баллов!');
			return;
		}

		if (confirm(`Купить "${item.name}" за ${item.price} баллов?`)) {
			subtractPoints(item.price);
			recordPurchase(item);
			new Notice(`Куплено: ${item.emoji || '🎁'} ${item.name}!`);
		}
	}

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={handleOverlayClick} on:keypress={(e) => e.key === 'Escape' && onClose()} role="dialog" tabindex="-1">
		<div class="modal-content">
			<div class="modal-header">
				<h2>🛒 Магазин наград</h2>
				<button class="close-button" on:click={onClose}>✕</button>
			</div>

			<div class="balance-display">
				<span class="balance-icon">💰</span>
				<span class="balance-label">Доступно:</span>
				<span class="balance-value">{$pointsBalanceStore} баллов</span>
			</div>

			<div class="tabs">
				<button 
					class="tab" 
					class:active={activeTab === 'shop'}
					on:click={() => activeTab = 'shop'}
				>
					🛍️ Магазин
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'history'}
					on:click={() => activeTab = 'history'}
				>
					📜 История покупок
				</button>
			</div>

			<div class="modal-body">
				{#if activeTab === 'shop'}
					<div class="shop-section">
						{#if !showAddForm}
							<button class="toggle-form-button" on:click={() => showAddForm = true}>
								➕ Добавить новый товар
							</button>
						{/if}

						{#if showAddForm}
							<div class="add-item-form">
								<div class="form-header">
									<h3>{editingItemId ? '✏️ Редактировать товар' : '➕ Добавить новый товар'}</h3>
									<button class="close-form-button" on:click={resetForm}>✕</button>
								</div>
								<div class="form-grid">
									<input 
										type="text" 
										placeholder="Название товара" 
										bind:value={newItemName}
									/>
									<input 
										type="text" 
										placeholder="🎁" 
										maxlength="2"
										bind:value={newItemEmoji}
										class="emoji-input"
									/>
									<input 
										type="number" 
										placeholder="Цена" 
										min="1"
										bind:value={newItemPrice}
										class="price-input"
									/>
									<input 
										type="text" 
										placeholder="Категория" 
										bind:value={newItemCategory}
										class="category-input"
									/>
								</div>
								<textarea 
									placeholder="Описание (необязательно)" 
									bind:value={newItemDescription}
									rows="2"
								/>
								<button class="add-button" on:click={handleAddItem}>
									{editingItemId ? '💾 Сохранить изменения' : '➕ Добавить товар'}
								</button>
							</div>
						{/if}

						<div class="category-tabs">
							<button 
								class="category-tab" 
								class:active={selectedCategory === 'all'}
								on:click={() => selectedCategory = 'all'}
							>
								Все ({$shopItemsStore.length})
							</button>
							{#each categories as category}
								<button 
									class="category-tab" 
									class:active={selectedCategory === category}
									on:click={() => selectedCategory = category}
								>
									{category} ({$shopItemsStore.filter(i => i.category === category).length})
								</button>
							{/each}
						</div>

						<div class="items-list">
							{#if filteredItems.length === 0}
								<p class="empty-message">
									{selectedCategory === 'all' 
										? 'Пока нет товаров. Добавьте свою первую награду!' 
										: `Нет товаров в категории "${selectedCategory}"`}
								</p>
							{:else}
								<div class="items-grid">
									{#each filteredItems as item (item.id)}
										<div class="shop-item">
											<div class="item-header">
												<span class="item-emoji">{item.emoji || '🎁'}</span>
												<div class="item-info">
													<h4>{item.name}</h4>
													{#if item.description}
														<p class="item-description">{item.description}</p>
													{/if}
												</div>
												<div class="item-actions">
													<button 
														class="edit-button" 
														on:click={() => handleEditItem(item)}
														title="Редактировать"
													>
														✏️
													</button>
													<button 
														class="delete-button" 
														on:click={() => handleRemoveItem(item.id)}
														title="Удалить"
													>
														🗑️
													</button>
												</div>
											</div>
											<div class="item-footer">
												<span class="item-price">💰 {item.price}</span>
												<button 
													class="buy-button"
													on:click={() => handlePurchase(item)}
													disabled={$pointsBalanceStore < item.price}
												>
													{$pointsBalanceStore < item.price ? 'Недостаточно баллов' : 'Купить'}
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="history-section">
						<h3>История покупок</h3>
						{#if $purchaseHistoryStore.length === 0}
							<p class="empty-message">У вас пока нет покупок</p>
						{:else}
							<div class="history-list">
								{#each $purchaseHistoryStore as purchase (purchase.id)}
									<div class="history-item">
										<span class="history-emoji">{purchase.itemEmoji || '🎁'}</span>
										<div class="history-info">
											<strong>{purchase.itemName}</strong>
											<span class="history-date">{formatDate(purchase.purchasedAt)}</span>
										</div>
										<span class="history-price">-{purchase.price} 💰</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--size-4-4);
	}

	.modal-content {
		background: var(--background-primary);
		border-radius: var(--radius-l);
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--size-4-4);
		border-bottom: 1px solid var(--background-modifier-border);

		h2 {
			margin: 0;
			font-size: var(--font-ui-larger);
		}

		.close-button {
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: var(--text-muted);
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--radius-s);

			&:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}
		}
	}

	.balance-display {
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
		padding: var(--size-4-3);
		background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
		color: var(--text-on-accent);
		margin: var(--size-4-3);
		border-radius: var(--radius-m);
		font-weight: var(--font-semibold);

		.balance-icon {
			font-size: 1.3em;
		}

		.balance-value {
			font-size: 1.2em;
			font-weight: var(--font-bold);
		}
	}

	.tabs {
		display: flex;
		gap: var(--size-4-2);
		padding: 0 var(--size-4-4);
		border-bottom: 1px solid var(--background-modifier-border);

		.tab {
			padding: var(--size-4-2) var(--size-4-4);
			background: none;
			border: none;
			border-bottom: 2px solid transparent;
			cursor: pointer;
			font-weight: var(--font-medium);
			color: var(--text-muted);
			transition: all 0.2s;

			&:hover {
				color: var(--text-normal);
			}

			&.active {
				color: var(--interactive-accent);
				border-bottom-color: var(--interactive-accent);
			}
		}
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--size-4-4);
	}

	.toggle-form-button {
		width: 100%;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		padding: var(--size-4-3);
		border-radius: var(--radius-m);
		font-weight: var(--font-semibold);
		cursor: pointer;
		margin-bottom: var(--size-4-4);
		font-size: var(--font-ui-medium);
		transition: all 0.2s;

		&:hover {
			background: var(--interactive-accent-hover);
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
	}

	.add-item-form {
		background: var(--background-secondary);
		padding: var(--size-4-4);
		border-radius: var(--radius-m);
		margin-bottom: var(--size-4-4);
		border: 2px solid var(--interactive-accent);

		.form-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: var(--size-4-3);

			h3 {
				margin: 0;
			}

			.close-form-button {
				background: none;
				border: none;
				font-size: 20px;
				cursor: pointer;
				color: var(--text-muted);
				width: 28px;
				height: 28px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: var(--radius-s);

				&:hover {
					background: var(--background-modifier-hover);
					color: var(--text-normal);
				}
			}
		}

		.form-grid {
			display: grid;
			grid-template-columns: 1fr auto auto 1fr;
			gap: var(--size-4-2);
			margin-bottom: var(--size-4-2);

			input {
				background: var(--background-primary);
			}

			.emoji-input {
				width: 60px;
				text-align: center;
				font-size: 1.2em;
			}

			.price-input {
				width: 100px;
			}

			.category-input {
				min-width: 150px;
			}
		}

		textarea {
			width: 100%;
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			padding: var(--size-4-2);
			resize: vertical;
			margin-bottom: var(--size-4-2);
		}

		.add-button {
			width: 100%;
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			padding: var(--size-4-2);
			border-radius: var(--radius-s);
			font-weight: var(--font-semibold);
			cursor: pointer;

			&:hover {
				background: var(--interactive-accent-hover);
			}
		}
	}

	.category-tabs {
		display: flex;
		gap: var(--size-4-2);
		margin-bottom: var(--size-4-4);
		overflow-x: auto;
		padding-bottom: var(--size-4-2);

		.category-tab {
			padding: var(--size-2-2) var(--size-4-3);
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-m);
			cursor: pointer;
			font-weight: var(--font-medium);
			color: var(--text-muted);
			transition: all 0.2s;
			white-space: nowrap;

			&:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			&.active {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border-color: var(--interactive-accent);
			}
		}
	}

	.items-list {
		margin-top: 0;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--size-4-3);
	}

	.shop-item {
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		padding: var(--size-4-3);
		transition: transform 0.2s, box-shadow 0.2s;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}

		.item-header {
			display: flex;
			gap: var(--size-4-3);
			align-items: flex-start;
			margin-bottom: var(--size-4-3);

			.item-emoji {
				font-size: 2em;
			}

			.item-info {
				flex: 1;

				h4 {
					margin: 0 0 var(--size-2-1) 0;
				}

				.item-description {
					margin: 0;
					font-size: var(--font-ui-small);
					color: var(--text-muted);
				}
			}

			.item-actions {
				display: flex;
				gap: var(--size-2-1);
			}

			.edit-button,
			.delete-button {
				background: none;
				border: none;
				cursor: pointer;
				font-size: 1.2em;
				opacity: 0.6;
				transition: opacity 0.2s;

				&:hover {
					opacity: 1;
				}
			}
		}

		.item-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-top: var(--size-4-2);
			border-top: 1px solid var(--background-modifier-border);

			.item-price {
				font-size: var(--font-ui-medium);
				font-weight: var(--font-bold);
				color: var(--interactive-accent);
			}

			.buy-button {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				padding: var(--size-2-2) var(--size-4-4);
				border-radius: var(--radius-s);
				font-weight: var(--font-semibold);
				cursor: pointer;
				transition: all 0.2s;

				&:hover:not(:disabled) {
					background: var(--interactive-accent-hover);
				}

				&:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
			}
		}
	}

	.history-section {
		h3 {
			margin: 0 0 var(--size-4-3) 0;
		}
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-2);
	}

	.history-item {
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		padding: var(--size-4-3);
		display: flex;
		align-items: center;
		gap: var(--size-4-3);

		.history-emoji {
			font-size: 1.5em;
		}

		.history-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--size-2-1);

			strong {
				font-weight: var(--font-semibold);
			}

			.history-date {
				font-size: var(--font-ui-small);
				color: var(--text-muted);
			}
		}

		.history-price {
			font-weight: var(--font-bold);
			color: var(--text-error);
		}
	}

	.empty-message {
		text-align: center;
		color: var(--text-muted);
		padding: var(--size-4-8);
	}
</style>

