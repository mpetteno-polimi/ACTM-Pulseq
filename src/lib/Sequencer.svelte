<script>
    import {synthStore} from '../stores.js';
    import {config} from "../config.js";
    import {onMount} from "svelte";
    import {fade} from 'svelte/transition';
    import * as Tonal from "@tonaljs/tonal";
    import * as Utilities from "../utilities.js";
    import * as Tone from "tone";
    import Knob from "./atoms/Knob.svelte";
    import Led from "./atoms/Led.svelte";

    /* --------------------------------------------- GLOBAL VARIABLES --------------------------------------------- */

    /* -- Get synth object from stores -- */
    let synths;
    synthStore.subscribe(value => {
        synths = value;
    });

    /* --------------------------------------------- COMPONENTS PROPS --------------------------------------------- */

    function getKnobProps(id, label, values, initialValue) {
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
    let fractalControlKnobsProps = [];

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

    function updateActiveKnobsProps(event, knobsType) {
        let targetKnobProps = activeKnobs[knobsType][event.detail.knobId];
        if (targetKnobProps) {
            targetKnobProps.valueIndex = event.detail.index;
            targetKnobProps.degree = event.detail.deg;
            targetKnobProps.selectedValue = event.detail.value;
        }
    }

    /* ---------------------------------------------- SEQUENCE ------------------------------------------------- */

    const SEQUENCE_TRANSFORMATION_TYPE = {
        TRANSPOSITION: "transposition",
        INVERSION: "inversion",
        REVERSAL: "reversal",
        MUTATION: "mutation",

        get random() {
            let rand = Utilities.getRandomInt(0, Object.keys(this).length - 1);
            return this[Object.keys(this)[rand]];
        }
    };

    class SequenceStep {

        constructor(id, note = "", duration = config.sequence.defaultStepDuration,
                    velocity = Utilities.getRandom(config.sequence.minStepVelocity, 1), transpose = 0, slew = 0,
                    synth = synths[config.sequence.synth]) {
            this.id = id;
            this.note = note;
            this.duration = duration;
            this.velocity = velocity;
            this.transpose = transpose;
            this.slew = slew;
            this.synth = synth;
        }

        static compareById(step1, step2) {
            return step1.id - step2.id;
        }

        static compareByNote(step1, step2) {
            let tonalNote1 = Tonal.Note.get(step1.note);
            let tonalNote2 = Tonal.Note.get(step2.note);
            return Tonal.Note.ascending(tonalNote1, tonalNote2);
        }

        static swapIds(step1, step2) {
            let temp = step1.id;
            step1.id = step2.id;
            step2.id = temp;
        }

        static swapOctaves(step1, step2) {
            let swapOctaveNotes = Utilities.swapOctave(step1.note, step2.note);
            step1.note = swapOctaveNotes[0];
            step2.note = swapOctaveNotes[1];
        }

    }

    class Sequence {

        constructor(steps, state) {
            this.state = state;
            this.steps = steps;
            let timeDivision = Utilities.getSequenceSubdivisionForTimeDivision(state.timeDivision);
            this.sequence = new Tone.Sequence(this.onSequenceStep, this.steps, timeDivision);
        }

        onSequenceStep(time, step) {
            let note = Utilities.transposeNoteBySemitones(step.note, step.transpose);
            let duration = this.subdivision - (this.subdivision > config.sequence.stepDurationOffset
                ? config.sequence.stepDurationOffset : 0);
            let velocity = step.velocity;
            step.synth.portamento = duration * step.slew;
            step.synth.triggerAttackRelease(note, duration, time, velocity);
            blinkLed(step.id, duration, time);
        }

        start() {
            Tone.Transport.bpm.value = this.state.tempo;
            this.sequence.start();
        }

        stop() {
            this.sequence.stop();
        }

        merge(sequenceToMerge) {
            let mergedSteps = [...this.steps].concat(sequenceToMerge.steps);
            return new Sequence(mergedSteps, this.state);
        }

        update() {
            Tone.Transport.bpm.value = this.state.tempo;
            this.sequence.events = this.getStepsForCurrentState();
        }

        transform(transformationType = SEQUENCE_TRANSFORMATION_TYPE.INVERSION) {
            console.log(transformationType)
            switch (transformationType) {
                case SEQUENCE_TRANSFORMATION_TYPE.TRANSPOSITION:
                    return this.transpose();
                case SEQUENCE_TRANSFORMATION_TYPE.INVERSION:
                    return this.invert();
                case SEQUENCE_TRANSFORMATION_TYPE.REVERSAL:
                    return this.revert();
                case SEQUENCE_TRANSFORMATION_TYPE.MUTATION:
                    return this.mutate();
            }
        }

        transpose(semitones = Utilities.randomChoice(-12, 12)) {
            let transposedSteps = Utilities.cloneArray(this.steps);
            transposedSteps.forEach((transposedStep) => {
                transposedStep.note = Utilities.transposeNoteBySemitones(transposedStep.note, semitones);
            });
            return new Sequence(transposedSteps, this.state);
        }

        invert() {
            let sortedSteps = Utilities.cloneArray(this.steps).sort(SequenceStep.compareByNote);
            let invertedStep = this.invertInternal(sortedSteps).sort(SequenceStep.compareById);
            return new Sequence(invertedStep, this.state);
        }

        invertInternal(orderedSteps) {
            if (orderedSteps.length === 1) return orderedSteps[0];
            if (orderedSteps.length === 2) {
                SequenceStep.swapOctaves(orderedSteps[0], orderedSteps[1]);
                SequenceStep.swapIds(orderedSteps[0], orderedSteps[1]);
                return orderedSteps;
            }
            let middleSteps = this.invertInternal(orderedSteps.slice(1, orderedSteps.length - 1));
            SequenceStep.swapOctaves(orderedSteps[0], orderedSteps[orderedSteps.length - 1]);
            SequenceStep.swapIds(orderedSteps[0], orderedSteps[orderedSteps.length - 1]);
            // Compare first elements
            if (Utilities.compareNotes(orderedSteps[0].note, middleSteps[0].note)) {
                orderedSteps[0].note = Utilities.lowerNote(orderedSteps[0].note, middleSteps[0].note);
                middleSteps.unshift(orderedSteps[0]);
            } else {
                let temp = middleSteps[0];
                middleSteps[0] = orderedSteps[0];
                middleSteps.unshift(temp);
            }
            // Compare last elements
            if (!Utilities.compareNotes(orderedSteps[orderedSteps.length - 1].note, middleSteps[middleSteps.length - 1].note)) {
                orderedSteps[orderedSteps.length - 1].note = Utilities.raiseNote(orderedSteps[orderedSteps.length - 1].note, middleSteps[middleSteps.length - 1].note);
                middleSteps.push(orderedSteps[orderedSteps.length - 1]);
            } else {
                let temp = middleSteps[middleSteps.length - 1];
                middleSteps[middleSteps.length - 1] = orderedSteps[orderedSteps.length - 1];
                middleSteps.push(temp);
            }
            return middleSteps;
        }

        revert() {
            let revertedSteps = Utilities.cloneArray(this.steps).reverse();
            revertedSteps.forEach((revertedStep, index) => {
                revertedStep.id = index;
            });
            return new Sequence(revertedSteps, this.state);
        }

        mutate() {
            let mutatedSteps = Utilities.cloneArray(this.steps);
            let stepsToMutate = Utilities.getRandomSubarray(mutatedSteps);
            stepsToMutate.forEach((step) => {
                mutatedSteps[step.id].note = Utilities.transposeNoteBySemitones(step.note);
            })
            return new Sequence(mutatedSteps, this.state);
        }

        getStepsForCurrentState() {
            let newSteps = [...this.steps].slice(0, this.state.length);
            switch (this.state.order) {
                case "forward":
                    break;
                case "backward":
                    newSteps.reverse();
                    break;
                case "pendulum":
                    let pendulumSteps = [...newSteps].slice(1, this.state.length - 1).reverse();
                    newSteps = newSteps.concat(pendulumSteps);
                    break;
                case "random":
                    newSteps = Utilities.shuffleArray(newSteps);
                    break;
            }
            this.steps.forEach((step) => {
                step.transpose = this.state.transpose;
                step.slew = this.state.slew;
            });
            return Utilities.repeatElements(newSteps, this.state.repeat);
        }

        changeTimeSubdivision(newTimeSubdivision) {
            let newSubdivision = Utilities.getSequenceSubdivisionForTimeDivision(newTimeSubdivision);
            this.sequence.stop();
            this.sequence = new Tone.Sequence(this.onSequenceStep, this.getStepsForCurrentState(), newSubdivision);
            this.sequence.start();
        }

        changeScale(newScale) {
            let oldScaleNotes = Utilities.getNotesForScale(this.state.scale);
            let newScaleNotes = Utilities.getNotesForScale(newScale);
            this.steps.forEach((step) => {
                let oldNoteIndex = oldScaleNotes.indexOf(step.note) + 1;
                let oldNoteMaxIndex = oldScaleNotes.length;
                let newNoteIndex = Utilities.convertRange(0, oldNoteMaxIndex, 0, newScaleNotes.length, oldNoteIndex);
                step.note = newScaleNotes[newNoteIndex];
            });
        }

    }

    /* ----------------------------------------------- FRACTAL -------------------------------------------------- */

    class SequenceTreeNode {
        constructor(value, parent = null) {
            this.value = value;
            this.parent = parent;
            this.left = null;
            this.right = null;
        }
    }

    class SequenceTree {

        constructor(trunkSequence = this.generateTrunkSequence(config.sequence)) {
            this.height = config.tree.controls.branches.init;
            this.root = new SequenceTreeNode(trunkSequence);
            this.paths = [];
            this.playingPath = -1;
            this.generateTree();
            console.log(this.paths)
        }

        get trunkSequence() {
            return this.root.value;
        }

        generateTrunkSequence(sequenceConfig) {
            let steps = sequenceConfig.steps.map((step, index) => {
                return new SequenceStep(index, step.note, step.duration);
            });
            let state = {
                length: sequenceConfig.controls.length.init,
                tempo: sequenceConfig.controls.tempo.init,
                scale: sequenceConfig.controls.scale.init,
                order: sequenceConfig.controls.order.init,
                transpose: sequenceConfig.controls.transpose.init,
                timeDivision: sequenceConfig.controls.timeDivision.init,
                repeat: sequenceConfig.controls.repeat.init,
                slew: sequenceConfig.controls.slew.init
            }
            return new Sequence(steps, state);
        }

        generateTree() {
            this.root.left = this.generateLevels(this.height, this.trunkSequence, this.trunkSequence);
            this.root.right = this.generateLevels(this.height, this.trunkSequence, this.trunkSequence);
        }

        regenerateTree() {
            this.trunkSequence.update();
            this.stop();
            this.paths = [];
            this.generateTree();
            this.play();
        }

        generateLevels(levelIndex, levelSequence, pathSequence) {
            if (levelIndex <= 0) {
                if (!this.paths.includes(pathSequence)) this.paths.push(pathSequence);
                return null;
            }
            let transformedSequence = levelSequence.transform();
            let node = new SequenceTreeNode(transformedSequence);
            let mergedSequence = pathSequence.merge(transformedSequence);
            node.left = this.generateLevels(levelIndex - 1, transformedSequence, mergedSequence);
            node.right = this.generateLevels(levelIndex - 1, transformedSequence, mergedSequence);
            return node;
        }

        play(pathIndex = 1) {
            console.assert(pathIndex > 0 && pathIndex <= this.paths.length, "Path index is not valid");
            this.paths[pathIndex - 1].start();
            this.playingPath = pathIndex - 1;
        }

        stop() {
            if (this.playingPath >= 0) {
                this.paths[this.playingPath].stop();
                this.playingPath = -1;
            }
        }

    }

    /* --------------------------------------------- SEQUENCER STATE --------------------------------------------- */

    let fractalTree = new SequenceTree();
    let isFractalActive = false;

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
        handleFractalMutationChange
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
                break;
            case MODES.GLOBAL_CONTROL_MODE:
                sequencerControlChangeHandlers[event.detail.knobId](event.detail.value);
                break;
        }
        if (!event.detail.isOnMount) fractalTree.regenerateTree();
    }

    function handleFractalKnobValueChanged(event) {
        updateActiveKnobsProps(event, KNOBS_TYPE.FRACTAL_KNOBS);
        switch (activeMode) {
            case MODES.SEQUENCE_MODE:
                fractalControlChangeHandlers[event.detail.knobId](event.detail.value);
                break;
            case MODES.GLOBAL_CONTROL_MODE:
                break;
        }
    }

    function handleSequenceLengthChange(newValue) {
        fractalTree.trunkSequence.state.length = newValue;
    }

    function handleSequenceTempoChange(newValue) {
        fractalTree.trunkSequence.state.tempo = newValue;
        Tone.Transport.bpm.value = newValue;
    }

    function handleSequenceScaleChange(newValue) {
        fractalTree.trunkSequence.state.scale = newValue;
        fractalTree.trunkSequence.changeScale(newValue);
        let newScaleNotes = [""].concat(Utilities.getNotesForScale(newValue));
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
        fractalTree.trunkSequence.changeTimeSubdivision(newValue);
    }

    function handleSequenceRepeatChange(newValue) {
        fractalTree.trunkSequence.state.repeat = newValue;
    }

    function handleSequenceSlewChange(newValue) {
        fractalTree.trunkSequence.state.slew = newValue;
    }

    function handleFractalBranchesChange(newValue) {
        fractalKnobsProps[1] = getKnobProps(1, "path", Utilities.getRange(1, 2 ** newValue), 1);
        activeKnobs[KNOBS_TYPE.FRACTAL_KNOBS][1] = fractalKnobsProps[1];
        isFractalActive = newValue > 0;
    }

    function handleFractalPathChange(newValue) {

    }

    function handleFractalMutationChange(newValue) {

    }

    onMount(() => {
        Tone.Transport.start();
        fractalTree.play();
    });

</script>

<svelte:window on:keydown|preventDefault={handleKeyDown}
               on:keyup|preventDefault={handleKeyUp}
               on:beforeunload={handleBeforeUnload}/>

<fractal-sequencer in:fade>
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
                {#if i === 1}
                    {#if isFractalActive}
                        <Knob {...activeFractalKnob} tooltipPosition="right"
                              on:knobValueChanged={handleFractalKnobValueChanged}/>
                    {/if}
                {:else}
                    <Knob {...activeFractalKnob} tooltipPosition="right"
                          on:knobValueChanged={handleFractalKnobValueChanged}/>
                {/if}
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
