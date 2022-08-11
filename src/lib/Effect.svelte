<script>
    import {effectStore} from '../stores.js';
    import {config} from "../config.js";
    import * as Tone from "tone";

    effectStore.set({
        distortion: new Tone.Distortion({
            distortion: 0.5,
            oversample: "none",
            wet: config.effects.distortion.init
        }),
        reverb: new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.01,
            wet: config.effects.reverb.init
        }),
        delay: new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.5,
            maxDelay: 1,
            wet: config.effects.delay.init
        })
    });
</script>