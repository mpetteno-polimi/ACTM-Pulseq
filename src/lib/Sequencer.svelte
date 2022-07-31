<script>
    import {synthStore} from '../stores.js';
    import {onMount} from "svelte";
    import * as Utilities from "../utilities.js";
    import * as Tone from "tone";
    import Knob from "./atoms/Knob.svelte";
    import Led from "./atoms/Led.svelte";

    /* --------------------------------------------- GLOBAL VARIABLES --------------------------------------------- */

    const STEP_NUMBER = 8;
    const VELOCITY_MIN = 0.5    ;
    const STEP_DURATION_OFFSET = 0.1;

    /* -- Get synth object from stores -- */
    let synth;
    synthStore.subscribe(value => {
        synth = value;
    });

    /* --------------------------------------------- COMPONENTS PROPS --------------------------------------------- */

    const KNOBS_START_ANGLE = 45;
    const KNOBS_END_ANGLE = 315;
    const CONTROL_KNOBS_DEFAULTS = [
        {
            label: "length",
            minLengthValue: 1,
            maxLengthValue: STEP_NUMBER,
            initialValue: 8,
            get values() {
                return Utilities.getRange(this.minLengthValue, this.maxLengthValue);
            },
            valueChangedHandler: handleSequenceLengthChange
        },
        {
            label: "tempo",
            minBpmValue: 30,
            maxBpmValue: 240,
            initialValue: 120,
            get values() {
                return Utilities.getRange(this.minBpmValue, this.maxBpmValue);
            },
            valueChangedHandler: handleSequenceTempoChange
        },
        {
            label: "scale",
            initialValue: "major",
            values: ["chromatic", "major", "minor", "major pentatonic", "minor pentatonic", "harmonic minor",
                "whole tone", "random"],
            valueChangedHandler: handleSequenceScaleChange
        },
        {
            label: "order",
            initialValue: "forward",
            values: ["forward", "backward", "pendulum", "random"],
            valueChangedHandler: handleSequenceOrderChange
        },
        {
            label: "transpose",
            minTrasposeValue: -24,
            maxTrasposeValue: 24,
            initialValue: 0,
            get values() {
                return Utilities.getRange(this.minTrasposeValue, this.maxTrasposeValue);
            },
            valueChangedHandler: handleSequenceTransposeChange
        },
        {
            label: "div/mult",
            minTimeDivisionValue: 0,
            maxTimeDivisionValue: 8,
            initialValue: 8,
            get values() {
                return Utilities.getArray(this.maxTimeDivisionValue - this.minTimeDivisionValue + 1, (_, i) => 2 ** i);
            },
            valueChangedHandler: handleSequenceTimeDivisionChange
        },
        {
            label: "repeat",
            minRepeatValue: 1,
            maxRepeatValue: 8,
            initialValue: 1,
            get values() {
                return Utilities.getRange(this.minRepeatValue, this.maxRepeatValue);
            },
            valueChangedHandler: handleSequenceRepeatChange
        },
        {
            label: "slew",
            minSlewValue: 0,
            maxSlewValue: 10,
            initialValue: 0,
            get values() {
                return Utilities.getArray(this.maxSlewValue - this.minSlewValue + 1, (_, i) => i / 10);
            },
            valueChangedHandler: handleSequenceSlewChange
        }
    ]
    const NOTE_KNOBS_DEFAULTS = {
        values: [""].concat(Utilities.getNotesForScale(CONTROL_KNOBS_DEFAULTS[2].initialValue)),
        initialSequence: Utilities.generateMelody(CONTROL_KNOBS_DEFAULTS[2].initialValue, STEP_NUMBER),
    }

    function getDefaultKnobProps(id, label, values, initialValue) {
        let initialValueIndex = values.indexOf(initialValue);
        let minValueIndex = 0;
        let maxValueIndex = values.length - 1;
        return {
            id: id,
            label: label,
            numTicks: values.length,
            valueIndex: initialValueIndex,
            minValueIndex: minValueIndex,
            maxValueIndex: maxValueIndex,
            values: values,
            degree: Utilities.convertRange(minValueIndex, maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                initialValueIndex)
        }
    }

    /* ------ NOTE KNOBS PROPS ------ */
    let noteKnobs = Utilities.getArray(STEP_NUMBER, (_, index) => {
        let initialSequence = NOTE_KNOBS_DEFAULTS.initialSequence;
        let currentKnobInitialValue = NOTE_KNOBS_DEFAULTS.values[initialSequence[index]];
        return getDefaultKnobProps(index, "", NOTE_KNOBS_DEFAULTS.values, currentKnobInitialValue);
    });

    /* ------ CONTROL KNOBS PROPS ------ */
    let controlKnobsProps = Utilities.getArray(STEP_NUMBER, (_, index) => {
        let currentKnobDefaults = CONTROL_KNOBS_DEFAULTS[index];
        return getDefaultKnobProps(index, currentKnobDefaults.label, currentKnobDefaults.values,
            currentKnobDefaults.initialValue);
    });

    /* ------ LEDs PROPS ------ */
    const MIN_BLINK_DURATION = 0.2;
    let ledsProps = Utilities.getArray(STEP_NUMBER, () => ({isBlinking: false, blinkDuration: MIN_BLINK_DURATION}));

    function blinkLed(index, duration, time) {
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = true;
        }, time);
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = false;
        }, time + (duration < MIN_BLINK_DURATION ? MIN_BLINK_DURATION : duration));
    }

    /* --------------------------------------------- SEQUENCER MODES --------------------------------------------- */

    const MODES = {
        SEQUENCE_MODE: 0,
        GLOBAL_CONTROL_MODE: 1
    }
    const DEFAULT_MODE = MODES.SEQUENCE_MODE;
    let activeMode = DEFAULT_MODE;
    let knobsMatrix = [noteKnobs, controlKnobsProps];
    let activeKnobs = knobsMatrix[DEFAULT_MODE];

    function updateActiveKnobsProps(event) {
        let targetKnobProps = activeKnobs[event.detail.knobId];
        targetKnobProps.valueIndex = event.detail.index;
        targetKnobProps.degree = event.detail.deg;
        targetKnobProps.selectedValue = event.detail.value;
    }

    /* --------------------------------------------- SEQUENCER STATE --------------------------------------------- */

    const DEFAULT_STEP_DURATION = 1;
    let sequence;
    let sequenceState = {
        length: CONTROL_KNOBS_DEFAULTS[0].initialValue,
        tempo: CONTROL_KNOBS_DEFAULTS[1].initialValue,
        scale: CONTROL_KNOBS_DEFAULTS[2].initialValue,
        order: CONTROL_KNOBS_DEFAULTS[3].initialValue,
        transpose: CONTROL_KNOBS_DEFAULTS[4].initialValue,
        timeDivision: CONTROL_KNOBS_DEFAULTS[5].initialValue,
        repeat: CONTROL_KNOBS_DEFAULTS[6].initialValue,
        slew: CONTROL_KNOBS_DEFAULTS[7].initialValue
    };
    let steps = Utilities.getArray(CONTROL_KNOBS_DEFAULTS[0].initialValue, (step, index) => (
        {
            id: index,
            note: "",
            duration: DEFAULT_STEP_DURATION
        }
    ));

    function startSequence() {
        sequence.start(0);
        Tone.Transport.bpm.value = sequenceState.tempo;
        Tone.Transport.start();
    }

    function updateSequence() {
        sequence.events = getStepsForCurrentState();
    }

    function stopSequence() {
        sequence.stop();
        Tone.Transport.stop();
    }

    function onSequenceStep(time, step) {
        let note = Utilities.transposeNoteBySemitones(step.note, sequenceState.transpose);
        let duration = sequence.subdivision - (sequence.subdivision > STEP_DURATION_OFFSET ? STEP_DURATION_OFFSET : 0);
        let velocity = Utilities.getRandom(VELOCITY_MIN, 1);
        synth.portamento = duration * sequenceState.slew;
        synth.triggerAttackRelease(note, duration, time, velocity);
        blinkLed(step.id, duration, time);
    }

    function getStepsForCurrentState() {
        let newSteps = [...steps].slice(0, sequenceState.length);
        switch (sequenceState.order) {
            case "forward":
                break;
            case "backward":
                newSteps.reverse();
                break;
            case "pendulum":
                let pendulumSteps = [...newSteps].slice(1, sequenceState.length - 1).reverse();
                newSteps = newSteps.concat(pendulumSteps);
                break;
            case "random":
                Utilities.shuffleArray(newSteps);
                break;
        }
        return Utilities.repeatElements(newSteps, sequenceState.repeat);
    }

    function updateNoteKnobsAndSequenceSteps(newScaleNotes) {
        for (let i = 0; i < STEP_NUMBER; i++) {
            let oldNoteIndex = noteKnobs[i].valueIndex;
            let oldNoteMaxIndex = noteKnobs[i].maxValueIndex;
            let newNoteValues = [""].concat(newScaleNotes);
            let newNoteIndex = Utilities.convertRange(0, oldNoteMaxIndex, 0, newScaleNotes.length, oldNoteIndex);
            let newStepNote = newNoteValues[newNoteIndex];
            noteKnobs[i] = getDefaultKnobProps(i, "", newNoteValues, newStepNote);
            steps[i].note = newStepNote;
        }
    }

    /* --------------------------------------------- EVENT HANDLERS --------------------------------------------- */

    function handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
                activeMode = MODES.GLOBAL_CONTROL_MODE;
                activeKnobs = knobsMatrix[MODES.GLOBAL_CONTROL_MODE];
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
                activeKnobs = knobsMatrix[MODES.SEQUENCE_MODE];
                break;
        }
    }

    function handleBeforeUnload(event) {
        stopSequence();
    }

    function handleKnobValueChanged(event) {
        updateActiveKnobsProps(event);
        switch (activeMode) {
            case MODES.SEQUENCE_MODE:
                steps[event.detail.knobId].note = event.detail.value;
                break;
            case MODES.GLOBAL_CONTROL_MODE:
                CONTROL_KNOBS_DEFAULTS[event.detail.knobId].valueChangedHandler(event.detail.value);
                break;
        }
    }

    function handleSequenceLengthChange(newValue) {
        sequenceState.length = newValue;
        updateSequence();
    }

    function handleSequenceTempoChange(newValue) {
        sequenceState.tempo = newValue;
        Tone.Transport.bpm.value = newValue;
    }

    function handleSequenceScaleChange(newValue) {
        sequenceState.scale = newValue;
        let newScaleNotes = Utilities.getNotesForScale(newValue);
        updateNoteKnobsAndSequenceSteps(newScaleNotes);
    }

    function handleSequenceOrderChange(newValue) {
        sequenceState.order = newValue;
        updateSequence();
    }

    function handleSequenceTransposeChange(newValue) {
        sequenceState.transpose = newValue;
    }

    function handleSequenceTimeDivisionChange(newValue) {
        sequenceState.timeDivision = newValue;
        let newSubdivision = Utilities.getSequenceSubdivisionForTimeDivision(newValue);
        sequence.stop();
        sequence = new Tone.Sequence(onSequenceStep, getStepsForCurrentState(), newSubdivision);
        sequence.start();
    }

    function handleSequenceRepeatChange(newValue) {
        sequenceState.repeat = newValue;
        updateSequence();
    }

    function handleSequenceSlewChange(newValue) {
        sequenceState.slew = newValue;
    }

    onMount(() => {
        let initialTimeDivision = Utilities.getSequenceSubdivisionForTimeDivision(sequenceState.timeDivision);
        sequence = new Tone.Sequence(onSequenceStep, steps, initialTimeDivision);
        startSequence();
    });

</script>

<svelte:window on:keydown|preventDefault={handleKeyDown}
               on:keyup|preventDefault={handleKeyUp}
               on:beforeunload={handleBeforeUnload}/>

<div id="sequencer">
    {#each activeKnobs as activeKnob, i}
        {#if i % 2 === 0}
            <div class="sequencer-item even">
                <Knob {...activeKnob} tooltipPosition="left" on:knobValueChanged={handleKnobValueChanged}/>
                <div class="horizontal-line"></div>
            </div>
            <div class="sequencer-item even">
                <Led bind:isBlinking={ledsProps[i].isBlinking}/>
                <div class="vertical-line"></div>
            </div>
            <div class="sequencer-item even"></div>
        {:else}
            <div class="sequencer-item odd"></div>
            <div class="sequencer-item odd">
                {#if i !== STEP_NUMBER - 1}
                    <div class="vertical-line"></div>
                {/if}
                <Led bind:isBlinking={ledsProps[i].isBlinking}/>
            </div>
            <div class="sequencer-item odd">
                <div class="horizontal-line"></div>
                <Knob {...activeKnob} tooltipPosition="right" on:knobValueChanged={handleKnobValueChanged}/>
            </div>
        {/if}
    {/each}
</div>

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
