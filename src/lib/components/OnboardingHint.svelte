<script lang="ts">
  import { X } from "lucide-svelte";

  const STORAGE_KEY = "counterflow_onboarding_dismissed";

  let { source } = $props<{ source: string }>();

  const stored = (get: boolean) => { try { return get ? localStorage.getItem(STORAGE_KEY) === "1" : (localStorage.setItem(STORAGE_KEY, "1"), true); } catch { return false; } };
  let dismissed = $state(typeof window !== "undefined" && stored(true));

  function dismiss() {
    dismissed = true;
    stored(false);
  }
</script>

{#if source && !dismissed}
  <button
    onclick={dismiss}
    class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex w-max max-w-[calc(100%-6rem)] items-center gap-1.5 rounded-xl bg-blue-600/90 px-3 py-1 text-left text-[11px] font-medium text-white shadow-lg backdrop-blur-sm"
  >
    <span>Zoom in, choose a layer in the panel, then click a point or road for details</span>
    <X size={12} />
  </button>
{/if}
