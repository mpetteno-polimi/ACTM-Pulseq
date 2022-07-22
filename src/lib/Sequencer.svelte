<script>
  import { synthStore } from '../stores.js';
  import * as Tone from "tone";
  import Knob from "./ui/Knob.svelte";
  import Led from "./ui/Led.svelte";

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

<div id="sequencer">
  {#each Array(8) as _, i}
    {#if i % 2 === 0}
        <div class="sequencer-item even">
            <Knob tooltipPosition="left"/>
            <div class="horizontal-line"></div>
        </div>
        <div class="sequencer-item even">
            <Led />
            <div class="vertical-line"></div>
        </div>
        <div class="sequencer-item even"></div>
    {:else}
        <div class="sequencer-item odd"></div>
        <div class="sequencer-item odd">
            {#if i !== 7}
                <div class="vertical-line"></div>
            {/if}
            <Led />
        </div>
        <div class="sequencer-item odd">
            <div class="horizontal-line"></div>
            <Knob tooltipPosition="right"/>
        </div>
    {/if}
  {/each}
</div>

<button on:click={startSequence}>
  Loop start
</button>

<button on:click={stopSequence}>
  Loop stop
</button>

<style>

  #sequencer {
    display: grid;
    grid-template-columns: 140px 50px 140px;
  }

  .sequencer-item {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .sequencer-item.even .horizontal-line {
      left: 130px;
  }

  .sequencer-item.odd .horizontal-line {
      right: 130px;
  }

  .horizontal-line {
      position: absolute;
      border-bottom: 3px solid azure;
      border-radius: 50px;
      width: 15px;
  }

  .vertical-line {
      position: absolute;
      border-left: 3px solid azure;
      border-radius: 50px;
      height: 40px;
      top: 60px;
  }

</style>
