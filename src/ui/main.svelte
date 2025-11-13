<script lang="ts">
	import {
		type ColumnTag,
		type ColumnTagTable,
		type ColumnColourTable,
		type DefaultColumns,
	} from "./columns/columns";
	import type { Task } from "./tasks/task";
	import Column from "./components/column.svelte";
	import SelectTag from "./components/select/select_tag.svelte";
	import IconButton from "./components/icon_button.svelte";
	import type { Writable, Readable } from "svelte/store";
	import type { TaskActions } from "./tasks/actions";
	import { type SettingValues, VisibilityOption } from "./settings/settings_store";
	import { pointsBalanceStore, loadPointsBalance } from "./points/points_store";
	import { loadDailies } from "./dailies/dailies_store";
	import { onMount } from "svelte";
	import ShopModal from "./components/shop_modal.svelte";
	import DailiesModal from "./components/dailies_modal.svelte";

	export let tasksStore: Writable<Task[]>;
	export let taskActions: TaskActions;
	export let openSettings: () => Promise<void>;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let columnColourTableStore: Readable<ColumnColourTable>;
	export let settingsStore: Writable<SettingValues>;

	$: tags = $tasksStore.reduce((acc, curr) => {
		for (const tag of curr.tags) {
			acc.add(tag);
		}
		return acc;
	}, new Set<string>());

	let selectedTags: string[] = [];
	$: selectedTagsSet = new Set(selectedTags);

	function groupByColumnTag(
		tasks: Task[],
	): Record<ColumnTag | DefaultColumns, Task[]> {
		const output: Record<ColumnTag | DefaultColumns, Task[]> = {
			uncategorised: [],
			done: [],
		};
		for (const task of tasks) {
			if (task.done || task.column === "done") {
				output["done"] = output["done"].concat(task);
			} else if (task.column === "archived") {
				// ignored
			} else if (task.column) {
				output[task.column] = (output[task.column] ?? []).concat(task);
			} else {
				output["uncategorised"] = output["uncategorised"].concat(task);
			}
		}
		return output;
	}

	let columns: ("uncategorised" | ColumnTag)[];
	$: columns = Object.keys($columnTagTableStore) as ColumnTag[];

	let filterText = "";

	$: filteredByText = filterText
		? $tasksStore.filter((task) =>
				task.content.toLowerCase().includes(filterText.toLowerCase()),
			)
		: $tasksStore;

	$: filteredByTag = selectedTagsSet.size
		? filteredByText.filter((task) => {
				for (const tag of task.tags) {
					if (selectedTagsSet.has(tag)) {
						return true;
					}
				}

				return false;
			})
		: filteredByText;

	$: tasksByColumn = groupByColumnTag(filteredByTag);

	$: ({ 
		showFilepath = true, 
		consolidateTags = false, 
		uncategorizedVisibility = VisibilityOption.Auto,
		doneVisibility = VisibilityOption.AlwaysShow
	} = $settingsStore);

	$: showUncategorizedColumn =
		uncategorizedVisibility === VisibilityOption.AlwaysShow ||
		(uncategorizedVisibility === VisibilityOption.Auto && tasksByColumn["uncategorised"]?.length > 0);

	$: showDoneColumn =
		doneVisibility === VisibilityOption.AlwaysShow ||
		(doneVisibility === VisibilityOption.Auto && tasksByColumn["done"]?.length > 0);
		
	async function handleOpenSettings() {
		openSettings();
	}

	// Load points balance and dailies when component mounts
	onMount(() => {
		loadPointsBalance();
		loadDailies();
	});

	let isShopOpen = false;
	let isDailiesOpen = false;

	function openShop() {
		isShopOpen = true;
	}

	function closeShop() {
		isShopOpen = false;
	}

	function openDailies() {
		isDailiesOpen = true;
	}

	function closeDailies() {
		isDailiesOpen = false;
	}
</script>

<div class="main">
	<div class="header-bar">
		<div class="quick-actions">
			<div class="dailies-button" on:click={openDailies} on:keypress={(e) => e.key === 'Enter' && openDailies()} role="button" tabindex="0" title="Дейлики">
				<span class="dailies-icon">🔥</span>
				<span class="dailies-label">Дейлики</span>
			</div>
			<div class="points-balance" on:click={openShop} on:keypress={(e) => e.key === 'Enter' && openShop()} role="button" tabindex="0">
				<span class="points-icon">💰</span>
				<span class="points-label">Баллы:</span>
				<span class="points-value">{$pointsBalanceStore}</span>
				<span class="shop-icon">🛒</span>
			</div>
		</div>
		<div class="filters">
			<input
				name="filter"
				type="search"
				bind:value={filterText}
				placeholder="Поиск задач..."
			/>
			<SelectTag tags={[...tags]} bind:value={selectedTags} />
		</div>
		<div class="settings">
			<IconButton icon="lucide-settings" on:click={handleOpenSettings} />
		</div>
	</div>

	<div class="columns">
		<div>
			{#if showUncategorizedColumn}
			<Column
				column={"uncategorised"}
				hideOnEmpty={false}
				tasks={tasksByColumn["uncategorised"]}
				{taskActions}
				{columnTagTableStore}
				{columnColourTableStore}
				{showFilepath}
				{consolidateTags}
			/>
			{/if}
			{#each columns as column}
				<Column
					{column}
					tasks={tasksByColumn[column] ?? []}
					{taskActions}
					{columnTagTableStore}
					{columnColourTableStore}
					{showFilepath}
					{consolidateTags}
				/>
			{/each}
			{#if showDoneColumn}
			<Column
				column="done"
				hideOnEmpty={false}
				tasks={tasksByColumn["done"] ?? []}
				{taskActions}
				{columnTagTableStore}
				{columnColourTableStore}
				{showFilepath}
				{consolidateTags}
			/>
			{/if}
		</div>
	</div>

	<ShopModal isOpen={isShopOpen} onClose={closeShop} />
	<DailiesModal isOpen={isDailiesOpen} onClose={closeDailies} />
</div>

<style lang="scss">
	.main {
		height: 100%;
		display: flex;
		flex-direction: column;

		.header-bar {
			display: flex;
			align-items: center;
			gap: var(--size-4-3);
			margin-bottom: var(--size-4-4);
			padding: var(--size-4-2) 0;

			.quick-actions {
				display: flex;
				align-items: center;
				gap: var(--size-4-2);
				flex-shrink: 0;
			}

		.dailies-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--size-2-2);
			padding: var(--size-4-2) var(--size-4-3);
			background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
			color: var(--text-on-accent);
			border-radius: var(--radius-m);
			font-size: var(--font-ui-medium);
			font-weight: var(--font-semibold);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
			position: relative;

			&:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
			}

			.dailies-icon {
				font-size: 1.3em;
				animation: flame 2s ease-in-out infinite;
			}

			.dailies-label {
				white-space: nowrap;
			}
		}

			@keyframes flame {
				0%, 100% {
					transform: scale(1);
				}
				50% {
					transform: scale(1.1);
				}
			}

			.points-balance {
				display: flex;
				align-items: center;
				gap: var(--size-4-2);
				padding: var(--size-4-2) var(--size-4-3);
				background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
				color: var(--text-on-accent);
				border-radius: var(--radius-m);
				font-size: var(--font-ui-medium);
				font-weight: var(--font-semibold);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				cursor: pointer;
				transition: transform 0.2s, box-shadow 0.2s;

				&:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				}

				.points-icon {
					font-size: 1.3em;
				}

				.points-label {
					opacity: 0.9;
				}

				.points-value {
					font-size: 1.2em;
					font-weight: var(--font-bold);
				}

				.shop-icon {
					font-size: 1.2em;
					opacity: 0.9;
					margin-left: var(--size-2-1);
				}
			}

			.filters {
				display: flex;
				gap: var(--size-4-3);
				flex-grow: 1;
				align-items: center;

				input[type="search"] {
					flex: 1;
					background: var(--background-primary);
					min-width: 150px;
				}
			}

			.settings {
				display: flex;
				flex-shrink: 0;
			}
		}

		.columns {
			height: 100%;
			flex-grow: 1;
			max-width: 100vw;
			overflow-x: scroll;
			padding-bottom: var(--size-4-3);

			> div {
				display: flex;
				gap: var(--size-4-3);
			}
		}
	}
</style>
