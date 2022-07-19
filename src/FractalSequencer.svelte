<script>
  import logo from './assets/svelte.png' // TODO - Change with Fractal Sequencer logo
  import * as Tone from 'tone'
  import Synth from './lib/Synth.svelte'
  import Sequencer from "./lib/Sequencer.svelte";

  let audioContextStartPromise;
  let started = false;

  async function startAudioContext() {
    return await Tone.start();
  }

  function startFractalSequencer() {
    audioContextStartPromise = startAudioContext();
  }
</script>

<main>

  <div class="center">
    <img src={logo} alt="Fractal Sequencer Logo" />

    <!-- AudioContext must be initialize by user interaction -->
    <button on:click={startFractalSequencer}>
      Start <!-- TODO - Change with better name -->
    </button>

    <!-- TODO - Change labels -->
    {#if audioContextStartPromise != null}
      {#await audioContextStartPromise}
        <p>Loading audio context...</p>
      {:then value}
        {started = true}
      {:catch error}
        <p>Audio context failed to start.</p>
      {/await}
    {/if}
  </div>

  <!-- <Synth />
  <Sequencer /> -->
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  }
  @keyframes gradient {
    0% { background-position: 0 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }

  :global(body), :global(html) {
    margin: 0;
  }

  main {
    text-align: center;
    margin: 0 auto;
    height: 100vh;
    background-image: radial-gradient(circle, #515151, #47464e, #3c3c4c, #313249, #232947, #1b2442, #13203e, #091b39,
    #0b1931, #0d1728, #0f1520, #0f1218);
  }

  .center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }

  img {
    height: 16rem;
    width: 16rem;
  }
</style>
