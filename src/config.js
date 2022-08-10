import * as Utilities from "./utilities.js";

export const config = {
    tree: {
        controls: {
            branches: {
                label: "branches",
                min: 0,
                max: 7,
                init: 0,
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            path: {
                label: "path",
                min: 1,
                get max() {
                    return 2**config.tree.controls.branches.init;
                },
                init: 1,
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            mutation: {
                label: "mutation",
                min: 0,
                max: 10,
                init: 0,
                get values() {
                    return Utilities.getArray(this.max - this.min + 1, (_, i) => i / 10);
                }
            }
        }
    },
    sequence: {
        stepNumber: 8,
        controls: {
            length: {
                label: "length",
                min: 1,
                get max() {
                    return config.sequence.stepNumber;
                },
                get init() {
                    return config.sequence.stepNumber;
                },
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            tempo: {
                label: "tempo",
                min: 30,
                max: 220,
                init: 120,
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            scale: {
                label: "scale",
                min: 30,
                max: 240,
                init: "major",
                values: ["chromatic", "major", "minor", "major pentatonic", "minor pentatonic", "harmonic minor",
                    "whole tone", "random"]
            },
            order: {
                label: "order",
                init: "forward",
                values: ["forward", "backward", "pendulum", "random"]
            },
            transpose: {
                label: "transpose",
                min: -24,
                max: 24,
                init: 0,
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            timeDivision: {
                label: "div/mult",
                min: 0,
                max: 8,
                init: 2**4,
                get values() {
                    return Utilities.getArray(this.max - this.min + 1, (_, i) => 2 ** i);
                }
            },
            repeat: {
                label: "repeat",
                min: 1,
                max: 8,
                init: 1,
                get values() {
                    return Utilities.getRange(this.min, this.max);
                }
            },
            slew: {
                label: "slew",
                min: 0,
                max: 10,
                init: 0,
                get values() {
                    return Utilities.getArray(this.max - this.min + 1, (_, i) => i / 10);
                }
            }
        },
        steps: Utilities.generateMelody("major", 8).map((note) => {
            return {
                note: note,
                duration: 1
            };
        }),
        synth: "fmSynth",
        stepDurationOffset: 0.1,
        defaultStepDuration: 1,
        minStepVelocity: 0.5
    },
    ui: {
        knobs: {
            startAngle: 45,
            endAngle: 315
        },
        leds: {
            minBlinkDuration: 0.2
        }
    }
}