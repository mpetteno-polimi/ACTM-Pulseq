<script>
    import * as Tone from 'tone'
    import Synth from './lib/Synth.svelte'
    import Sequencer from "./lib/Sequencer.svelte";
    import SplashScreen from "./lib/SplashScreen.svelte";
    import Effect from "./lib/Effect.svelte";

    let started = false;

    async function startAudioContext() {
        try {
            await Tone.start();
        } catch (error) {
        }
        started = true;
    }
</script>

<main>
    {#if !started}
        <SplashScreen on:interaction={startAudioContext} />
    {:else}
        <Synth/>
        <Effect/>
        <Sequencer/>
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
        overflow: hidden;
    }

    main {
        background: #444;
    }

</style>
