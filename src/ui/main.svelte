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
	import { onMount } from "svelte";

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

	// Load points balance when component mounts
	onMount(() => {
		loadPointsBalance();
	});
</script>

<div class="main">
	<div class="header-bar">
		<div class="points-balance">
			<span class="points-icon">💰</span>
			<span class="points-label">Баллы:</span>
			<span class="points-value">{$pointsBalanceStore}</span>
		</div>
		<div class="settings">
			<IconButton icon="lucide-settings" on:click={handleOpenSettings} />
		</div>
	</div>
	<div class="controls">
		<div class="text-filter">
			<label for="filter">Filter by content:</label>
			<input
				name="filter"
				type="search"
				bind:value={filterText}
				placeholder="Type to search..."
			/>
		</div>
		<SelectTag tags={[...tags]} bind:value={selectedTags} />
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
</div>

<style lang="scss">
	.main {
		height: 100%;
		display: flex;
		flex-direction: column;

		.header-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: var(--size-4-2);
			padding: var(--size-4-2) 0;

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
			}

			.settings {
				display: flex;
				justify-content: flex-end;
			}
		}

		.controls {
			margin-bottom: var(--size-4-4);
			display: grid;
			gap: var(--size-4-8);
			grid-template-columns: 1fr 1fr;

			.text-filter {
				display: flex;
				flex-direction: column;
				flex-grow: 1;

				label {
					display: inline-block;
					margin-bottom: var(--size-4-1);

					~ input[type="search"] {
						display: block;
						flex-grow: 1;
						background: var(--background-primary);
					}
				}
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
