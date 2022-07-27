<script>
    import {synthStore} from '../stores.js';
    import {onMount} from "svelte";
    import {convertRange} from "../utilities.js";
    import * as Tone from "tone";
    import * as Tonal from "@tonaljs/tonal";
    import Knob from "./ui/Knob.svelte";
    import Led from "./ui/Led.svelte";
    import {Note} from "@tonaljs/tonal";

    /* -- Constants -- */
    const STEP_NUMBER = 8;
    const KNOBS_START_ANGLE = 45;
    const KNOBS_END_ANGLE = 315;
    const VELOCITY_MIN = 0.4;
    const DEFAULT_VALUES = {
        SEQ_LENGHT: {
            minLengthValue: 1,
            maxLengthValue: STEP_NUMBER,
            initialValue: 8,
            get values() {
                return [...Array(this.maxLengthValue - this.minLengthValue + 1)].map((_, i) => this.minLengthValue + i);
            },
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            }
        },
        SEQ_SCALE: {
            initialValue: "major",
            values: ["chromatic", "major", "minor", "major pentatonic", "minor pentatonic", "harmonic minor",
                "whole tone", "random"],
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            },
            get initialScaleNotes() {
                return Tonal.Scale.get("A3 " + this.initialValue).notes;
            }
        },
        SEQ_TEMPO: {
            minBpmValue: 30,
            maxBpmValue: 240,
            initialValue: 120,
            get values() {
                return [...Array(this.maxBpmValue - this.minBpmValue + 1)].map((_, i) => this.minBpmValue + i);
            },
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            },
        },
        SEQ_ORDER: {
            initialValue: "forward",
            values: ["forward", "backward", "pendulum", "random"],
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            }
        },
        SEQ_TRANSPOSE: {
            minTrasposeValue: -24,
            maxTrasposeValue: 24,
            initialValue: 0,
            get values() {
                return [...Array(this.maxTrasposeValue - this.minTrasposeValue + 1)].map((_, i) => this.minTrasposeValue + i);
            },
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            },
        },
        SEQ_TIME_DIVISION: {
            minTimeDivisionValue: 0,
            maxTimeDivisionValue: 8,
            initialValue: 16,
            get values() {
                return [...Array(this.maxTimeDivisionValue - this.minTimeDivisionValue + 1)].map((_, i) => 2**i);
            },
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            },
        },
        SEQ_REPEAT: {
            minRepeatValue: 1,
            maxRepeatValue: 8,
            initialValue: 1,
            get values() {
                return [...Array(this.maxRepeatValue - this.minRepeatValue + 1)].map((_, i) => this.minRepeatValue + i);
            },
            get initialIndex() {
                return this.values.indexOf(this.initialValue);
            },
            get maxValueIndex() {
                return this.values.length - 1;
            }
        }
    }
    const SEQ_INIT_MELODY = [...Array(STEP_NUMBER)].map(() => (Math.floor(Math.random() * DEFAULT_VALUES.SEQ_SCALE.maxValueIndex)));

    /* -- Modes -- */
    const MODES = {
        SEQUENCE_MODE: 0,
        CONTROL_MODE: 1
    }
    const DEFAULT_MODE = MODES.SEQUENCE_MODE;
    let activeMode = DEFAULT_MODE;

    /* -- Note Knobs -- */
    let noteKnobs = [...Array(STEP_NUMBER)].map((noteKnob, index) => (
        {
            component: Knob,
            props: {
                id: index,
                label: "",
                numTicks: DEFAULT_VALUES.SEQ_SCALE.initialScaleNotes.length,
                valueIndex: SEQ_INIT_MELODY[index],
                minValueIndex: 0,
                maxValueIndex: DEFAULT_VALUES.SEQ_SCALE.initialScaleNotes.length,
                values: [""].concat(DEFAULT_VALUES.SEQ_SCALE.initialScaleNotes),
                degree: convertRange(0, DEFAULT_VALUES.SEQ_SCALE.initialScaleNotes.length, KNOBS_START_ANGLE,
                    KNOBS_END_ANGLE, SEQ_INIT_MELODY[index])
            }
        }
    ));

    /* -- Control Knobs -- */
    let controlKnobsHandlersMapping = {
        0: handleSequenceLengthChange,
        1: handleSequenceTempoChange,
        2: handleSequenceScaleChange,
        3: handleSequenceOrderChange,
        4: handleSequenceTransposeChange,
        5: handleSequenceTimeDivisionChange,
        6: handleSequenceRepeatChange,
        7: handleSequenceSlewChange
    }
    let controlKnobsProps = [
        {
            id: 0,
            label: "length",
            numTicks: DEFAULT_VALUES.SEQ_LENGHT.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_LENGHT.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_LENGHT.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_LENGHT.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_LENGHT.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_LENGHT.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_LENGHT.initialValue
        },
        {
            id: 1,
            label: "tempo",
            numTicks: DEFAULT_VALUES.SEQ_TEMPO.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_TEMPO.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_TEMPO.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_TEMPO.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_TEMPO.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_TEMPO.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_TEMPO.initialValue
        },
        {
            id: 2,
            label: "scale",
            numTicks: DEFAULT_VALUES.SEQ_SCALE.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_SCALE.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_SCALE.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_SCALE.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_SCALE.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_SCALE.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_SCALE.initialValue
        },
        {
            id: 3,
            label: "order",
            numTicks: DEFAULT_VALUES.SEQ_ORDER.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_ORDER.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_ORDER.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_ORDER.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_ORDER.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_ORDER.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_ORDER.initialValue
        },
        {
            id: 4,
            label: "transpose",
            numTicks: DEFAULT_VALUES.SEQ_TRANSPOSE.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_TRANSPOSE.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_TRANSPOSE.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_TRANSPOSE.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_TRANSPOSE.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_TRANSPOSE.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_TRANSPOSE.initialValue
        },
        {
            id: 5,
            label: "div/mult",
            numTicks: DEFAULT_VALUES.SEQ_TIME_DIVISION.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_TIME_DIVISION.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_TIME_DIVISION.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_TIME_DIVISION.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_TIME_DIVISION.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_TIME_DIVISION.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_TIME_DIVISION.initialValue
        },
        {
            id: 6,
            label: "repeat",
            numTicks: DEFAULT_VALUES.SEQ_REPEAT.maxValueIndex,
            valueIndex: DEFAULT_VALUES.SEQ_REPEAT.initialIndex,
            minValueIndex: 0,
            maxValueIndex: DEFAULT_VALUES.SEQ_REPEAT.maxValueIndex,
            values: DEFAULT_VALUES.SEQ_REPEAT.values,
            degree: convertRange(0, DEFAULT_VALUES.SEQ_REPEAT.maxValueIndex, KNOBS_START_ANGLE, KNOBS_END_ANGLE,
                DEFAULT_VALUES.SEQ_REPEAT.initialIndex),
            selectedValue: DEFAULT_VALUES.SEQ_REPEAT.initialValue
        },
        {
            id: 7,
            label: "slew",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        }
    ];
    let controlKnobs = [...Array(STEP_NUMBER)].map((controlKnobs, index) => (
        {
            component: Knob,
            props: controlKnobsProps[index]
        }
    ));

    /* -- Knobs Matrix -- */
    let knobsMatrix = [noteKnobs, controlKnobs];
    let activeKnobs = knobsMatrix[DEFAULT_MODE];

    /* -- LEDs -- */
    const BLINK_DURATION = 0.2;
    let ledsProps = [...Array(STEP_NUMBER)].map(() => ({isBlinking: false, blinkDuration: BLINK_DURATION}));

    /* -- Steps and Sequence -- */
    let steps = [...Array(DEFAULT_VALUES.SEQ_LENGHT.initialValue)].map((step, index) => (
        {
            id: index,
            note: "",
            duration: 1
        }
    ));
    let sequence;
    let sequenceState = {
        length: DEFAULT_VALUES.SEQ_LENGHT.initialValue,
        scale: DEFAULT_VALUES.SEQ_SCALE.initialValue,
        tempo: DEFAULT_VALUES.SEQ_TEMPO.initialValue,
        order: DEFAULT_VALUES.SEQ_ORDER.initialValue,
        transpose: DEFAULT_VALUES.SEQ_TRANSPOSE.initialValue,
        timeDivision: DEFAULT_VALUES.SEQ_TIME_DIVISION.initialValue,
        repeat: DEFAULT_VALUES.SEQ_REPEAT.initialValue
    }

    // Get synth object from stores
    let synth;
    synthStore.subscribe(value => {
        synth = value;
    });

    onMount(() => {
        let initialTimeDivision = getSequenceSubdivisionForTimeDivision(sequenceState.timeDivision);
        sequence = new Tone.Sequence(onSequenceStep, steps, initialTimeDivision);
        // startSequence()
    });

    function onSequenceStep(time, step) {
        let note = transposeNoteBySemitones(step.note, sequenceState.transpose);
        let gate = 0.1;
        let velocity = Math.floor(Math.random()) + VELOCITY_MIN;
        synth.triggerAttackRelease(note, gate, time, velocity);
        blinkLed(step.id, gate, time);
        if (step.id === sequenceState.length - 1 && sequenceState.order === "random") {
            sequence.events = getStepsForLengthAndOrder(sequenceState.length, sequenceState.order);
        }
    }

    function blinkLed(index, duration, time) {
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = true;
        }, time);
        Tone.Draw.schedule(() => {
            ledsProps[index].isBlinking = false;
        }, time + BLINK_DURATION);
    }

    function startSequence() {
        sequence.start(0);
        Tone.Transport.bpm.value = sequenceState.tempo;
        Tone.Transport.start();
    }

    function stopSequence() {
        Tone.Transport.stop();
    }

    /* -- Enable knob's control mode on Ctrl key pressed -- */
    function handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
                activeMode = MODES.CONTROL_MODE;
                activeKnobs = knobsMatrix[MODES.CONTROL_MODE];
                break;
        }
    }

    /* -- Disable knob's control mode on Ctrl key released -- */
    function handleKeyUp(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
                activeMode = MODES.SEQUENCE_MODE;
                activeKnobs = knobsMatrix[MODES.SEQUENCE_MODE];
                break;
        }
    }

    function handleKnobValueChanged(event) {
        updateActiveKnobsProps(event);
        switch (activeMode) {
            case MODES.SEQUENCE_MODE:
                updateStep(event.detail.knobId, event.detail.value)
                break;
            case MODES.CONTROL_MODE:
                controlKnobsHandlersMapping[event.detail.knobId](event.detail.value);
                break;
        }
    }

    function updateStep(stepIndex, note) {
        steps[stepIndex].note = note;
    }

    function updateActiveKnobsProps(event) {
        let targetKnobProps = activeKnobs[event.detail.knobId].props;
        targetKnobProps.valueIndex = event.detail.index;
        targetKnobProps.degree = event.detail.deg;
        targetKnobProps.selectedValue = event.detail.value;
    }

    function handleSequenceLengthChange(newValue) {
        sequenceState.length = newValue;
        sequence.events = getStepsForLengthAndOrder(newValue, sequenceState.order);
    }

    function handleSequenceTempoChange(newValue) {
        sequenceState.tempo = newValue;
        Tone.Transport.bpm.value = newValue;
    }

    function handleSequenceScaleChange(newValue) {
        sequenceState.scale = newValue;
        let newScaleNotes = getNotesForScale(newValue);
        updateNoteKnobsAndSequenceSteps(newScaleNotes)
    }

    function getNotesForScale(scale) {
        if (scale === "random") {
            let allScaleNames = Tonal.ScaleType.names();
            let randomScaleIndex = Math.floor(Math.random() * (allScaleNames.length - 1));
            return Tonal.Scale.get("A3 " + allScaleNames[randomScaleIndex]).notes;
        } else {
            return Tonal.Scale.get("A3 " + scale).notes
        }
    }

    function updateNoteKnobsAndSequenceSteps(newScaleNotes) {
        // TODO - Fix new note rotation degree
        for (let i = 0; i < STEP_NUMBER; i++) {
            let oldNoteIndex = noteKnobs[i].props.valueIndex;
            let oldNoteMaxIndex = noteKnobs[i].props.maxValueIndex;
            let newNoteValues = [""].concat(newScaleNotes);
            let newNoteIndex = convertRange(0, oldNoteMaxIndex, 1, newScaleNotes.length, oldNoteIndex);
            noteKnobs[i].props = {
                ...noteKnobs[i].props,
                numTicks: newNoteValues.length,
                valueIndex: newNoteIndex,
                maxValueIndex: newScaleNotes.length,
                values: newNoteValues,
                degree: convertRange(0, newScaleNotes.length, KNOBS_START_ANGLE, KNOBS_END_ANGLE, newNoteIndex),
                selectedValue: newNoteValues[newNoteIndex]
            }
            steps[i].note = newNoteValues[newNoteIndex]
        }
    }

    function handleSequenceOrderChange(newValue) {
        sequenceState.order = newValue;
        sequence.events = getStepsForLengthAndOrder(sequenceState.length, newValue);
    }

    function getStepsForLengthAndOrder(length, order) {
        let newSteps = [...steps].slice(0, length);
        switch (order) {
            case "forward":
                break;
            case "backward":
                newSteps.reverse();
                break;
            case "pendulum":
                let pendulumSteps = [...newSteps].slice(1, length - 1).reverse();
                newSteps = newSteps.concat(pendulumSteps);
                break;
            case "random":
                shuffleArray(newSteps);
                break;
        }
        return duplicateSteps(newSteps, sequenceState.repeat);
    }

    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        // While there remain elements to shuffle.
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
    }

    function handleSequenceTransposeChange(newValue) {
        sequenceState.transpose = newValue;
    }

    function transposeNoteBySemitones(note, semitones) {
        let transposeInterval = Tonal.Interval.fromSemitones(semitones);
        return note === "" ? null : Tonal.Note.transpose(note, transposeInterval);
    }

    function handleSequenceTimeDivisionChange(newValue) {
        sequenceState.timeDivision = newValue;
        let newSubdivision = getSequenceSubdivisionForTimeDivision(newValue);
        let currentSteps = getStepsForLengthAndOrder(sequenceState.length, sequenceState.order);
        sequence.stop();
        sequence = new Tone.Sequence(onSequenceStep, currentSteps, newSubdivision);
        sequence.start();
    }

    function getSequenceSubdivisionForTimeDivision(timeDivision) {
        return timeDivision + "n";
    }

    function handleSequenceRepeatChange(newValue) {
        // TODO - Fix random order step repetition
        sequenceState.repeat = newValue;
        sequence.events = getStepsForLengthAndOrder(sequenceState.length, sequenceState.order);
    }

    function duplicateSteps(steps, repetitionNumber) {
        return steps.flatMap(i => Array.from({ length: repetitionNumber }).fill(i))
    }

    function handleSequenceSlewChange(newValue) {
        // TODO
    }

</script>

<svelte:window on:keydown|preventDefault={handleKeyDown} on:keyup|preventDefault={handleKeyUp}/>

<div id="sequencer">
    {#each activeKnobs as activeKnob, i}
        {#if i % 2 === 0}
            <div class="sequencer-item even">
                <svelte:component this={activeKnob.component} {...activeKnob.props} tooltipPosition="left"
                                  on:knobValueChanged={handleKnobValueChanged}/>
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
                <svelte:component this={activeKnob.component} {...activeKnob.props} tooltipPosition="right"
                                  on:knobValueChanged={handleKnobValueChanged}/>
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
