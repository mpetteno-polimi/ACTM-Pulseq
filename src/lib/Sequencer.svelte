<script>
    import {synthStore} from '../stores.js';
    import {onMount} from "svelte";
    import * as Tone from "tone";
    import Knob, {convertRange} from "./ui/Knob.svelte";
    import Led from "./ui/Led.svelte";

    /* -- Constants -- */
    const STEP_NUMBER = 8;
    const STEP_TIME = "4n";
    const DEFAULT_MELODY = Array(STEP_NUMBER).fill(0);

    /* -- Modes -- */
    const MODES = {
        SEQUENCE_MODE: 0,
        CONTROL_MODE: 1
    }
    const DEFAULT_MODE = MODES.SEQUENCE_MODE;
    let activeMode = DEFAULT_MODE;

    /* -- Note Knobs -- */
    let noteKnobs = Array(STEP_NUMBER).fill(0).map(() => ({component: Knob}));
    noteKnobs.forEach((noteKnob, index) => {
        noteKnob.props = {
            id: index,
            label: "",
            valueIndex: DEFAULT_MELODY[index],
            minValueIndex: 0,
            maxValueIndex: 7,
            values: ["", "A3", "B3", "C3", "D3", "E3", "F3", "G3"],
            degree: convertRange(0, 7, 45, 315, 0)
        };
    });

    /* -- Control Knobs -- */
    let controlKnobsProps = [
        {
            id: 0,
            label: "length",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 1,
            label: "scale",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 2,
            label: "order",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 3,
            label: "transpose",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 4,
            label: "div/mult",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 5,
            label: "slew",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 6,
            label: "repeat",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        },
        {
            id: 7,
            label: "notes",
            valueIndex: 0,
            minValueIndex: 0,
            maxValueIndex: 7,
            values: Array.from(Array(STEP_NUMBER + 1).keys()),
            degree: convertRange(0, 7, 45, 315, 0)
        }
    ];
    let controlKnobs = Array(STEP_NUMBER).fill(0).map(() => ({component: Knob}));
    controlKnobs.forEach((controlKnob, index) => {
        controlKnob.props = controlKnobsProps[index];
    });

    /* -- Knobs Matrix -- */
    let knobsMatrix = [noteKnobs, controlKnobs];
    let activeKnobs = knobsMatrix[DEFAULT_MODE];

    /* -- LEDs -- */
    let leds = [];

    /* -- Steps and Sequence -- */
    let steps = Array(STEP_NUMBER).fill(0).map(() => ({note: "", duration: 1}));
    let sequence;

    // Get synth object from stores
    let synth;
    synthStore.subscribe(value => {
        synth = value;
    });

    onMount(() => {
        sequence = new Tone.Sequence(onSequenceStep, steps, STEP_TIME)
        // startSequence()
    });

    function onSequenceStep(time, step) {
        let note = step.note === "" ? null : step.note;
        let duration = 0.1; // step.duration;
        // const velocity = random(0.5, 1);
        synth.triggerAttackRelease(note, duration, time);
    }

    function startSequence() {
        sequence.start();
        Tone.Transport.bpm.value = 80;
        Tone.Transport.start();
    }

    function stopSequence() {
        sequence.stop();
        Tone.Transport.stop();
    }

    /* -- Enable knob's control mode on Ctrl key pressed -- */
    function handleKeyDown(event) {
        if (event.repeat) return;
        switch (event.key) {
            case "Control":
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
                console.log('control mode')
                break;
        }
    }

    function updateStep(index, note) {
        steps[index].note = note;
    }

    function updateActiveKnobsProps(event) {
        let targetKnobProps = activeKnobs[event.detail.knobId].props;
        targetKnobProps.valueIndex = event.detail.index;
        targetKnobProps.degree = event.detail.deg;
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
                <Led/>
                <div class="vertical-line"></div>
            </div>
            <div class="sequencer-item even"></div>
        {:else}
            <div class="sequencer-item odd"></div>
            <div class="sequencer-item odd">
                {#if i !== STEP_NUMBER - 1}
                    <div class="vertical-line"></div>
                {/if}
                <Led/>
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
