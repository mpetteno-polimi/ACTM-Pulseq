import * as Utilities from "../../utilities.js";
import * as Tonal from "@tonaljs/tonal";

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

class StepUtilities {

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

class SequenceTransformation {

    constructor(steps) {
        this.steps = steps;
    }

    transform(transformationType = SEQUENCE_TRANSFORMATION_TYPE.random) {
        switch (transformationType) {
            case SEQUENCE_TRANSFORMATION_TYPE.TRANSPOSITION:
                return this._transpose();
            case SEQUENCE_TRANSFORMATION_TYPE.INVERSION:
                return this._invert();
            case SEQUENCE_TRANSFORMATION_TYPE.REVERSAL:
                return this._revert();
            case SEQUENCE_TRANSFORMATION_TYPE.MUTATION:
                return this._mutate();
        }
    }

    merge(sequenceToMerge) {
        let mergedSteps = Utilities.cloneArray(this.steps).concat(sequenceToMerge.steps);
        return new SequenceTransformation(mergedSteps);
    }

    _transpose(semitones = Utilities.randomChoice(-12, 12)) {
        let transposedSteps = Utilities.cloneArray(this.steps);
        transposedSteps.forEach((transposedStep) => {
            transposedStep.note = Utilities.transposeNoteBySemitones(transposedStep.note, semitones);
        });
        return new SequenceTransformation(transposedSteps);
    }

    _invert() {
        let stepsClone = Utilities.cloneArray(this.steps);
        let emptySteps = stepsClone.filter(step => !step.note);
        let sortedSteps = stepsClone.filter(step => step.note).sort(StepUtilities.compareByNote);
        let invertedStep = this._invertInternal(sortedSteps).sort(StepUtilities.compareById);
        emptySteps.forEach((step) => {
            invertedStep.splice(step.id, 0, step);
        })
        return new SequenceTransformation(invertedStep);
    }

    _invertInternal(orderedSteps) {
        if (orderedSteps.length === 1) return orderedSteps;
        if (orderedSteps.length === 2) {
            StepUtilities.swapOctaves(orderedSteps[0], orderedSteps[1]);
            StepUtilities.swapIds(orderedSteps[0], orderedSteps[1]);
            return orderedSteps;
        }
        let middleSteps = this._invertInternal(orderedSteps.slice(1, orderedSteps.length - 1));
        StepUtilities.swapOctaves(orderedSteps[0], orderedSteps[orderedSteps.length - 1]);
        StepUtilities.swapIds(orderedSteps[0], orderedSteps[orderedSteps.length - 1]);
        // Compare first elements
        let outerFirst = orderedSteps[0];
        let innerFirst = middleSteps[0];
        if (Utilities.compareNotes(outerFirst.note, innerFirst.note)) {
            outerFirst.note = Utilities.lowerNote(outerFirst.note, innerFirst.note);
            middleSteps.unshift(outerFirst);
        } else {
            let temp = innerFirst;
            middleSteps[0] = outerFirst;
            middleSteps.unshift(temp);
        }
        // Compare last elements
        let outerLast = orderedSteps[orderedSteps.length - 1];
        let innerLast = middleSteps[middleSteps.length - 1];
        if (!Utilities.compareNotes(outerLast.note, innerLast.note)) {
            outerLast.note = Utilities.raiseNote(outerLast.note, innerLast.note);
            middleSteps.push(outerLast);
        } else {
            let temp = innerLast;
            middleSteps[middleSteps.length - 1] = outerLast;
            middleSteps.push(temp);
        }
        return middleSteps;
    }

    _revert() {
        let revertedSteps = Utilities.cloneArray(this.steps).reverse();
        revertedSteps.forEach((revertedStep, index) => {
            revertedStep.id = index;
        });
        return new SequenceTransformation(revertedSteps);
    }

    _mutate() {
        let mutatedSteps = Utilities.cloneArray(this.steps);
        let stepsToMutate = Utilities.getRandomSubarray(mutatedSteps);
        stepsToMutate.forEach((step) => {
            mutatedSteps[step.id].note = Utilities.transposeNoteBySemitones(step.note);
        });
        return new SequenceTransformation(mutatedSteps);
    }

}

class SequenceTreeGenerator {

    constructor(height, trunkSequenceSteps) {
        this.height = height;
        this.root = new Utilities.TreeNode(new SequenceTransformation(trunkSequenceSteps));
        this.paths = [];
        this.generateTree();
    }

    generateTree() {
        this.root.left = this._generateLevels(this.height, this.root.value, this.root.value, true);
        this.root.right = this._generateLevels(this.height, this.root.value, this.root.value, false);
    }

    _generateLevels(levelIndex, levelSequence, pathSequence, isPathSequenceToAdd) {
        if (levelIndex <= 0) {
            if (isPathSequenceToAdd) this.paths.push(pathSequence.steps);
            return null;
        }
        let transformedSequence = levelSequence.transform();
        let node = new Utilities.TreeNode(transformedSequence);
        let mergedSequence = pathSequence.merge(transformedSequence);
        node.left = this._generateLevels(levelIndex - 1, transformedSequence, mergedSequence, true);
        node.right = this._generateLevels(levelIndex - 1, transformedSequence, mergedSequence, false);
        return node;
    }

}

onmessage = (event) => {
    console.log("worker", event)
    let sequenceTreeGenerator = new SequenceTreeGenerator(event.data[0], event.data[1]);
    postMessage([sequenceTreeGenerator.root, sequenceTreeGenerator.paths]);
}