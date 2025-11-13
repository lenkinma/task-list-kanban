<script lang="ts">
	import type { ColumnTagTable } from "../columns/columns";
	import { isDraggingStore } from "../dnd/store";
	import type { TaskActions } from "../tasks/actions";
	import type { Task } from "../tasks/task";
	import TaskMenu from "./task_menu.svelte";
	import { Converter } from "showdown";
	import type { Readable } from "svelte/store";

	export let task: Task;
	export let taskActions: TaskActions;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let showFilepath: boolean;
	export let consolidateTags: boolean;

	const mdConverted = new Converter({
		simplifiedAutoLink: true,
		openLinksInNewWindow: true,
		emoji: true,
	});

	function handleContentBlur() {
		isEditing = false;

		const content = textAreaEl?.value;
		if (!content) return;

		const updatedContent = content.replaceAll("\n", "<br />");

		taskActions.updateContent(task.id, updatedContent);
	}

	function handleKeypress(e: KeyboardEvent) {
		if ((e.key === "Enter" && !e.shiftKey) || e.key === "Escape") {
			textAreaEl?.blur();
		}
	}

	function handleOpenKeypress(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			handleFocus();
		}
	}

	let isDragging = false;
	let isEditing = false;

	function handleDragStart(e: DragEvent) {
		handleContentBlur();
		isDragging = true;
		isDraggingStore.set({ fromColumn: task.column });
		if (e.dataTransfer) {
			e.dataTransfer.setData("text/plain", task.id);
			e.dataTransfer.dropEffect = "move";
		}
	}

	function handleDragEnd() {
		isDragging = false;
		isDraggingStore.set(null);
	}

	let textAreaEl: HTMLTextAreaElement | undefined;

	function handleFocus(e?: MouseEvent) {
		const target = (e?.target || e?.currentTarget) as
			| HTMLElement
			| undefined;
		if (target?.tagName.toLowerCase() === "a") {
			return;
		}

		isEditing = true;

		setTimeout(() => {
			textAreaEl?.focus();
		}, 100);
	}

	$: mdContent = mdConverted.makeHtml(
		task.content + (task.blockLink ? ` ^${task.blockLink}` : ""),
	);

	$: {
		if (textAreaEl) {
			textAreaEl.style.height = `0px`;
			textAreaEl.style.height = `${textAreaEl.scrollHeight}px`;
		}
	}

	function onInput(e: Event & { currentTarget: HTMLTextAreaElement }) {
		e.currentTarget.style.height = `0px`;
		e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
	}

	$: shouldconsolidateTags = consolidateTags && task.tags.size > 0;

	function getPointsDifficulty(points: number | undefined): string {
		if (!points) return 'none';
		if (points < 50) return 'easy';
		if (points < 100) return 'medium';
		if (points < 200) return 'hard';
		if (points < 500) return 'epic';
		if (points < 1000) return 'legendary';
		return 'mythic';
	}

	$: pointsDifficulty = getPointsDifficulty(task.points);

	let isEditingPoints = false;
	let pointsInputEl: HTMLInputElement | undefined;
	let tempPoints = "";

	function handlePointsClick() {
		if (task.done) return; // Не редактируем для выполненных задач
		isEditingPoints = true;
		tempPoints = task.points !== undefined ? String(task.points) : "";
		setTimeout(() => {
			pointsInputEl?.focus();
			pointsInputEl?.select();
		}, 50);
	}

	function handlePointsBlur() {
		isEditingPoints = false;
		const newPoints = parseInt(tempPoints);
		if (!isNaN(newPoints) && newPoints > 0) {
			taskActions.updatePoints(task.id, newPoints);
		} else if (tempPoints === "" || isNaN(newPoints)) {
			taskActions.updatePoints(task.id, undefined);
		}
	}

	function handlePointsKeypress(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === "Escape") {
			pointsInputEl?.blur();
		}
	}
</script>

<div
	class="task"
	class:is-dragging={isDragging}
	role="group"
	draggable={!isEditing}
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
>
	<div class="task-header">
		<div 
			class="task-points" 
			class:done={task.done}
			class:empty={task.points === undefined}
			class:easy={pointsDifficulty === 'easy'}
			class:medium={pointsDifficulty === 'medium'}
			class:hard={pointsDifficulty === 'hard'}
			class:epic={pointsDifficulty === 'epic'}
			class:legendary={pointsDifficulty === 'legendary'}
			class:mythic={pointsDifficulty === 'mythic'}
			on:click={handlePointsClick}
			on:keypress={(e) => e.key === 'Enter' && handlePointsClick()}
			role="button"
			tabindex="0"
			title={task.points === undefined ? "Добавить баллы" : "Изменить баллы"}
		>
			<span class="points-icon">💰</span>
			{#if isEditingPoints}
				<input
					type="number"
					class="points-input"
					bind:this={pointsInputEl}
					bind:value={tempPoints}
					on:blur={handlePointsBlur}
					on:keypress={handlePointsKeypress}
					min="0"
					placeholder="0"
				/>
			{:else}
				<span class="points-value">{task.points ?? "?"}</span>
			{/if}
		</div>
		<div class="task-menu-wrapper">
			<TaskMenu {task} {taskActions} {columnTagTableStore} />
		</div>
	</div>
	<div class="task-body">
		<div class="task-content">
			{#if isEditing}
				<textarea
					class:editing={isEditing}
					bind:this={textAreaEl}
					on:keypress={handleKeypress}
					on:blur={handleContentBlur}
					on:input={onInput}
					value={task.content.replaceAll("<br />", "\n")}
				/>
			{:else}
				<div
					role="button"
					class="content-preview"
					on:mouseup={handleFocus}
					on:keypress={handleOpenKeypress}
					tabindex="0"
				>
					{@html mdContent}
				</div>
			{/if}
		</div>
	</div>
	{#if task.done && task.doneDate}
		<div class="task-done-date">
			<span class="done-checkmark">✅</span>
			<span class="done-date">{task.doneDate}</span>
		</div>
	{/if}
	{#if showFilepath}
		<div class="task-footer">
			<p>{task.path}</p>
		</div>
	{/if}
	{#if shouldconsolidateTags}
		<div class="task-tags">
			{#each task.tags as tag}
				<span>
					<!-- prettier-ignore -->
					<span class="cm-formatting cm-formatting-hashtag cm-hashtag cm-hashtag-begin cm-list-1">#</span><span
						class="cm-hashtag cm-hashtag-end cm-list-1">{tag}</span
					>
				</span>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.task {
		background-color: var(--background-secondary-alt);
		border-radius: var(--radius-m);
		border: var(--border-width) solid var(--background-modifier-border);
		cursor: grab;

	&.is-dragging {
		opacity: 0.15;
	}

	.task-header {
		padding: var(--size-4-2) var(--size-4-2) 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--size-4-2);

		.task-menu-wrapper {
			flex-shrink: 0;
		}
	}

	.task-body {
		padding: var(--size-4-2);

		p {
			word-break: break-word;
			margin: 0;
		}

		.task-content {
			display: grid;

			textarea {
				cursor: text;
				background-color: var(--color-base-25);
				width: 100%;
			}

			.content-preview {
				&:focus-within {
					box-shadow: 0 0 0 3px
						var(--background-modifier-border-focus);
				}
			}
		}
	}

	.task-points {
		display: flex;
		align-items: center;
		gap: var(--size-2-1);
		padding: var(--size-2-1) var(--size-4-2);
		color: var(--text-on-accent);
		border-radius: var(--radius-s);
		font-size: var(--font-ui-small);
		font-weight: var(--font-semibold);
		opacity: 0.9;
		transition: all 0.3s ease;
		cursor: pointer;
		user-select: none;

		&:hover:not(.done) {
			opacity: 1;
			transform: scale(1.05);
		}

		.points-icon {
			font-size: 0.9em;
		}

		.points-value {
			line-height: 1;
			min-width: 20px;
			text-align: center;
		}

		.points-input {
			width: 50px;
			background: rgba(255, 255, 255, 0.2);
			border: 1px solid rgba(255, 255, 255, 0.3);
			border-radius: var(--radius-s);
			color: var(--text-on-accent);
			font-size: var(--font-ui-small);
			font-weight: var(--font-semibold);
			padding: 2px 4px;
			text-align: center;
			outline: none;

			&:focus {
				background: rgba(255, 255, 255, 0.3);
				border-color: rgba(255, 255, 255, 0.5);
			}

			// Убираем стрелки у number input
			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}
			-moz-appearance: textfield;
		}

		// Пустое состояние - серый полупрозрачный
		&.empty {
			background-color: rgba(107, 114, 128, 0.5);
			border: 2px dashed rgba(107, 114, 128, 0.6);
		}

		// Серый - до 50 баллов (легко)
		&.easy {
			background-color: #6b7280;
		}

		// Зелёный - до 100 баллов (средне)
		&.medium {
			background-color: #10b981;
		}

		// Синий - до 200 баллов (сложно)
		&.hard {
			background-color: #3b82f6;
		}

		// Фиолетовый - до 500 баллов (эпично)
		&.epic {
			background-color: #8b5cf6;
			box-shadow: 0 0 12px rgba(139, 92, 246, 0.6), 0 0 24px rgba(139, 92, 246, 0.4);
		}

		// Оранжевый - до 1000 баллов (легендарно)
		&.legendary {
			background-color: #f59e0b;
			box-shadow: 0 0 15px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.45);
		}

		// Градиент - от 1000 баллов (мифически)
		&.mythic {
			background: linear-gradient(135deg, #0a0a0a, #1a1a1a, #fbbf24, #f59e0b, #1a1a1a, #0a0a0a);
			background-size: 200% 200%;
			animation: mythicGlow 4s ease-in-out infinite;
			box-shadow: 0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(245, 158, 11, 0.3);
			border: 1px solid rgba(251, 191, 36, 0.4);
		}

		&.done {
			background-color: var(--text-muted);
			opacity: 0.6;
			animation: none;
			box-shadow: none;
			border: none;
			cursor: default;
			
			&:hover {
				transform: none;
			}
		}
	}

	@keyframes mythicGlow {
		0% {
			background-position: 0% 50%;
			box-shadow: 0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(245, 158, 11, 0.3);
		}
		50% {
			background-position: 100% 50%;
			box-shadow: 0 0 20px rgba(251, 191, 36, 0.7), 0 0 40px rgba(245, 158, 11, 0.5);
		}
		100% {
			background-position: 0% 50%;
			box-shadow: 0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(245, 158, 11, 0.3);
		}
	}

	.task-done-date {
		display: flex;
		align-items: center;
		gap: var(--size-4-1);
		padding: 0 var(--size-4-2) var(--size-4-2);
		font-size: var(--font-ui-small);
		color: var(--text-muted);

		.done-checkmark {
			font-size: 1em;
		}

		.done-date {
			font-weight: var(--font-medium);
		}
	}

	.task-footer {
		border-top: var(--border-width) solid
			var(--background-modifier-border);
		padding: var(--size-4-2);
		padding-top: 0;

		p {
			margin: 0;
			font-size: var(--font-ui-smaller);
		}
	}

	.task-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--size-4-1) var(--size-2-1);
		padding: var(--size-4-2) var(--size-2-2);
		padding-top: 0;
	}
}

:global(.task-content *) {
	word-break: break-word;
	margin: 0;
}
</style>
