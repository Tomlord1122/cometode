<script lang="ts">
  import {
    problems,
    filters,
    categories,
    selectedProblem,
    isLoading,
    loadProblems
  } from '../stores/problems'
  import type { Problem } from '../../../preload/index.d'

  // Reactive filter updates - track filters to reload when they change
  $effect(() => {
    // Read filters to create dependency tracking and pass to loadProblems
    const currentFilters = $filters
    loadProblems(currentFilters)
  })

  function getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'badge-easy'
      case 'Medium':
        return 'badge-medium'
      case 'Hard':
        return 'badge-hard'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  type ProblemStatus = 'new' | 'practiced' | 'due' | 'mastered'

  function getProblemStatus(problem: Problem): ProblemStatus {
    if (problem.total_reviews === 0) return 'new'
    if (problem.next_review_date) {
      const today = new Date().toISOString().split('T')[0]
      if (problem.next_review_date <= today) return 'due'
    }
    if (problem.repetitions >= 3) return 'mastered'
    return 'practiced'
  }

  function handleSelect(problem: Problem): void {
    selectedProblem.set(problem)
  }

  function handleSearch(event: Event): void {
    const target = event.target as HTMLInputElement
    filters.update((f) => ({ ...f, searchText: target.value }))
  }

  function handleDifficultyFilter(difficulty: string): void {
    filters.update((f) => ({ ...f, difficulty: f.difficulty === difficulty ? '' : difficulty }))
  }

  function handleCategoryFilter(event: Event): void {
    const target = event.target as HTMLSelectElement
    filters.update((f) => ({ ...f, category: target.value }))
  }

  function toggleDueOnly(): void {
    filters.update((f) => ({ ...f, dueOnly: !f.dueOnly }))
  }
</script>

<div class="flex flex-col h-full">
  <!-- Search and filters -->
  <div class="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
    <!-- Search -->
    <input
      type="text"
      placeholder="Search problems..."
      value={$filters.searchText}
      oninput={handleSearch}
      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Difficulty filters -->
    <div class="flex gap-2">
      {#each ['Easy', 'Medium', 'Hard'] as diff}
        <button
          onclick={() => handleDifficultyFilter(diff)}
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 {$filters.difficulty === diff
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        >
          {diff}
        </button>
      {/each}

      <button
        onclick={toggleDueOnly}
        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-auto
               {$filters.dueOnly
          ? 'bg-amber-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
      >
        Due
      </button>
    </div>

    <!-- Category filter -->
    <select
      value={$filters.category}
      onchange={handleCategoryFilter}
      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All Categories</option>
      {#each $categories as category}
        <option value={category}>{category}</option>
      {/each}
    </select>
  </div>

  <!-- Problem list -->
  <div class="flex-1 overflow-y-auto">
    {#if $isLoading}
      <div class="flex items-center justify-center h-32">
        <div class="text-gray-500">Loading...</div>
      </div>
    {:else if $problems.length === 0}
      <div class="flex items-center justify-center h-32">
        <div class="text-gray-500">No problems found</div>
      </div>
    {:else}
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        {#each $problems as problem (problem.id)}
          <button
            onclick={() => handleSelect(problem)}
            class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50
                   transition-colors cursor-pointer
                   {$selectedProblem?.id === problem.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
          >
            <div class="flex items-center gap-3">
              <!-- Status icon -->
              <span class="w-5 h-5 flex-shrink-0">
                {#if getProblemStatus(problem) === 'new'}
                  <span class="block w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></span>
                {:else if getProblemStatus(problem) === 'due'}
                  <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                {:else}
                  <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                {/if}
              </span>

              <!-- Problem number -->
              <span class="text-gray-500 dark:text-gray-400 font-mono w-10">
                #{problem.neet_id}
              </span>

              <!-- Title -->
              <span class="flex-1 font-medium text-gray-900 dark:text-gray-100 truncate">
                {problem.title}
              </span>

              <!-- Difficulty badge -->
              <span
                class="px-2 py-0.5 rounded text-xs font-medium {getDifficultyClass(
                  problem.difficulty
                )}"
              >
                {problem.difficulty}
              </span>

              <!-- Review count -->
              {#if problem.total_reviews > 0}
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {problem.total_reviews}x
                </span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Footer with count -->
  <div
    class="px-4 py-2 border-t border-gray-200 dark:border-gray-700
              text-sm text-gray-500 dark:text-gray-400"
  >
    {$problems.length} problems
  </div>
</div>
