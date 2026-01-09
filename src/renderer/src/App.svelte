<script lang="ts">
  import { onMount } from 'svelte'
  import ProblemList from './components/ProblemList.svelte'
  import ProblemDetail from './components/ProblemDetail.svelte'
  import StatsPanel from './components/StatsPanel.svelte'
  import ReviewModal from './components/ReviewModal.svelte'
  import ThemeToggle from './components/ThemeToggle.svelte'
  import {
    selectedProblem,
    todayReviews,
    loadProblems,
    loadTodayReviews,
    loadCategories
  } from './stores/problems'
  import { theme } from './stores/theme'
  import { loadStats } from './stores/stats'
  import type { Problem } from '../../preload/index.d'

  type Tab = 'problems' | 'stats'

  let activeTab = $state<Tab>('problems')
  let reviewModalOpen = $state(false)
  let reviewProblem = $state<Problem | null>(null)

  onMount(async () => {
    // Initialize theme
    await theme.init()

    // Load initial data
    await Promise.all([loadProblems(), loadTodayReviews(), loadCategories(), loadStats()])
  })

  function openReviewModal(problem: Problem): void {
    reviewProblem = problem
    reviewModalOpen = true
  }

  function closeReviewModal(): void {
    reviewModalOpen = false
    reviewProblem = null
  }
</script>

<div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <header
    class="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800
           bg-white dark:bg-gray-900"
    style="-webkit-app-region: drag"
  >
    <!-- Left side - drag region for macOS -->
    <div class="flex items-center gap-4">
      <div class="w-16"></div>
      <!-- Space for traffic lights on macOS -->
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        NeetCode Tracker
      </h1>
    </div>

    <!-- Right side - buttons (no drag) -->
    <div class="flex items-center gap-4" style="-webkit-app-region: no-drag">
      <!-- Today's due badge -->
      {#if $todayReviews.length > 0}
        <button
          onclick={() => {
            activeTab = 'problems'
          }}
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30
                 text-amber-700 dark:text-amber-300 text-sm font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          {$todayReviews.length} due today
        </button>
      {/if}

      <!-- Tab buttons -->
      <div class="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        <button
          onclick={() => (activeTab = 'problems')}
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                 {activeTab === 'problems'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}"
        >
          Problems
        </button>
        <button
          onclick={() => (activeTab = 'stats')}
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                 {activeTab === 'stats'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}"
        >
          Stats
        </button>
      </div>

      <ThemeToggle />
    </div>
  </header>

  <!-- Main content -->
  <main class="flex-1 flex overflow-hidden">
    {#if activeTab === 'problems'}
      <!-- Problem list (left panel) -->
      <aside
        class="w-96 flex-shrink-0 border-r border-gray-200 dark:border-gray-800
               bg-white dark:bg-gray-900"
      >
        <ProblemList />
      </aside>

      <!-- Problem detail (right panel) -->
      <section class="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
        <ProblemDetail problem={$selectedProblem} onStartReview={openReviewModal} />
      </section>
    {:else}
      <!-- Stats panel -->
      <section class="flex-1 bg-white dark:bg-gray-900 overflow-y-auto">
        <div class="max-w-3xl mx-auto">
          <StatsPanel />
        </div>
      </section>
    {/if}
  </main>

  <!-- Review Modal -->
  <ReviewModal problem={reviewProblem} isOpen={reviewModalOpen} onClose={closeReviewModal} />
</div>
