<script>
    import {synthStore} from '../stores.js';
    import * as Tone from "tone";

    synthStore.set({
        fmSynth: new Tone.FMSynth().toDestination()
    });
</script>
