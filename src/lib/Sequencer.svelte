<script>
  import { synthStore } from '../stores.js';
  import * as Tone from "tone";

  // Get synth object from stores
  let synth;
  synthStore.subscribe(value => {
    synth = value;
  });

  function startSequence() {
    // play a note every quarter-note
    const loopA = new Tone.Loop(time => {
      synth.triggerAttackRelease("C2", "8n", time);
    }, "4n").start(0);
    // all loops start until the Transport is started
    Tone.Transport.start();
  }

  function stopSequence() {
    Tone.Transport.stop();
  }
</script>

<main>
  <button on:click={startSequence}>
    Loop start
  </button>

  <button on:click={stopSequence}>
    Loop stop
  </button>
</main>

<style>

</style>
