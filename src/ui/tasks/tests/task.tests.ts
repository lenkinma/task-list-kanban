import { describe, expect, it } from "vitest";
import { 
	isTrackedTaskString, 
	Task, 
	DEFAULT_DONE_STATUS_MARKERS, 
	DEFAULT_IGNORED_STATUS_MARKERS,
	validateDoneStatusMarkers, 
	createDoneStatusMarkers,
	validateIgnoredStatusMarkers,
	createIgnoredStatusMarkers
} from "../task";
import { type ColumnTag, type ColumnTagTable } from "src/ui/columns/columns";
import { kebab } from "src/parsing/kebab/kebab";

describe("Task", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: "column",
	};

	it("parses a basic task string", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.tags.has("tag")).toBeTruthy();
	});

	it("parses a basic task string with a column", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.column).toBe("column");
	});

	it("serialises a basic task string with a column", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
		}

		const output = task?.serialise();
		expect(taskString).toBe(output);
	});

	it("serialises a basic task string with a column and consolidate tags", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, true, "xX", "");
		}

		const output = task?.serialise();
		expect(taskString).toBe(output);
	});

	it("parses a task string with a block link", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column ^link-link";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.blockLink).toBe("link-link");
	});

	it("serialises a basic task string with a block link", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag ^link-link";
		if (isTrackedTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			task.column = "column" as ColumnTag;
		}

		const output = task?.serialise();
		expect("- [ ] Something #tag #column ^link-link").toBe(output);
	});

	describe("indented tasks", () => {
		it("parses a task string with space indentation", () => {
			let task: Task | undefined;
			const taskString = "  - [ ] Indented with 2 spaces #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.indentation).toBe("  ");
			expect(task?.content).toBe("Indented with 2 spaces #tag");
		});

		it("parses a task string with tab indentation", () => {
			let task: Task | undefined;
			const taskString = "\t- [ ] Indented with tab #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.indentation).toBe("\t");
			expect(task?.content).toBe("Indented with tab #tag");
		});

		it("parses a task string with mixed space and tab indentation", () => {
			let task: Task | undefined;
			const taskString = " \t - [ ] Mixed spaces and tabs #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.indentation).toBe(" \t ");
			expect(task?.content).toBe("Mixed spaces and tabs #tag");
		});

		it("parses a completed indented task string", () => {
			let task: Task | undefined;
			const taskString = "  - [x] Completed indented task #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.indentation).toBe("  ");
			expect(task?.done).toBe(true);
			expect(task?.content).toBe("Completed indented task #tag");
		});

		it("parses an indented task string with a block link", () => {
			let task: Task | undefined;
			const taskString = "\t- [ ] Indented with block link #tag ^block123";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.indentation).toBe("\t");
			expect(task?.blockLink).toBe("block123");
			expect(task?.content).toBe("Indented with block link #tag");
		});

		it("serialises an indented task string with spaces", () => {
			let task: Task | undefined;
			const taskString = "    - [ ] Four spaces #tag #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(taskString).toBe(output);
		});

		it("serialises an indented task string with tabs", () => {
			let task: Task | undefined;
			const taskString = "\t\t- [ ] Two tabs #tag #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(taskString).toBe(output);
		});

		it("serialises an indented task string with mixed indentation", () => {
			let task: Task | undefined;
			const taskString = "\t  \t- [ ] Tab space tab #tag #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(taskString).toBe(output);
		});
	});

	describe("customizable done status markers", () => {
		it("recognizes custom done status markers", () => {
			let task: Task | undefined;
			const taskString = "- [✓] Custom done marker #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX✓", "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.content).toBe("Custom done marker #tag");
		});

		it("does not recognize non-configured done status markers", () => {
			let task: Task | undefined;
			const taskString = "- [✓] Custom done marker #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, DEFAULT_DONE_STATUS_MARKERS, "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(false);
			expect(task?.content).toBe("Custom done marker #tag");
		});

		it("handles multi-codepoint unicode characters", () => {
			let task: Task | undefined;
			const taskString = "- [👍] Multi-codepoint emoji #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX👍", "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.content).toBe("Multi-codepoint emoji #tag");
		});

		it("recognizes checkmark ✅ as done status", () => {
			let task: Task | undefined;
			const taskString = "- [✅] Task with checkmark #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX✅", "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.content).toBe("Task with checkmark #tag");
		});

		describe("invalid status markers", () => {
			it("treats multi-character status as not done", () => {
				let task: Task | undefined;
				const taskString = "- [abc] Task with multi-char status #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});

			it("treats whitespace-only status as not done", () => {
				let task: Task | undefined;
				const taskString = "- [  ] Task with spaces #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});

			it("treats tab character as not done when not configured", () => {
				let task: Task | undefined;
				const taskString = "- [\t] Task with tab #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});

			it("treats unknown character as not done", () => {
				let task: Task | undefined;
				const taskString = "- [z] Task with unknown char #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});

			it("treats number as not done", () => {
				let task: Task | undefined;
				const taskString = "- [1] Task with number #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});
		});

		describe("case sensitivity", () => {
			it("respects case sensitivity in done markers", () => {
				let task: Task | undefined;
				const taskString = "- [X] Uppercase done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "x", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(false);
			});

			it("handles lowercase done markers", () => {
				let task: Task | undefined;
				const taskString = "- [x] Lowercase done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "x", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});
		});

		describe("special characters", () => {
			it("handles regex special characters in done markers", () => {
				let task: Task | undefined;
				const taskString = "- [*] Asterisk done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX*", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles plus character as done marker", () => {
				let task: Task | undefined;
				const taskString = "- [+] Plus done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX+", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles question mark as done marker", () => {
				let task: Task | undefined;
				const taskString = "- [?] Question mark done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX?", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles dot character as done marker", () => {
				let task: Task | undefined;
				const taskString = "- [.] Dot done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX.", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles backslash character as done marker", () => {
				let task: Task | undefined;
				const taskString = "- [\\] Backslash done marker #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX\\", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});
		});

		describe("unicode edge cases", () => {
			it("handles combining characters correctly", () => {
				let task: Task | undefined;
				const taskString = "- [é] Combining accent #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xXé", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles zero-width characters as invalid", () => {
				let task: Task | undefined;
				const taskString = "- [\u200B] Zero-width space #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX\u200B", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});

			it("handles surrogate pairs correctly", () => {
				let task: Task | undefined;
				const taskString = "- [🚀] Rocket emoji #tag";
				if (isTrackedTaskString(taskString)) {
					task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX🚀", "");
				}

				expect(task).toBeTruthy();
				expect(task?.done).toBe(true);
			});
		});
	});

	describe("obsidian links", () => {
		it("should not identify backlink as a task", () => {
			const backlink = "- [[x]]";
			expect(isTrackedTaskString(backlink)).toBe(false);
		});

		it("should not identify backlink with content as a task", () => {
			const backlink = "- [[x]] some content";
			expect(isTrackedTaskString(backlink)).toBe(false);
		});

		it("should not identify indented backlink as a task", () => {
			const backlink = "  - [[x]]";
			expect(isTrackedTaskString(backlink)).toBe(false);
		});

		it("should not identify a link as a task", () => {
			const notTask = "- [x](foo)";
			expect(isTrackedTaskString(notTask)).toBe(false);
		});
	});
});

describe("Ignored Status Markers", () => {
	describe("isTrackedTaskString with ignored status markers", () => {
		it("includes tasks with dash status by default (no ignored statuses)", () => {
			const taskString = "- [-] Task with dash status #tag";
			expect(isTrackedTaskString(taskString)).toBe(true);
		});

		it("excludes tasks with custom ignored status", () => {
			const taskString = "- [~] Custom ignored task #tag";
			expect(isTrackedTaskString(taskString, "~")).toBe(false);
		});

		it("excludes tasks when dash is configured as ignored", () => {
			const taskString = "- [-] Cancelled task #tag";
			expect(isTrackedTaskString(taskString, "-")).toBe(false);
		});

		it("includes tasks with non-ignored status", () => {
			const taskString = "- [ ] Regular task #tag";
			expect(isTrackedTaskString(taskString)).toBe(true);
		});

		it("includes tasks with done status", () => {
			const taskString = "- [x] Done task #tag";
			expect(isTrackedTaskString(taskString)).toBe(true);
		});

		it("excludes indented tasks with ignored status", () => {
			const taskString = "  - [-] Indented cancelled task #tag";
			expect(isTrackedTaskString(taskString, "-")).toBe(false);
		});

		it("excludes tasks with multiple ignored statuses", () => {
			const taskString1 = "- [-] Cancelled with dash #tag";
			const taskString2 = "- [~] Cancelled with tilde #tag";
			expect(isTrackedTaskString(taskString1, "-~")).toBe(false);
			expect(isTrackedTaskString(taskString2, "-~")).toBe(false);
		});

		it("excludes tasks with emoji ignored status", () => {
			const taskString = "- [❌] Cancelled with emoji #tag";
			expect(isTrackedTaskString(taskString, "❌")).toBe(false);
		});
	});
});

describe("Ignored Status Markers Validation", () => {
	describe("validateIgnoredStatusMarkers", () => {
		it("accepts valid marker strings", () => {
			expect(validateIgnoredStatusMarkers("-~")).toEqual([]);
			expect(validateIgnoredStatusMarkers("❌🚫")).toEqual([]);
			expect(validateIgnoredStatusMarkers("-")).toEqual([]);
			expect(validateIgnoredStatusMarkers("~")).toEqual([]);
		});

		it("accepts empty strings (no ignored statuses)", () => {
			expect(validateIgnoredStatusMarkers("")).toEqual([]);
		});

		it("rejects whitespace characters", () => {
			const errors = validateIgnoredStatusMarkers("- ");
			expect(errors).toContain("Marker at position 2 is whitespace");
		});

		it("rejects duplicate characters", () => {
			const errors = validateIgnoredStatusMarkers("--");
			expect(errors).toContain("Duplicate marker '-' at position 2");
		});

		it("handles Unicode emoji correctly", () => {
			expect(validateIgnoredStatusMarkers("❌🚫")).toEqual([]);
		});
	});

	describe("createIgnoredStatusMarkers", () => {
		it("creates valid markers successfully", () => {
			const markers = createIgnoredStatusMarkers("-~");
			expect(markers).toBe("-~");
		});

		it("creates empty markers successfully", () => {
			const markers = createIgnoredStatusMarkers("");
			expect(markers).toBe("");
		});

		it("throws with detailed error messages for invalid characters", () => {
			expect(() => createIgnoredStatusMarkers("- ")).toThrow(
				"Invalid ignored status markers: Marker at position 2 is whitespace"
			);
		});
	});

	describe("DEFAULT_IGNORED_STATUS_MARKERS", () => {
		it("is valid according to validation rules", () => {
			expect(validateIgnoredStatusMarkers(DEFAULT_IGNORED_STATUS_MARKERS)).toEqual([]);
		});

		it("is empty by default (no tasks ignored)", () => {
			expect(DEFAULT_IGNORED_STATUS_MARKERS).toBe("");
		});

		it("can be used to create validated markers", () => {
			expect(() => createIgnoredStatusMarkers(DEFAULT_IGNORED_STATUS_MARKERS)).not.toThrow();
		});
	});
});

describe("Done Status Markers Validation", () => {
	describe("validateDoneStatusMarkers", () => {
		it("accepts valid marker strings", () => {
			expect(validateDoneStatusMarkers("xX")).toEqual([]);
			expect(validateDoneStatusMarkers("✓✅👍")).toEqual([]);
			expect(validateDoneStatusMarkers("x")).toEqual([]);
			expect(validateDoneStatusMarkers("*+?")).toEqual([]);
		});

		it("rejects empty strings", () => {
			expect(validateDoneStatusMarkers("")).toEqual([
				"Done status markers cannot be empty"
			]);
			expect(validateDoneStatusMarkers("   ")).not.toEqual([]);
		});

		it("rejects whitespace characters", () => {
			const errors = validateDoneStatusMarkers("x X");
			expect(errors).toContain("Marker at position 2 is whitespace");
		});

		it("rejects newline characters", () => {
			const errors = validateDoneStatusMarkers("x\nX");
			expect(errors).toContain("Marker at position 2 is whitespace");
		});

		it("rejects tab characters", () => {
			const errors = validateDoneStatusMarkers("x\tX");
			expect(errors).toContain("Marker at position 2 is whitespace");
		});

		it("rejects control characters", () => {
			const errors = validateDoneStatusMarkers("x\u0001X");
			expect(errors).toContain("Marker at position 2 is a control character");
		});

		it("rejects duplicate characters", () => {
			const errors = validateDoneStatusMarkers("xXx");
			expect(errors).toContain("Duplicate marker 'x' at position 3");
		});

		it("handles Unicode emoji correctly", () => {
			expect(validateDoneStatusMarkers("🚀👍✅")).toEqual([]);
		});

		it("handles accented characters correctly", () => {
			expect(validateDoneStatusMarkers("éñü")).toEqual([]);
		});

		it("accumulates multiple errors", () => {
			const errors = validateDoneStatusMarkers("x x\tx");
			// Should find: space, duplicate 'x', tab (whitespace), tab (control char), final duplicate 'x'
			expect(errors.length).toBe(5);
			expect(errors).toContain("Marker at position 2 is whitespace");
			expect(errors).toContain("Duplicate marker 'x' at position 3");
		});
	});

	describe("createDoneStatusMarkers", () => {
		it("creates valid markers successfully", () => {
			const markers = createDoneStatusMarkers("xX✓");
			expect(markers).toBe("xX✓");
		});

		it("throws for invalid markers", () => {
			expect(() => createDoneStatusMarkers("")).toThrow(
				"Invalid done status markers: Done status markers cannot be empty"
			);
		});

		it("throws with detailed error messages", () => {
			expect(() => createDoneStatusMarkers("x x")).toThrow(
				"Invalid done status markers: Marker at position 2 is whitespace"
			);
		});

		it("throws with multiple error messages", () => {
			expect(() => createDoneStatusMarkers("x xx")).toThrow(/Multiple|whitespace|Duplicate/);
		});
	});

	describe("DEFAULT_DONE_STATUS_MARKERS", () => {
		it("is valid according to validation rules", () => {
			expect(validateDoneStatusMarkers(DEFAULT_DONE_STATUS_MARKERS)).toEqual([]);
		});

		it("contains expected default characters", () => {
			expect(DEFAULT_DONE_STATUS_MARKERS).toBe("xX");
		});

		it("can be used to create validated markers", () => {
			expect(() => createDoneStatusMarkers(DEFAULT_DONE_STATUS_MARKERS)).not.toThrow();
		});
	});
});

describe("Task archiving", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: "column",
	};

	describe("retains original done markers when archiving", () => {
		it("retains uppercase X marker when archiving", () => {
			let task: Task | undefined;
			const taskString = "- [X] Already done task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			expect(task?.serialise()).toBe("- [X] Already done task #archived");
		});

		it("retains lowercase x marker when archiving", () => {
			let task: Task | undefined;
			const taskString = "- [x] Already done task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			expect(task?.serialise()).toBe("- [x] Already done task #archived");
		});

		it("retains custom Unicode done marker when archiving", () => {
			let task: Task | undefined;
			const taskString = "- [✓] Custom done marker task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX✓", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			expect(task?.serialise()).toBe("- [✓] Custom done marker task #archived");
		});

		it("retains emoji done marker when archiving", () => {
			let task: Task | undefined;
			const taskString = "- [✅] Emoji done marker task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX✅", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			expect(task?.serialise()).toBe("- [✅] Emoji done marker task #archived");
		});
	});

	describe("applies default done marker when archiving incomplete tasks", () => {
		it("uses default 'x' marker when archiving incomplete task", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Incomplete task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			// Check that the output contains the done marker and archived tag
			// Note: We don't check the full string because the date will vary
			const output = task?.serialise();
			expect(output).toContain("- [x] Incomplete task");
			expect(output).toContain("✅ ");
			expect(output).toContain("#archived");
		});

		it("uses default 'x' marker when archiving task with unknown status", () => {
			let task: Task | undefined;
			const taskString = "- [?] Unknown status task #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBe("archived");
			// Check that the output contains the done marker and archived tag
			const output = task?.serialise();
			expect(output).toContain("- [x] Unknown status task");
			expect(output).toContain("✅ ");
			expect(output).toContain("#archived");
		});
	});
});

describe("Done date functionality (Tasks plugin format)", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: "column",
	};

	describe("parsing existing done dates", () => {
		it("parses done date from completed task", () => {
			let task: Task | undefined;
			const taskString = "- [x] Completed task ✅ 2025-10-02 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.content).toBe("Completed task");
			expect(task?.tags.has("tag")).toBe(true);
		});

		it("preserves done date when serializing", () => {
			let task: Task | undefined;
			const taskString = "- [x] Completed task ✅ 2025-10-02 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(output).toContain("✅ 2025-10-02");
			expect(output).toContain("Completed task");
		});

		it("handles done date without tags", () => {
			let task: Task | undefined;
			const taskString = "- [x] Completed task ✅ 2025-10-02";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.content).toBe("Completed task");
			const output = task?.serialise();
			expect(output).toContain("✅ 2025-10-02");
		});

		it("handles done date with column tag", () => {
			let task: Task | undefined;
			const taskString = "- [x] Completed task ✅ 2025-10-02 #tag #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.done).toBe(true);
			expect(task?.column).toBeUndefined(); // Done tasks don't have column
			const output = task?.serialise();
			expect(output).toContain("✅ 2025-10-02");
		});
	});

	describe("adding done date when marking task as done", () => {
		it("adds done date when setting done=true", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Incomplete task #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.done = true;
			}

			expect(task).toBeTruthy();
			const output = task?.serialise();
			expect(output).toContain("- [x] Incomplete task");
			expect(output).toContain("✅ ");
			expect(output).toMatch(/✅ \d{4}-\d{2}-\d{2}/);
		});

		it("does not overwrite existing done date", () => {
			let task: Task | undefined;
			const taskString = "- [x] Already done ✅ 2024-01-15 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(output).toContain("✅ 2024-01-15");
			expect(output).not.toMatch(/✅ 2025-/);
		});

		it("adds date when archiving incomplete task", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task to archive #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.archive();
			}

			expect(task).toBeTruthy();
			const output = task?.serialise();
			expect(output).toContain("- [x] Task to archive");
			expect(output).toContain("✅ ");
			expect(output).toMatch(/✅ \d{4}-\d{2}-\d{2}/);
			expect(output).toContain("#archived");
		});
	});

	describe("done date position in serialized output", () => {
		it("places done date after content but before tags", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task #tag #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.done = true;
			}

			const output = task?.serialise();
			expect(output).toMatch(/Task ✅ \d{4}-\d{2}-\d{2} #tag/);
		});

		it("places done date after content but before block link", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task #tag ^block123";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.done = true;
			}

			const output = task?.serialise();
			expect(output).toMatch(/Task ✅ \d{4}-\d{2}-\d{2} #tag \^block123/);
		});
	});
});

describe("Points system (Gamification)", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: "column",
	};

	describe("parsing points from task content", () => {
		it("parses points value from $N format", () => {
			let task: Task | undefined;
			const taskString = "- [ ] помыть посуду $5 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task).toBeTruthy();
			expect(task?.points).toBe(5);
			expect(task?.content).toBe("помыть посуду");
		});

		it("parses large point values", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Complete project $100";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(100);
			expect(task?.content).toBe("Complete project");
		});

		it("handles tasks without points", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Regular task #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBeUndefined();
			expect(task?.content).toBe("Regular task");
		});

		it("parses points with tags", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task with points $10 #work #important";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(10);
			expect(task?.tags.has("work")).toBe(true);
			expect(task?.tags.has("important")).toBe(true);
		});

		it("parses points with column tag", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task $20 #column";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(20);
			expect(task?.column).toBe("column");
		});
	});

	describe("serializing tasks with points", () => {
		it("includes points in serialized output", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task $15 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(output).toContain("$15");
			expect(output).toContain("Task");
		});

		it("preserves points when marking task as done", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Complete task $50 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.done = true;
			}

			const output = task?.serialise();
			expect(output).toContain("$50");
			expect(output).toContain("- [x]");
			expect(output).toMatch(/✅ \d{4}-\d{2}-\d{2}/);
		});

		it("places points after content but before done date", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task $25 #tag";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
				task.done = true;
			}

			const output = task?.serialise();
			expect(output).toMatch(/Task \$25 ✅ \d{4}-\d{2}-\d{2} #tag/);
		});

		it("does not add points marker when points are undefined", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task without points";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			const output = task?.serialise();
			expect(output).not.toContain("$");
		});
	});

	describe("edge cases", () => {
		it("handles dollar sign in middle of text", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Buy something $10";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(10);
			expect(task?.content).toBe("Buy something");
		});

		it("handles zero points", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Free task $0";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(0);
		});

		it("handles points with block link", () => {
			let task: Task | undefined;
			const taskString = "- [ ] Task $30 #tag ^block123";
			if (isTrackedTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false, "xX", "");
			}

			expect(task?.points).toBe(30);
			expect(task?.blockLink).toBe("block123");
			
			const output = task?.serialise();
			expect(output).toContain("$30");
			expect(output).toContain("^block123");
		});
	});
});
