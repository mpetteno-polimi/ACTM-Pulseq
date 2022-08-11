<script>
    import {synthStore} from '../stores.js';
    import {effectStore} from '../stores.js';
    import {config} from "../config.js";
    import {onMount} from "svelte";
    import {fade} from 'svelte/transition';
    import * as Utilities from "../utilities.js";
    import * as Tone from "tone";
    import Knob from "./atoms/Knob.svelte";
    import Led from "./atoms/Led.svelte";

    /* ------------------------------------------- SYNTHS AND EFFECTS -------------------------------------------- */

    let effects;
    effectStore.subscribe(value => {
        effects = value;
    });
    let effectsList = Object.keys(effects).map(function(key) {
        return effects[key];
    });
    Tone.Transport.syncSignal(effects.delay.delayTime);

    let synths;
    synthStore.subscribe(value => {
        synths = value;
    });
    Object.keys(synths).forEach((key) => {
        synths[key].chain(...effectsList, Tone.Destination);
    })
    let currentSynth = synths[config.sequence.synth];

    /* --------------------------------------------- COMPONENTS PROPS --------------------------------------------- */

    function getKnobProps(id, label, values, initialValue) {
        let initialValueIndex = values.indexOf(initialValue);
        let minValueIndex = 0;
        let maxValueIndex = values.length - 1;
        return {
            id: id,
            label: label,
            numTicks: values.length - 1,
            valueIndex: initialValueIndex,
            minValueIndex: minValueIndex,
            maxValueIndex: maxValueIndex,
            values: values,
            degree: Utilities.convertRange(minValueIndex, maxValueIndex, config.ui.knobs.startAngle,
                config.ui.knobs.endAngle, initialValueIndex)
        }
    }

    /* ------ SEQUENCER NOTE KNOBS PROPS ------ */
    let noteKnobsProps = Utilities.getArray(config.sequence.stepNumber, (_, index) => {
        let initialSequence = config.sequence.steps;
        let initialScaleNotes = [""].concat(Utilities.getNotesForScale(config.sequence.controls.scale.init));
        let currentKnobInitialValue = initialSequence[index].note;
        return getKnobProps(index, "", initialScaleNotes, currentKnobInitialValue);
    });

    /* ------ SEQUENCER CONTROL KNOBS PROPS ------ */
    let sequencerControlKnobsProps = Object.keys(config.sequence.controls).map((controlKey, index) => {
        let currentKnobDefaults = config.sequence.controls[controlKey];
        return getKnobProps(index, currentKnobDefaults.label, currentKnobDefaults.values, currentKnobDefaults.init);
    });

    /* ------ FRACTAL KNOBS PROPS ------ */
    let fractalKnobsProps = Object.keys(config.tree.controls).map((controlKey, index) => {
        let currentKnobDefaults = config.tree.controls[controlKey];
        return getKnobProps(index, currentKnobDefaults.label, currentKnobDefaults.values, currentKnobDefaults.init);
    });

    /* ------ FRACTAL CONTROL KNOBS PROPS ------ */
    let fractalControlKnobsProps = Object.keys(config.effects).map((controlKey, index) => {
        let currentKnobDefaults = config.effects[controlKey];
        return getKnobProps(index, currentKnobDefaults.label, currentKnobDefaults.values, currentKnobDefaults.init);
    });

    /* ------ LEDs PROPS ------ */
    let ledsProps = Utilities.getArray(config.sequence.stepNumber, () => ({
        isBlinking: false,
        blinkDuration: config.ui.leds.minBlinkDuration
    }));

    function blinkLed(index, duration, time) {
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = true;
        }, time);
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = false;
        }, time + (duration < config.ui.leds.minBlinkDuration ? config.ui.leds.minBlinkDuration : duration));
    }

    /* --------------------------------------------- SEQUENCER MODES --------------------------------------------- */

    const MODES = {
        SEQUENCE_MODE: 0,
        GLOBAL_CONTROL_MODE: 1
    }

    const KNOBS_TYPE = {
        SEQUENCER_KNOBS: 0,
        FRACTAL_KNOBS: 1
    }

    const DEFAULT_MODE = MODES.SEQUENCE_MODE;
    let activeMode = DEFAULT_MODE;
    let sequencerKnobs = [noteKnobsProps, sequencerControlKnobsProps];
    let fractalKnobs = [fractalKnobsProps, fractalControlKnobsProps];
    let activeKnobs = [sequencerKnobs[DEFAULT_MODE], fractalKnobs[DEFAULT_MODE]];

    function resetPathKnob(newValue = fractalTree.height) {
        fractalKnobsProps[1] = getKnobProps(1, "path", Utilities.getRange(1, 2 ** newValue), 1);
        activeKnobs[KNOBS_TYPE.FRACTAL_KNOBS][1] = fractalKnobsProps[1];
    }

    function updateActiveKnobsProps(event, knobsType) {
        let targetKnobProps = activeKnobs[knobsType][event.detail.knobId];
        if (targetKnobProps) {
            targetKnobProps.valueIndex = event.detail.index;
            targetKnobProps.degree = event.detail.deg;
            targetKnobProps.selectedValue = event.detail.value;
        }
    }

    /* ---------------------------------------------- SEQUENCE ------------------------------------------------- */

    class SequenceStep {

        constructor(id, note = "", duration = config.sequence.defaultStepDuration,
                    velocity = Utilities.getRandom(config.sequence.minStepVelocity, 1), transpose = 0, slew = 0) {
            this.id = id;
            this.note = note;
            this.duration = duration;
            this.velocity = velocity;
            this.transpose = transpose;
            this.slew = slew;
        }

    }

    class Sequence {

        constructor(steps, state) {
            this.state = state;
            this.steps = steps;
            let timeDivision = Utilities.getSequenceSubdivisionForTimeDivision(this.state.timeDivision);
            this.sequence = new Tone.Sequence(this.onSequenceStep, this.steps, timeDivision);
        }

        onSequenceStep(time, step) {
            let note = Utilities.transposeNoteBySemitones(step.note, step.transpose);
            let duration = this.subdivision - (this.subdivision > config.sequence.stepDurationOffset
                ? config.sequence.stepDurationOffset : 0);
            let velocity = step.velocity;
            currentSynth.portamento = duration * step.slew;
            currentSynth.triggerAttackRelease(note, duration, time, velocity);
            blinkLed(step.id, duration, time);
        }

        start() {
            Tone.Transport.bpm.rampTo(this.state.tempo, 0.1);
            this.sequence.start(0);
        }

        stop() {
            this.sequence.stop();
        }

        changeScale(newScale) {
            let oldScaleNotes = this.state.scaleNotes;
            let newScaleNotes = [""].concat(Utilities.getNotesForScale(newScale));
            this.steps.forEach((step) => {
                let oldNoteIndex = oldScaleNotes.indexOf(step.note);
                let oldNoteMaxIndex = oldScaleNotes.length - 1;
                let newNoteIndex = Utilities.convertRange(0, oldNoteMaxIndex, 0, newScaleNotes.length - 1, oldNoteIndex);
                step.note = newScaleNotes[newNoteIndex];
            });
            return newScaleNotes;
        }

    }

    /* ----------------------------------------------- FRACTAL -------------------------------------------------- */

    class SequenceTree {

        constructor(trunkSequence = this.generateTrunkSequence(config.sequence)) {
            this.height = config.tree.controls.branches.init;
            this.trunkSequence = trunkSequence;
            this.root = null;
            this.paths = [];
            this.playingPath = -1;
            this.playingSequence = null;
            this.treeGenerator = new Worker(new URL('./workers/tree-generator.js', import.meta.url), {
                type: 'module'
            });
            this.treeGenerator.onmessage = (event) => {
                this.root = event.data[0];
                this.paths = event.data[1];
                this.stop();
                this.play();
            }
        }

        generateTrunkSequence(sequenceConfig) {
            let steps = sequenceConfig.steps.map((step, index) => {
                return new SequenceStep(index, step.note, step.duration);
            });
            let state = {
                length: sequenceConfig.controls.length.init,
                tempo: sequenceConfig.controls.tempo.init,
                scale: sequenceConfig.controls.scale.init,
                scaleNotes: [""].concat(Utilities.getNotesForScale(sequenceConfig.controls.scale.init)),
                order: sequenceConfig.controls.order.init,
                transpose: sequenceConfig.controls.transpose.init,
                timeDivision: sequenceConfig.controls.timeDivision.init,
                repeat: sequenceConfig.controls.repeat.init,
                slew: sequenceConfig.controls.slew.init
            }
            return new Sequence(steps, state);
        }

        regenerateTree() {
            this.treeGenerator.postMessage([this.height, this.trunkSequence.steps, this.trunkSequence.state]);
        }

        play(pathIndex = 1) {
            this.playingPath = pathIndex - 1;
            this.playingSequence = new Sequence(this.paths[this.playingPath], this.trunkSequence.state);
            this.playingSequence.start();
        }

        stop() {
            if (this.playingPath >= 0) {
                this.playingSequence.stop();
                this.playingSequence = null;
                this.playingPath = -1;
            }
        }

        changeSound(newSound) {
            currentSynth = synths[newSound];
        }

    }


    /* --------------------------------------------- EVENT HANDLERS --------------------------------------------- */

    const sequencerControlChangeHandlers = [
        handleSequenceLengthChange,
        handleSequenceTempoChange,
        handleSequenceScaleChange,
        handleSequenceOrderChange,
        handleSequenceTransposeChange,
        handleSequenceTimeDivisionChange,
        handleSequenceRepeatChange,
        handleSequenceSlewChange
    ]

    const fractalControlChangeHandlers = [
        handleFractalBranchesChange,
        handleFractalPathChange,
        handleFractalSoundChange
    ]

    function handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
                activeMode = MODES.GLOBAL_CONTROL_MODE;
                activeKnobs = [sequencerKnobs[MODES.GLOBAL_CONTROL_MODE], fractalKnobs[MODES.GLOBAL_CONTROL_MODE]];
                break;
            case "m":
                if (activeMode === MODES.GLOBAL_CONTROL_MODE) {
                    Utilities.toggleMasterMute();
                }
        }
    }

    function handleKeyUp(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
                activeMode = MODES.SEQUENCE_MODE;
                activeKnobs = [sequencerKnobs[MODES.SEQUENCE_MODE], fractalKnobs[MODES.SEQUENCE_MODE]];
                break;
        }
    }

    function handleBeforeUnload() {
        fractalTree.stop();
        Tone.Transport.stop();
    }

    function handleSequencerKnobValueChanged(event) {
        updateActiveKnobsProps(event, KNOBS_TYPE.SEQUENCER_KNOBS);
        switch (activeMode) {
            case MODES.SEQUENCE_MODE:
                fractalTree.trunkSequence.steps[event.detail.knobId].note = event.detail.value;
                resetPathKnob();
                break;
            case MODES.GLOBAL_CONTROL_MODE:
                sequencerControlChangeHandlers[event.detail.knobId](event.detail.value);
                break;
        }
        if (!event.detail.isOnMount) {
            fractalTree.regenerateTree();
        }
    }

    function handleFractalKnobValueChanged(event) {
        updateActiveKnobsProps(event, KNOBS_TYPE.FRACTAL_KNOBS);
        switch (activeMode) {
            case MODES.SEQUENCE_MODE:
                fractalControlChangeHandlers[event.detail.knobId](event.detail.value);
                break;
            case MODES.GLOBAL_CONTROL_MODE:
                effectsList[event.detail.knobId].wet.value = event.detail.value;
                break;
        }
    }

    function handleSequenceLengthChange(newValue) {
        fractalTree.trunkSequence.state.length = newValue;
    }

    function handleSequenceTempoChange(newValue) {
        fractalTree.trunkSequence.state.tempo = newValue;
    }

    function handleSequenceScaleChange(newValue) {
        let newScaleNotes = fractalTree.trunkSequence.changeScale(newValue);
        fractalTree.trunkSequence.state.scale = newValue;
        fractalTree.trunkSequence.state.scaleNotes = newScaleNotes;
        fractalTree.trunkSequence.steps.forEach((step, index) => {
            noteKnobsProps[index] = getKnobProps(index, "", newScaleNotes, step.note);
        });
    }

    function handleSequenceOrderChange(newValue) {
        fractalTree.trunkSequence.state.order = newValue;
    }

    function handleSequenceTransposeChange(newValue) {
        fractalTree.trunkSequence.state.transpose = newValue;
    }

    function handleSequenceTimeDivisionChange(newValue) {
        fractalTree.trunkSequence.state.timeDivision = newValue;
    }

    function handleSequenceRepeatChange(newValue) {
        fractalTree.trunkSequence.state.repeat = newValue;
    }

    function handleSequenceSlewChange(newValue) {
        fractalTree.trunkSequence.state.slew = newValue;
    }

    function handleFractalBranchesChange(newValue) {
        fractalTree.height = newValue;
        fractalTree.regenerateTree();
        resetPathKnob(newValue);
    }

    function handleFractalPathChange(newValue) {
        fractalTree.stop();
        fractalTree.play(newValue);
    }

    function handleFractalSoundChange(newValue) {
        fractalTree.changeSound(newValue);
    }

    /* --------------------------------------------- INITIALIZATION --------------------------------------------- */

    let fractalTree = new SequenceTree();

    onMount(() => {
        Tone.Transport.start();
        Tone.Destination.volume.value = -16;
        Tone.Destination.volume.rampTo(-3, config.ui.sequencer.transition.in.duration / 1000);
    });

</script>

<svelte:window on:keydown|preventDefault={handleKeyDown}
               on:keyup|preventDefault={handleKeyUp}
               on:beforeunload={handleBeforeUnload}/>

<fractal-sequencer in:fade={config.ui.sequencer.transition.in}>
    <sequencer>
        {#each activeKnobs[KNOBS_TYPE.SEQUENCER_KNOBS] as activeSequencerKnob, i}
            {#if i % 2 === 0}
                <sequencer-item class="even">
                    <Knob {...activeSequencerKnob} tooltipPosition="left"
                          on:knobValueChanged={handleSequencerKnobValueChanged}/>
                    <div class="line horizontal"></div>
                </sequencer-item>
                <sequencer-item class="even">
                    <Led bind:isBlinking={ledsProps[i].isBlinking}/>
                    <div class="line vertical"></div>
                </sequencer-item>
                <sequencer-item class="even"></sequencer-item>
            {:else}
                <sequencer-item class="odd"></sequencer-item>
                <sequencer-item class="odd">
                    {#if i !== config.sequence.stepNumber - 1}
                        <div class="line vertical"></div>
                    {/if}
                    <Led bind:isBlinking={ledsProps[i].isBlinking}/>
                </sequencer-item>
                <sequencer-item class="odd">
                    <div class="line horizontal"></div>
                    <Knob {...activeSequencerKnob} tooltipPosition="right"
                          on:knobValueChanged={handleSequencerKnobValueChanged}/>
                </sequencer-item>
            {/if}
        {/each}
    </sequencer>
    <fractal>
        {#each activeKnobs[KNOBS_TYPE.FRACTAL_KNOBS] as activeFractalKnob, i}
            <fractal-item>
                <Knob {...activeFractalKnob} tooltipPosition="right"
                      on:knobValueChanged={handleFractalKnobValueChanged}/>
            </fractal-item>
        {/each}
    </fractal>
</fractal-sequencer>


<style>

    fractal-sequencer {
        min-height: 100vh;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    sequencer {
        display: grid;
        grid-template-columns: 140px 50px 140px;
    }

    sequencer-item {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .line {
        position: absolute;
        border-radius: 50px;
    }

    sequencer-item.even .line.horizontal {
        left: 130px;
    }

    sequencer-item.odd .line.horizontal {
        right: 130px;
    }

    .line.horizontal {
        width: 15px;
        border-bottom: 3px solid azure;
    }

    .line.vertical {
        height: 40px;
        top: 60px;
        border-left: 3px solid azure;
    }

    fractal {
        margin: 0 100px;
        display: flex;
        flex-direction: column;
    }

    fractal-item {
        position: relative;
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        justify-content: center;
        margin: 30px 0;
    }

</style>
