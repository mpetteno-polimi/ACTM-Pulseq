<script>
    import {synthStore} from '../stores.js';
    import * as Tone from "tone";

    synthStore.set({
        amSynth: new Tone.AMSynth({
            detune: 0,
            portamento: 0,
            harmonicity: 3,
            oscillator: {
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "sine",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            },
            envelope: {
                attack: 0.01,
                attackCurve: "linear",
                decay: 0.01,
                decayCurve: "exponential",
                release: 0.5,
                releaseCurve: "exponential",
                sustain: 1
            },
            modulation: {
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "square",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            },
            modulationEnvelope: {
                attack: 0.5,
                attackCurve: "linear",
                decay: 0,
                decayCurve: "exponential",
                release: 0.5,
                releaseCurve: "exponential",
                sustain: 1
            }
        }),
        duoSynth: new Tone.DuoSynth({
            detune: 0,
            portamento: 0,
            vibratoAmount: 0.5,
            vibratoRate: 5,
            harmonicity: 1.5,
            voice0: {
                envelope: {
                    attack: 0.01,
                    attackCurve: "linear",
                    decay: 0,
                    decayCurve: "exponential",
                    release: 0.5,
                    releaseCurve: "exponential",
                    sustain: 1
                },
                filter: {
                    Q: 1,
                    detune: 0,
                    frequency: 350,
                    gain: 0,
                    rolloff: -12,
                    type: "lowpass"
                },
                filterEnvelope: {
                    attack: 0.01,
                    attackCurve: "linear",
                    decay: 0,
                    decayCurve: "exponential",
                    release: 0.5,
                    releaseCurve: "exponential",
                    sustain: 1,
                    baseFrequency: 200,
                    exponent: 2,
                    octaves: 3
                },
                oscillator: {
                    detune: 0,
                    frequency: 440,
                    partialCount: 0,
                    partials: [],
                    phase: 0,
                    type: "sawtooth",
                    harmonicity: 1,
                    modulationIndex: 2,
                    modulationType: "square",
                    count: 3,
                    spread: 20,
                    width: 0.2,
                    modulationFrequency: 0.4
                }
            },
            voice1: {
                envelope: {
                    attack: 0.01,
                    attackCurve: "linear",
                    decay: 0,
                    decayCurve: "exponential",
                    release: 0.5,
                    releaseCurve: "exponential",
                    sustain: 1
                },
                filter: {
                    Q: 1,
                    detune: 0,
                    frequency: 350,
                    gain: 0,
                    rolloff: -12,
                    type: "lowpass"
                },
                filterEnvelope: {
                    attack: 0.01,
                    attackCurve: "linear",
                    decay: 0,
                    decayCurve: "exponential",
                    release: 0.5,
                    releaseCurve: "exponential",
                    sustain: 1,
                    baseFrequency: 200,
                    exponent: 2,
                    octaves: 3
                },
                oscillator: {
                    detune: 0,
                    frequency: 440,
                    partialCount: 0,
                    partials: [],
                    phase: 0,
                    type: "sawtooth",
                    harmonicity: 1,
                    modulationIndex: 2,
                    modulationType: "square",
                    count: 3,
                    spread: 20,
                    width: 0.2,
                    modulationFrequency: 0.4
                }
            }
        }),
        fmSynth: new Tone.FMSynth({
            detune: 0,
            portamento: 0,
            harmonicity: 3,
            oscillator: {
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "sine",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            },
            envelope: {
                attack: 0.01,
                attackCurve: "linear",
                decay: 0.01,
                decayCurve: "exponential",
                release: 0.5,
                releaseCurve: "exponential",
                sustain: 1
            },
            modulation: {
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "square",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            },
            modulationEnvelope: {
                attack: 0.5,
                attackCurve: "linear",
                decay: 0,
                decayCurve: "exponential",
                release: 0.5,
                releaseCurve: "exponential",
                sustain: 1
            },
            modulationIndex: 10
        }),
        membraneSynth: new Tone.MembraneSynth({
            detune: 0,
            portamento: 0,
            envelope: {
                attack: 0.001,
                attackCurve: "exponential",
                decay: 0.4,
                decayCurve: "exponential",
                release: 1.4,
                releaseCurve: "exponential",
                sustain: 0.01
            },
            oscillator: {
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "sine",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            },
            octaves: 10,
            pitchDecay: 0.05
        }),
        metalSynth: new Tone.MetalSynth({
            detune: 0,
            portamento: 0,
            envelope: {
                attack: 0.001,
                attackCurve: "linear",
                decay: 1.4,
                decayCurve: "exponential",
                release: 0.2,
                releaseCurve: "exponential",
                sustain: 0.5
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            octaves: 1.5,
            resonance: 4000
        }),
        monoSynth: new Tone.MonoSynth({
            detune: 0,
            portamento: 0,
            envelope: {
                attack: 0.005,
                attackCurve: "linear",
                decay: 0.1,
                decayCurve: "exponential",
                release: 1,
                releaseCurve: "exponential",
                sustain: 0.9
            },
            filter: {
                Q: 1,
                detune: 0,
                frequency: 350,
                gain: 0,
                rolloff: -12,
                type: "lowpass"
            },
            filterEnvelope: {
                attack: 0.6,
                attackCurve: "linear",
                decay: 0.2,
                decayCurve: "exponential",
                release: 2,
                releaseCurve: "exponential",
                sustain: 0.5,
                baseFrequency: 200,
                exponent: 2,
                octaves: 3
            },
            oscillator: {
                detune: 0,
                frequency: 440,
                partialCount: 0,
                partials: [],
                phase: 0,
                type: "sawtooth",
                harmonicity: 1,
                modulationIndex: 2,
                modulationType: "square",
                count: 3,
                spread: 20,
                width: 0.2,
                modulationFrequency: 0.4
            }
        }),
        noiseSynth: new Tone.NoiseSynth({
            envelope: {
                attack: 0.01,
                attackCurve: "linear",
                decay: 0.1,
                decayCurve: "exponential",
                release: 1,
                releaseCurve: "exponential",
                sustain: 0
            },
            noise: {
                fadeIn: 0,
                fadeOut: 0,
                playbackRate: 1,
                type: "white"
            }
        }),
        pluckSynth: new Tone.PluckSynth({
            attackNoise: 1,
            dampening: 4000,
            resonance: 0.7,
            release: 1
        })
    });

</script>
