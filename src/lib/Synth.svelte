<script>
    import { synthStore } from '../stores.js';
    import * as Tone from "tone";

    function init() {
        synthStore.set(new Tone.FMSynth().toDestination());
    }

    init();
</script>
