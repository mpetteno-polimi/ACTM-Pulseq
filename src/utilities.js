
/* -- Converts current degree to value and viceversa -- */
export function convertRange(oldMin, oldMax, newMin, newMax, oldValue) {
    return Math.floor((oldValue - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin);
}