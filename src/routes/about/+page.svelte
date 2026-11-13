<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>About | London Traffic</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-6 py-6">
  <div class="mx-auto max-w-3xl space-y-4">
    <div class="space-y-1">
      <a href="{base}/" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← All regions</a>
      <h1 class="text-2xl font-bold text-gray-900">About these estimates</h1>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-sm text-gray-700 leading-relaxed">
      <p>
        This site shows modelled average annual daily traffic (AADT) estimates for
        <strong>cars</strong> and <strong>heavy vehicles</strong> (HGVs, buses and coaches) on every
        motor road link in England, split by Government Office Region. The estimates come from the
        <strong>Critical Safety Issues (CSIS) pipeline</strong>: an open, reproducible network
        modelling pipeline that assigns origin-destination demand to the road network with
        <a href="https://github.com/atfutures/netweld" class="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">netweld</a>,
        <a href="https://github.com/atf-lab/osmactive" class="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">osmactive</a>
        and a calibrated routing assignment, validated against DfT and council traffic counts.
      </p>

      <div>
        <h2 class="text-base font-semibold text-gray-900">What the numbers mean</h2>
        <ul class="mt-1.5 list-disc space-y-1 pl-5">
          <li>Values are <strong>modelled estimates of vehicles per day</strong>, not observed counts. Popups show the two-way total; the map colours each carriageway separately.</li>
          <li>Cars include cars, taxis and light vans assigned by the model. Heavy vehicles are HGVs, buses and coaches, bigger than vans.</li>
          <li>The colour ramp thresholds are mode-specific: heavy vehicle volumes are much lower than car volumes on most roads.</li>
        </ul>
      </div>

      <div>
        <h2 class="text-base font-semibold text-gray-900">Sources and licences</h2>
        <ul class="mt-1.5 list-disc space-y-1 pl-5">
          <li>Street network and road attributes: <strong>OpenStreetMap</strong> contributors, ODbL-1.0.</li>
          <li>Road hierarchy: <strong>OS Open Roads</strong>, OGL-UK-3.0.</li>
          <li>Model calibration: DfT traffic counts under OGL-UK-3.0 and council counter data.</li>
        </ul>
      </div>

      <div>
        <h2 class="text-base font-semibold text-gray-900">Caveats</h2>
        <ul class="mt-1.5 list-disc space-y-1 pl-5">
          <li>Estimates are as good as the open demand data and network attributes behind them; expect uncertainty on minor roads and at region edges.</li>
          <li>This is a demonstration of the national traffic-estimate layer. The full CSIS pipeline also estimates walking and cycling volumes and flags safety issues.</li>
          <li>Data vintage and build date are shown in the map's info (ⓘ) button.</li>
        </ul>
      </div>

      <p class="border-t border-gray-100 pt-3 text-xs text-gray-400">
        Built by Robin Lovelace and team at the
        <a href="https://www.leeds.ac.uk" target="_blank" rel="noopener noreferrer" class="hover:underline">University of Leeds</a>.
        App code: a slimmed-down subset of the
        <a href="https://github.com/Robinlovelace/csis-dashboard" target="_blank" rel="noopener noreferrer" class="hover:underline">csis-dashboard</a> codebase.
      </p>
    </div>
  </div>
</div>
