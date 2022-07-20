<script>
  import { fade } from 'svelte/transition';
  import * as Tone from 'tone'
  import Synth from './lib/Synth.svelte'
  import Sequencer from "./lib/Sequencer.svelte";
  import Logo from "./lib/ui/Logo.svelte";

  let started = false;
  async function startAudioContext() {
    try {
      await Tone.start();
    } catch (error) {}
    started = true;
  }

</script>

<main>
  {#if !started}
    <div id="splash-screen" class="center"
         on:click={startAudioContext}
         on:keydown={startAudioContext}
         out:fade>
      <Logo />
      <p>Click anywhere or press a key to start</p>
    </div>
  {/if}

  {#if started}
    <div id="fractal-sequencer" class="center" in:fade>
      <Synth />
      <Sequencer />
    </div>
  {/if}
</main>

<style>
  :root {
    /* TODO - Check font */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
  }

  :global(body), :global(html) {
    margin: 0;
  }

  main {
    text-align: center;
    margin: 0 auto;
    width: 100vw;
    height: 100vh;
  }

  #splash-screen {
    background: black;
  }

  #fractal-sequencer {
    background: #444;
  }

  .center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }

  p {
    color: whitesmoke;
    margin: 30px 0;
  }

</style>
