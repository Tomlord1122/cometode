<script lang="ts">
  import type { Problem } from '../../../preload/index.d'
  import { updateNote, startProblem } from '../stores/problems'

  interface Props {
    problem: Problem | null
    onStartReview: (problem: Problem) => void
  }

  let { problem, onStartReview }: Props = $props()

  let isEditingNote = $state(false)
  let noteContent = $state('')
  let isSavingNote = $state(false)

  $effect(() => {
    if (problem) {
      noteContent = problem.notes || ''
      isEditingNote = false
    }
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

  function parseCategories(categoriesJson: string): string[] {
    try {
      return JSON.parse(categoriesJson)
    } catch {
      return []
    }
  }

  function parseTags(tagsJson: string): string[] {
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function isReviewDue(nextReviewDate: string | null): boolean {
    if (!nextReviewDate) return false
    const today = new Date().toISOString().split('T')[0]
    return nextReviewDate <= today
  }

  async function handleOpenProblem(): Promise<void> {
    if (problem) {
      await startProblem(problem.id)
    }
  }

  async function handleSaveNote(): Promise<void> {
    if (!problem) return
    isSavingNote = true
    try {
      await updateNote(problem.id, noteContent)
      isEditingNote = false
    } finally {
      isSavingNote = false
    }
  }

  function handleCancelNote(): void {
    noteContent = problem?.notes || ''
    isEditingNote = false
  }
</script>

{#if problem}
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            #{problem.neet_id}
          </p>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {problem.title}
          </h1>
        </div>
        <span class="px-3 py-1 rounded-lg text-sm font-medium {getDifficultyClass(problem.difficulty)}">
          {problem.difficulty}
        </span>
      </div>

      <!-- Categories and tags -->
      <div class="flex flex-wrap gap-2 mb-4">
        {#each parseCategories(problem.categories) as category}
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
            {category}
          </span>
        {/each}
        {#each parseTags(problem.tags) as tag}
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
            {tag}
          </span>
        {/each}
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3">
        <a
          href={problem.neetcode_url}
          target="_blank"
          rel="noopener noreferrer"
          onclick={handleOpenProblem}
          class="btn btn-primary flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          NeetCode
        </a>
        <a
          href={problem.leetcode_url}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          LeetCode
        </a>

        {#if problem.total_reviews > 0}
          <button
            onclick={() => onStartReview(problem)}
            class="btn {isReviewDue(problem.next_review_date)
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'btn-secondary'}"
          >
            {isReviewDue(problem.next_review_date) ? 'Review Now' : 'Record Review'}
          </button>
        {:else}
          <button onclick={() => onStartReview(problem)} class="btn btn-secondary">
            Start Practice
          </button>
        {/if}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Progress info -->
      <div class="card p-4">
        <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Learning Progress
        </h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {problem.total_reviews}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Reviews</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {problem.interval}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Interval (days)</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {problem.ease_factor.toFixed(2)}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Ease Factor</div>
          </div>
        </div>
        {#if problem.next_review_date}
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Next review: </span>
            <span class="font-medium {isReviewDue(problem.next_review_date) ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100'}">
              {formatDate(problem.next_review_date)}
              {#if isReviewDue(problem.next_review_date)}
                (Due!)
              {/if}
            </span>
          </div>
        {/if}
      </div>

      <!-- Notes -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Notes
          </h2>
          {#if !isEditingNote}
            <button
              onclick={() => (isEditingNote = true)}
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {problem.notes ? 'Edit' : 'Add Note'}
            </button>
          {/if}
        </div>

        {#if isEditingNote}
          <textarea
            bind:value={noteContent}
            placeholder="Write your notes here... (Markdown supported)"
            class="w-full h-40 p-3 rounded-lg border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
          <div class="flex justify-end gap-2 mt-3">
            <button onclick={handleCancelNote} class="btn btn-secondary text-sm">
              Cancel
            </button>
            <button
              onclick={handleSaveNote}
              disabled={isSavingNote}
              class="btn btn-primary text-sm disabled:opacity-50"
            >
              {isSavingNote ? 'Saving...' : 'Save'}
            </button>
          </div>
        {:else if problem.notes}
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{problem.notes}</pre>
          </div>
        {:else}
          <p class="text-sm text-gray-500 dark:text-gray-400 italic">
            No notes yet. Click "Add Note" to add your thoughts.
          </p>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center h-full">
    <div class="text-center text-gray-500 dark:text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>Select a problem to view details</p>
    </div>
  </div>
{/if}
