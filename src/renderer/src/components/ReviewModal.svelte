<script lang="ts">
  import type { Problem } from '../../../preload/index.d'
  import { submitReview, loadProblems, loadTodayReviews } from '../stores/problems'

  interface Props {
    problem: Problem | null
    isOpen: boolean
    onClose: () => void
  }

  let { problem, isOpen, onClose }: Props = $props()

  let selectedQuality: number | null = $state(null)
  let isSubmitting = $state(false)
  let result: { nextReviewDate?: string; interval?: number } | null = $state(null)

  const qualityOptions = [
    { value: 0, label: 'Again', description: 'Forgot completely', color: 'bg-red-500' },
    { value: 1, label: 'Hard', description: 'Difficult recall', color: 'bg-orange-500' },
    { value: 2, label: 'Good', description: 'Correct with effort', color: 'bg-blue-500' },
    { value: 3, label: 'Easy', description: 'Perfect recall', color: 'bg-green-500' }
  ]

  function reset(): void {
    selectedQuality = null
    result = null
    isSubmitting = false
  }

  function handleClose(): void {
    reset()
    onClose()
  }

  async function handleSubmit(): Promise<void> {
    if (selectedQuality === null || !problem) return

    isSubmitting = true
    try {
      const response = await submitReview(problem.id, selectedQuality)
      if (response.success) {
        result = {
          nextReviewDate: response.nextReviewDate,
          interval: response.newInterval
        }
        // Auto close after 1.5s
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      isSubmitting = false
    }
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      handleClose()
    }
    // Number keys for quick selection
    if (['1', '2', '3', '4'].includes(event.key)) {
      selectedQuality = parseInt(event.key) - 1
    }
    // Enter to submit
    if (event.key === 'Enter' && selectedQuality !== null) {
      handleSubmit()
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && problem}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Review
          </h2>
          <button
            onclick={handleClose}
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-5">
        {#if result}
          <!-- Success state -->
          <div class="text-center py-8">
            <div class="text-4xl mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400 mb-2">Next review:</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(result.nextReviewDate || '')}
              <span class="text-sm font-normal text-gray-500">
                ({result.interval} days)
              </span>
            </p>
          </div>
        {:else}
          <!-- Problem info -->
          <div class="mb-6">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              #{problem.neet_id} · {problem.difficulty}
            </p>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {problem.title}
            </h3>
            <a
              href={problem.neetcode_url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Open in NeetCode
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <!-- Quality options -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How was this review?
            </label>
            <div class="grid grid-cols-2 gap-3">
              {#each qualityOptions as option}
                <button
                  onclick={() => (selectedQuality = option.value)}
                  class="p-4 rounded-xl border-2 transition-all text-left
                         {selectedQuality === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-3 h-3 rounded-full {option.color}"></div>
                    <span class="font-semibold text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </button>
              {/each}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Tip: Press 1-4 to select, Enter to submit
            </p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if !result}
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onclick={handleClose} class="btn btn-secondary">
            Cancel
          </button>
          <button
            onclick={handleSubmit}
            disabled={selectedQuality === null || isSubmitting}
            class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
