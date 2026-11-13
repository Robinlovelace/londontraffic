<script lang="ts">
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  const ONBOARDING_KEY = "counterflow_onboarding_dismissed";
  const TOGGLE_HINT_KEY = "counterflow_toggle_hint_dismissed";
  const TOGGLE_HINT_TIMEOUT_MS = 8000;

  let { sidebar, main } = $props<{
    sidebar: import('svelte').Snippet;
    main: import('svelte').Snippet;
  }>();

  let isSidebarOpen = $state(true);
  let isMobile = $state(false);
  let showToggleHint = $state(false);
  let hintTimer: ReturnType<typeof setTimeout> | undefined;

  function toggleSidebar() {
    if (!isSidebarOpen && showToggleHint) {
      // They found the tab — no need to ever hint again.
      showToggleHint = false;
      clearTimeout(hintTimer);
      localStorage.setItem(TOGGLE_HINT_KEY, "1");
    }
    isSidebarOpen = !isSidebarOpen;
  }

  onMount(() => {
    isMobile = window.innerWidth < 768;
    if (isMobile) isSidebarOpen = false;

    if (
      isMobile &&
      !isSidebarOpen &&
      localStorage.getItem(ONBOARDING_KEY) !== "1" &&
      localStorage.getItem(TOGGLE_HINT_KEY) !== "1"
    ) {
      showToggleHint = true;
      // Timeout only hides for this session; the hint returns next visit
      // until the user actually opens the panel once.
      hintTimer = setTimeout(() => (showToggleHint = false), TOGGLE_HINT_TIMEOUT_MS);
    }

    const handleResize = () => {
      const currentlyMobile = window.innerWidth < 768;
      if (currentlyMobile !== isMobile) {
        isMobile = currentlyMobile;
        isSidebarOpen = !isMobile;
        if (!isMobile) showToggleHint = false;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(hintTimer);
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<div class="relative flex h-dvh w-full overflow-hidden bg-gray-50">
  <!-- Sidebar Container -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-[360px] max-w-[90vw] transition-all duration-300 ease-in-out md:relative md:flex-shrink-0
    {isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:-ml-[360px]'}"
  >
    <!-- Actual Sidebar Content -->
    <div class="relative flex h-full w-full flex-col border-r border-gray-200 bg-white shadow-xl md:shadow-none">
      <div class="h-full flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
        {@render sidebar()}
      </div>

      <!-- Attached Toggle Tab (Discrete & High Transparency) -->
      <button
        onclick={toggleSidebar}
        class="group absolute -right-8 top-1/2 z-10 flex h-16 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 shadow-sm transition-all focus:outline-none
        {showToggleHint && !isSidebarOpen
          ? 'toggle-hint-pulse border-blue-500/40 bg-blue-600/80 text-white'
          : 'border-black/10 bg-black/10 text-black/40 hover:bg-black/20 hover:text-black/60'}"
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {#if isSidebarOpen}
          <ChevronLeft size={20} strokeWidth={2.5} />
        {:else}
          <div class="relative flex items-center justify-center">
            <ChevronRight size={20} strokeWidth={2.5} />
            {#if !isMobile}
              <span class="absolute left-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] font-bold tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md">
                EXPAND PANEL
              </span>
            {/if}
          </div>
        {/if}
      </button>

      <!-- Mobile onboarding tooltip for the toggle tab -->
      {#if showToggleHint && !isSidebarOpen}
        <button
          transition:fade={{ duration: 300 }}
          onclick={toggleSidebar}
          class="toggle-hint-nudge absolute left-full top-1/2 z-10 ml-10 -translate-y-1/2 whitespace-nowrap rounded-full bg-gray-900/85 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm focus:outline-none"
        >
          <span aria-hidden="true" class="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900/85"></span>
          Tap to open panel
        </button>
      {/if}
    </div>
  </aside>

  <!-- Mobile Overlay -->
  {#if isSidebarOpen && isMobile}
    <div
      onclick={() => (isSidebarOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
      role="button"
      tabindex="0"
      class="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-[2px] md:hidden"
      aria-label="Close sidebar overlay"
    ></div>
  {/if}

  <!-- Main Content Area -->
  <main class="relative min-w-0 flex-1 overflow-hidden">
    {@render main()}
  </main>
</div>

<style>
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
  }

  /* iOS-style attention pulse on the sidebar toggle tab */
  .toggle-hint-pulse {
    animation: toggle-hint-pulse 1.8s ease-out infinite;
  }
  @keyframes toggle-hint-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
  }

  /* Gentle horizontal beckon towards the tab; keyframes carry the
     translateY(-50%) centering because animating transform would
     otherwise override the Tailwind translate utility */
  .toggle-hint-nudge {
    animation: toggle-hint-nudge 1.8s ease-in-out infinite;
  }
  @keyframes toggle-hint-nudge {
    0%,
    100% {
      transform: translate(0, -50%);
    }
    50% {
      transform: translate(4px, -50%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle-hint-pulse,
    .toggle-hint-nudge {
      animation: none;
    }
  }
</style>
