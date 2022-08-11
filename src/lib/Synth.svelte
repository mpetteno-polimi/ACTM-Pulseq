<script>
    import {synthStore} from '../stores.js';
    import * as Tone from "tone";

    synthStore.set({
        amSynth: new Tone.AMSynth(),
        duoSynth: new Tone.DuoSynth(),
        fmSynth: new Tone.FMSynth(),
        membraneSynth: new Tone.MembraneSynth(),
        metalSynth: new Tone.MetalSynth(),
        monoSynth: new Tone.MonoSynth(),
        noiseSynth: new Tone.MonoSynth(),
        pluckSynth: new Tone.MonoSynth()
    });
</script>
