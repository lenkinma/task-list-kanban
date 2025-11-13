<script lang="ts">
	import { dailiesStore, addDaily, updateDaily, removeDaily, completeDaily, uncompleteDaily, checkDailiesDate, type Daily } from "../dailies/dailies_store";
	import { pointsBalanceStore } from "../points/points_store";
	import { onDestroy } from "svelte";

	export let isOpen: boolean;
	export let onClose: () => void;

	// Периодическая проверка даты при открытии модального окна и каждую минуту
	let checkInterval: number | undefined;
	
	$: if (isOpen) {
		checkDailiesDate(); // Проверяем сразу при открытии
		if (checkInterval) {
			clearInterval(checkInterval);
		}
		checkInterval = window.setInterval(() => {
			checkDailiesDate();
		}, 60000); // Проверка каждую минуту
	} else {
		if (checkInterval) {
			clearInterval(checkInterval);
			checkInterval = undefined;
		}
	}

	onDestroy(() => {
		if (checkInterval) {
			clearInterval(checkInterval);
		}
	});

	let showAddForm = false;
	let editingDailyId: string | null = null;
	let newDailyName = "";
	let newDailyReward = 10;
	let newDailyDescription = "";
	let newDailyEmoji = "🎯";

	function handleAddDaily() {
		if (!newDailyName.trim() || newDailyReward <= 0) return;

		if (editingDailyId) {
			// Редактирование
			updateDaily(editingDailyId, {
				name: newDailyName.trim(),
				reward: newDailyReward,
				description: newDailyDescription.trim() || undefined,
				emoji: newDailyEmoji || undefined
			});
		} else {
			// Добавление
			addDaily(
				newDailyName.trim(),
				newDailyReward,
				newDailyDescription.trim() || undefined,
				newDailyEmoji || undefined
			);
		}
		resetForm();
	}

	function resetForm() {
		showAddForm = false;
		editingDailyId = null;
		newDailyName = "";
		newDailyReward = 10;
		newDailyDescription = "";
		newDailyEmoji = "🎯";
	}

	function handleEditDaily(daily: Daily) {
		editingDailyId = daily.id;
		newDailyName = daily.name;
		newDailyReward = daily.reward;
		newDailyDescription = daily.description || "";
		newDailyEmoji = daily.emoji || "🎯";
		showAddForm = true;
	}

	function handleRemoveDaily(id: string) {
		if (confirm("Удалить это ежедневное задание?")) {
			removeDaily(id);
		}
	}

	function handleToggleComplete(daily: Daily) {
		if (daily.completedToday) {
			uncompleteDaily(daily.id);
		} else {
			completeDaily(daily.id);
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	$: completedToday = $dailiesStore.filter(d => d.completedToday).length;
	$: totalDailies = $dailiesStore.length;
	$: todayProgress = totalDailies > 0 ? Math.round((completedToday / totalDailies) * 100) : 0;
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={handleOverlayClick} on:keypress={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="0">
		<div class="modal-content">
			<div class="modal-header">
				<h2>🔥 Дейлики</h2>
				<button class="close-button" on:click={onClose}>✕</button>
			</div>

			<div class="stats-bar">
				<div class="stat">
					<span class="stat-icon">✅</span>
					<span class="stat-label">Выполнено сегодня:</span>
					<span class="stat-value">{completedToday}/{totalDailies}</span>
				</div>
				<div class="stat">
					<span class="stat-icon">📊</span>
					<span class="stat-label">Прогресс:</span>
					<span class="stat-value">{todayProgress}%</span>
				</div>
				<div class="stat">
					<span class="stat-icon">💰</span>
					<span class="stat-label">Баланс:</span>
					<span class="stat-value">{$pointsBalanceStore}</span>
				</div>
			</div>

			<div class="progress-bar-container">
				<div class="progress-bar" style="width: {todayProgress}%"></div>
			</div>

			<div class="modal-body">
				<div class="add-daily-section">
					{#if !showAddForm}
						<button class="add-daily-button" on:click={() => showAddForm = true}>
							➕ Добавить дейлик
						</button>
					{:else}
						<div class="add-daily-form">
							<div class="form-header">
								<h3>{editingDailyId ? '✏️ Редактировать дейлик' : '➕ Добавить новый дейлик'}</h3>
								<button class="close-form-button" on:click={resetForm}>✕</button>
							</div>
							<div class="form-row">
								<label>
									<span class="form-label">Эмодзи</span>
									<input
										type="text"
										bind:value={newDailyEmoji}
										placeholder="🎯"
										maxlength="2"
										class="emoji-input"
									/>
								</label>
								<label class="form-field-grow">
									<span class="form-label">Название *</span>
									<input
										type="text"
										bind:value={newDailyName}
										placeholder="Название дейлика"
										required
									/>
								</label>
								<label>
									<span class="form-label">Награда 💰 *</span>
									<input
										type="number"
										bind:value={newDailyReward}
										min="1"
										placeholder="10"
										required
										class="reward-input"
									/>
								</label>
							</div>
							<label>
								<span class="form-label">Описание</span>
								<textarea
									bind:value={newDailyDescription}
									placeholder="Описание (необязательно)"
									rows="2"
								/>
							</label>
							<button class="save-button" on:click={handleAddDaily}>
								{editingDailyId ? '💾 Сохранить' : '➕ Добавить'}
							</button>
						</div>
					{/if}
				</div>

				<div class="dailies-list">
					{#each $dailiesStore as daily (daily.id)}
						<div class="daily-item" class:completed={daily.completedToday}>
								<div class="daily-checkbox">
									<input
										type="checkbox"
										checked={daily.completedToday}
										on:change={() => handleToggleComplete(daily)}
										id="daily-{daily.id}"
									/>
									<label for="daily-{daily.id}" class="checkbox-label"></label>
								</div>
								<div class="daily-info">
									<div class="daily-header-row">
										<div class="daily-title">
											{#if daily.emoji}
												<span class="daily-emoji">{daily.emoji}</span>
											{/if}
											<span class="daily-name">{daily.name}</span>
										</div>
										<div class="daily-actions">
											<div class="daily-reward">
												<span class="reward-icon">💰</span>
												<span class="reward-value">{daily.reward}</span>
											</div>
											<button
												class="edit-button"
												on:click={() => handleEditDaily(daily)}
												title="Редактировать"
											>
												✏️
											</button>
											<button
												class="delete-button"
												on:click={() => handleRemoveDaily(daily.id)}
												title="Удалить"
											>
												🗑️
											</button>
										</div>
									</div>
									{#if daily.description}
										<p class="daily-description">{daily.description}</p>
									{/if}
									<div class="daily-stats">
										{#if daily.streak > 0}
											<span class="stat-badge streak">
												<span class="badge-icon">🔥</span>
												<span class="badge-value">{daily.streak} {daily.streak === 1 ? 'день' : daily.streak < 5 ? 'дня' : 'дней'}</span>
											</span>
										{/if}
										<span class="stat-badge total">
											<span class="badge-icon">📊</span>
											<span class="badge-value">Всего: {daily.totalCompletions}</span>
										</span>
									</div>
								</div>
							</div>
						{/each}
				</div>
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
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--background-primary);
		border-radius: var(--radius-l);
		width: 90%;
		max-width: 700px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		border: 1px solid var(--background-modifier-border);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--size-4-4) var(--size-4-6);
		border-bottom: 2px solid var(--background-modifier-border);
		flex-shrink: 0;
		position: relative;
		z-index: 10;

		h2 {
			margin: 0;
			font-size: var(--font-ui-large);
			color: var(--text-normal);
		}

		.close-button {
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: var(--text-muted);
			padding: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--radius-s);
			transition: all 0.2s ease;
			flex-shrink: 0;

			&:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}
		}
	}

	.stats-bar {
		display: flex;
		gap: var(--size-4-4);
		padding: var(--size-4-3) var(--size-4-6);
		background: var(--background-secondary);
		border-bottom: 1px solid var(--background-modifier-border);
		flex-shrink: 0;

		.stat {
			display: flex;
			align-items: center;
			gap: var(--size-2-1);
			font-size: var(--font-ui-small);

			.stat-icon {
				font-size: 16px;
			}

			.stat-label {
				color: var(--text-muted);
			}

			.stat-value {
				color: var(--text-normal);
				font-weight: var(--font-semibold);
			}
		}
	}

	.progress-bar-container {
		width: 100%;
		height: 6px;
		background: var(--background-secondary);
		position: relative;
		overflow: hidden;
		flex-shrink: 0;

		.progress-bar {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			background: linear-gradient(to right, #10b981, #3b82f6);
			transition: width 0.5s ease;
			max-width: 100%;
		}
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--size-4-4) var(--size-4-6);
		display: flex;
		flex-direction: column;
		gap: var(--size-4-4);
	}

	.add-daily-section {
		.add-daily-button {
			width: 100%;
			padding: var(--size-4-3);
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			border-radius: var(--radius-m);
			font-size: var(--font-ui-medium);
			font-weight: var(--font-semibold);
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: var(--interactive-accent-hover);
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
			}
		}

		.add-daily-form {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-m);
			padding: var(--size-4-4);
			display: flex;
			flex-direction: column;
			gap: var(--size-4-3);

			.form-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: var(--size-2-1);

				h3 {
					margin: 0;
					font-size: var(--font-ui-medium);
					color: var(--text-normal);
				}

				.close-form-button {
					background: none;
					border: none;
					font-size: 20px;
					cursor: pointer;
					color: var(--text-muted);
					padding: 0;
					width: 24px;
					height: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: var(--radius-s);
					transition: all 0.2s ease;

					&:hover {
						background: var(--background-modifier-hover);
						color: var(--text-normal);
					}
				}
			}

			.form-row {
				display: flex;
				gap: var(--size-4-2);
				align-items: flex-end;

				.form-field-grow {
					flex: 1;
				}
			}

			.form-label {
				display: block;
				margin-bottom: var(--size-2-1);
				font-size: var(--font-ui-small);
				font-weight: var(--font-medium);
				color: var(--text-muted);
			}

			input,
			textarea {
				width: 100%;
				padding: var(--size-4-2);
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: var(--radius-s);
				color: var(--text-normal);
				font-size: var(--font-ui-medium);
				transition: all 0.2s ease;

				&:focus {
					outline: none;
					border-color: var(--interactive-accent);
					box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
				}
			}

			.emoji-input {
				width: 60px;
				text-align: center;
				font-size: var(--font-ui-large);
			}

			.reward-input {
				width: 100px;
			}

			textarea {
				resize: vertical;
				min-height: 60px;
				font-family: var(--font-interface);
			}

			.save-button {
				padding: var(--size-4-2) var(--size-4-4);
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				border-radius: var(--radius-s);
				font-size: var(--font-ui-medium);
				font-weight: var(--font-semibold);
				cursor: pointer;
				transition: all 0.2s ease;

				&:hover {
					background: var(--interactive-accent-hover);
					transform: translateY(-1px);
				}
			}
		}
	}

	.dailies-list {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-2);
	}

	.daily-item {
		display: flex;
		gap: var(--size-4-3);
		padding: var(--size-4-3);
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m);
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--background-modifier-border-hover);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		&.completed {
			opacity: 0.7;
			background: var(--background-primary-alt);

			.daily-name {
				text-decoration: line-through;
				color: var(--text-muted);
			}
		}
	}

	.daily-checkbox {
		position: relative;
		flex-shrink: 0;

		input[type="checkbox"] {
			position: absolute;
			opacity: 0;
			cursor: pointer;

			&:checked + .checkbox-label {
				background: var(--interactive-accent);
				border-color: var(--interactive-accent);

				&::after {
					display: block;
				}
			}
		}

		.checkbox-label {
			display: block;
			width: 24px;
			height: 24px;
			border: 2px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			cursor: pointer;
			transition: all 0.2s ease;
			position: relative;

			&::after {
				content: "✓";
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				color: var(--text-on-accent);
				font-size: 16px;
				font-weight: bold;
				display: none;
			}

			&:hover {
				border-color: var(--interactive-accent);
			}
		}
	}

	.daily-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--size-2-2);
	}

	.daily-header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--size-4-2);
	}

	.daily-title {
		display: flex;
		align-items: center;
		gap: var(--size-2-2);
		flex: 1;

		.daily-emoji {
			font-size: 20px;
		}

		.daily-name {
			font-size: var(--font-ui-medium);
			font-weight: var(--font-semibold);
			color: var(--text-normal);
		}
	}

	.daily-actions {
		display: flex;
		align-items: center;
		gap: var(--size-2-2);
		flex-shrink: 0;
	}

	.daily-reward {
		display: flex;
		align-items: center;
		gap: var(--size-2-1);
		padding: var(--size-2-1) var(--size-2-3);
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		color: white;
		border-radius: var(--radius-s);
		font-weight: var(--font-semibold);
		font-size: var(--font-ui-small);

		.reward-icon {
			font-size: 14px;
		}
	}

	.edit-button,
	.delete-button {
		background: none;
		border: none;
		font-size: 16px;
		cursor: pointer;
		padding: var(--size-2-1);
		border-radius: var(--radius-s);
		transition: all 0.2s ease;
		opacity: 0.6;

		&:hover {
			opacity: 1;
			background: var(--background-modifier-hover);
		}
	}

	.daily-description {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		line-height: 1.4;
	}

	.daily-stats {
		display: flex;
		gap: var(--size-2-2);
		flex-wrap: wrap;
	}

	.stat-badge {
		display: flex;
		align-items: center;
		gap: var(--size-2-1);
		padding: var(--size-2-1) var(--size-2-2);
		border-radius: var(--radius-s);
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);

		&.streak {
			background: linear-gradient(135deg, #f59e0b, #ef4444);
			color: white;

			.badge-icon {
				font-size: 12px;
			}
		}

		&.total {
			background: var(--background-primary);
			color: var(--text-muted);
			border: 1px solid var(--background-modifier-border);

			.badge-icon {
				font-size: 12px;
			}
		}
	}
</style>

