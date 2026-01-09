<script lang="ts">
  import { stats, completionPercentage, loadStats } from '../stores/stats'
  import { loadProblems, loadTodayReviews } from '../stores/problems'
  import { onMount } from 'svelte'

  let showResetConfirm = $state(false)
  let isResetting = $state(false)

  onMount(() => {
    loadStats()
  })

  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Hard':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  async function handleReset(): Promise<void> {
    isResetting = true
    try {
      await window.api.resetAllProgress()
      // Reload all data
      await Promise.all([loadStats(), loadProblems(), loadTodayReviews()])
      showResetConfirm = false
    } catch (error) {
      console.error('Failed to reset progress:', error)
    } finally {
      isResetting = false
    }
  }
</script>

<div class="p-6 space-y-6">
  {#if $stats}
    <!-- Overview cards -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Progress circle -->
      <div class="card p-4 col-span-2">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          Overall Progress
        </h3>
        <div class="flex items-center justify-center">
          <div class="relative w-32 h-32">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <!-- Background circle -->
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                class="text-gray-200 dark:text-gray-700"
              />
              <!-- Progress circle -->
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                stroke-dasharray="{$completionPercentage * 2.64} 264"
                stroke-linecap="round"
                class="text-blue-500"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {$completionPercentage}%
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Practiced
              </span>
            </div>
          </div>
        </div>
        <div class="flex justify-center gap-6 mt-4 text-sm">
          <div class="text-center">
            <div class="font-semibold text-gray-900 dark:text-gray-100">
              {$stats.practiced}
            </div>
            <div class="text-gray-500 dark:text-gray-400">Practiced</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-gray-900 dark:text-gray-100">
              {$stats.total}
            </div>
            <div class="text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      <!-- Today's due -->
      <div class="card p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Due Today
        </h3>
        <div class="text-3xl font-bold text-amber-500">
          {$stats.todayDue}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          problems to review
        </div>
      </div>

      <!-- Total reviews -->
      <div class="card p-4">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Total Reviews
        </h3>
        <div class="text-3xl font-bold text-blue-500">
          {$stats.totalReviews}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          all time
        </div>
      </div>
    </div>

    <!-- By difficulty -->
    <div class="card p-4">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        By Difficulty
      </h3>
      <div class="space-y-3">
        {#each $stats.byDifficulty as item}
          {@const percentage = item.total > 0 ? Math.round((item.practiced / item.total) * 100) : 0}
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium text-gray-900 dark:text-gray-100">
                {item.difficulty}
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                {item.practiced}/{item.total}
              </span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full {getDifficultyColor(item.difficulty)} transition-all duration-500"
                style="width: {percentage}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Reset button -->
    <div class="card p-4">
      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Danger Zone
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Reset all learning progress. This will clear all review history and start fresh.
        Notes will be preserved.
      </p>
      {#if showResetConfirm}
        <div class="flex items-center gap-3">
          <span class="text-sm text-red-600 dark:text-red-400 font-medium">
            Are you sure?
          </span>
          <button
            onclick={handleReset}
            disabled={isResetting}
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white
                   hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Yes, Reset All'}
          </button>
          <button
            onclick={() => (showResetConfirm = false)}
            disabled={isResetting}
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700
                   text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      {:else}
        <button
          onclick={() => (showResetConfirm = true)}
          class="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 dark:border-red-700
                 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Reset All Progress
        </button>
      {/if}
    </div>
  {:else}
    <div class="flex items-center justify-center h-64">
      <div class="text-gray-500">Loading stats...</div>
    </div>
  {/if}
</div>
