import * as Tonal from "@tonaljs/tonal";
import * as Tone from "tone";

/* --------------------------------------------- MATH --------------------------------------------- */

export {
    getRandom,
    getRandomInt,
    randomChoice
};

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandom(min, max) {
    return (Math.random() * (max - min)) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(firstChoice, secondChoice) {
    return Math.random() < 0.5 ? firstChoice : secondChoice;
}

/* --------------------------------------------- OBJECTS -------------------------------------------- */

export {
    cloneObject,
    TreeNode
};

/**
 * @function
 * @description Deep clone a class instance.
 * @param {object} instance The class instance you want to clone.
 * @returns {object} A new cloned instance.
 */
function cloneObject(instance) {
    return Object.assign(
        Object.create(
            // Set the prototype of the new object to the prototype of the instance.
            // Used to allow new object behave like class instance.
            Object.getPrototypeOf(instance),
            Object.getOwnPropertyDescriptors(instance)
        ),
        instance
    );
}

/* --------------------------------------------- DATAT STRUCTURE -------------------------------------------- */

class TreeNode {
    constructor(value, parent = null) {
        this.value = value;
        this.parent = parent;
        this.left = null;
        this.right = null;
    }
}

/* --------------------------------------------- ARRAYS --------------------------------------------- */

export {
    cloneArray,
    convertRange,
    getArray,
    getRandomSubarray,
    getRange,
    repeatElements,
    shuffleArray
};


const cloneArray = (arrayToClone) => {
    return arrayToClone.map(a => {
        return cloneObject(a);
    })
}

/**
 * Converts current degree to value and viceversa
 */
const convertRange = (oldMin, oldMax, newMin, newMax, oldValue) => {
    if (oldMax - oldMin === 0) return newMin;
    return Math.floor((oldValue - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin);
}

/**
 * Callback for generating an array's item.
 *
 * @callback itemGenerator
 * @see Array.prototype.map
 */

/**
 * Generates an array
 * @author Matteo Pettenò <mpetteno@mail.polimi.it>
 * @param {number} arrayLength - The size of the array
 * @param {itemGenerator} itemGenerator - The callback function that will be called to generate each item.
 * @return {Array} - The generated array
 */
const getArray = (arrayLength, itemGenerator) => {
    return [...Array(arrayLength)].map(itemGenerator);
}

const getRange = (min, max) => {
    let rangeLength = max - min + 1;
    return getArray(rangeLength, (_, index) => min + index);
}

function getRandomSubarray(array, subarraySize = getRandomInt(0, array.length)) {
    let shuffledArray = shuffleArray(array);
    return shuffledArray.slice(0, subarraySize);
}

function shuffleArray(array) {
    let shuffledArray = cloneArray(array);
    let currentIndex = shuffledArray.length;
    let randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[currentIndex]];
    }
    return shuffledArray;
}

function repeatElements(array, repetitionNumber) {
    return cloneArray(array).flatMap(i => Array.from({length: repetitionNumber}).fill(i))
}

/* ----------------------------------------- MUSIC ----------------------------------------- */

export {
    compareNotes,
    getNotesForScale,
    generateMelody,
    lowerNote,
    toggleMasterMute,
    transposeNoteBySemitones,
    getSequenceSubdivisionForTimeDivision,
    raiseNote,
    swapOctave
};

function getNotesForScale(scaleName, startNote = "A", startOctave = 3) {
    if (scaleName === "random") {
        let allScaleNames = Tonal.ScaleType.names();
        let randomScaleIndex = getRandomInt(0, allScaleNames.length - 1);
        scaleName = allScaleNames[randomScaleIndex];
    }
    return Tonal.Scale.get(startNote + startOctave + " " + scaleName).notes;
}

function generateMelody(scaleName, length) {
    return getArray(length, () => {
        let scaleNotes = getNotesForScale(scaleName);
        let randomIndex = getRandomInt(0, scaleNotes.length - 1);
        return scaleNotes[randomIndex];
    });
}

function toggleMasterMute() {
    Tone.getDestination().mute = !Tone.getDestination().mute;
}

function transposeNoteBySemitones(note, semitones = this.randomChoice(-12, 12)) {
    let transposeInterval = Tonal.Interval.fromSemitones(semitones);
    return !note ? null : Tonal.Note.transpose(note, transposeInterval);
}

function getSequenceSubdivisionForTimeDivision(timeDivision) {
    return timeDivision + "n";
}

function swapOctave(note1, note2) {
    if (note1 !== note2) {
        let tonalNote1 = Tonal.Note.get(note1);
        let tonalNote2 = Tonal.Note.get(note2);
        if (tonalNote1.oct === tonalNote2.oct) {
            return [tonalNote2.pc + tonalNote1.oct, tonalNote1.pc + (tonalNote2.oct + 1)];
        } else {
            return [tonalNote2.pc + tonalNote1.oct, tonalNote1.pc + tonalNote2.oct];
        }
    } else {
        return [note1, note2];
    }
}

function compareNotes(note1, note2) {
    let tonalNote1 = Tonal.Note.get(note1);
    let tonalNote2 = Tonal.Note.get(note2);
    return Tonal.Note.ascending(tonalNote1, tonalNote2) > 0;
}

function lowerNote(noteToLower, referenceNote) {
    if (noteToLower === referenceNote) return noteToLower;
    let lowedNote = noteToLower;
    while (compareNotes(lowedNote, referenceNote)) {
        lowedNote = transposeNoteBySemitones(lowedNote, -12);
    }
    return lowedNote;
}

function raiseNote(noteToRaise, referenceNote) {
    if (noteToRaise === referenceNote) return noteToRaise;
    let raisedNote = noteToRaise;
    while (!compareNotes(raisedNote, referenceNote)) {
        raisedNote = transposeNoteBySemitones(raisedNote, 12);
    }
    return raisedNote;
}
