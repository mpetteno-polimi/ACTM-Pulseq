import * as Tonal from "@tonaljs/tonal";
import * as Tone from "tone";

/* --------------------------------------------- MATH --------------------------------------------- */

export {
    getRandom,
    getRandomInt
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

/* --------------------------------------------- ARRAYS --------------------------------------------- */

export {
    convertRange,
    getArray,
    getRange,
    repeatElements,
    shuffleArray
};

/**
 * Converts current degree to value and viceversa
 */
const convertRange = (oldMin, oldMax, newMin, newMax, oldValue)  => {
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

function repeatElements(array, repetitionNumber) {
    return array.flatMap(i => Array.from({length: repetitionNumber}).fill(i))
}

/* ----------------------------------------- MUSIC ----------------------------------------- */

export {
    getNotesForScale,
    generateMelody,
    toggleMasterMute,
    transposeNoteBySemitones,
    getSequenceSubdivisionForTimeDivision
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
        return scaleNotes[getRandomInt(0, scaleNotes.length - 1)];
    });
}

function toggleMasterMute() {
    Tone.getDestination().mute = !Tone.getDestination().mute;
}

function transposeNoteBySemitones(note, semitones) {
    let transposeInterval = Tonal.Interval.fromSemitones(semitones);
    return note === "" ? null : Tonal.Note.transpose(note, transposeInterval);
}

function getSequenceSubdivisionForTimeDivision(timeDivision) {
    return timeDivision + "n";
}
