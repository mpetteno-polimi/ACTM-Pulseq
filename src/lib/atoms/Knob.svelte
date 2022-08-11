<script>
    import {config} from "../../config.js";
    import {createEventDispatcher, onMount} from 'svelte';
    import {fade} from 'svelte/transition';
    import {convertRange} from "../../utilities.js";

    /* -- Event dispatcher -- */
    const dispatch = createEventDispatcher();

    /* -- Props -- */
    export let id;
    export let size = 60;
    export let numTicks = 7;
    export let degrees = 270;
    export let label = "";
    export let tooltipPosition = "left";
    export let values = [""];
    export let minValueIndex = 0;
    export let maxValueIndex = values.length - 1;
    export let valueIndex = 0;
    export let selectedValue = values[valueIndex];
    export let degree = 45;

    /* -- Variables -- */
    let fullAngle = degrees;
    let startAngle = (360 - degrees) / 2;
    let endAngle = startAngle + degrees;
    let margin = size * 0.15;
    let isTooltipEnabled = false;
    let startDragPoint;

    onMount(() => {
        dispatchValueChangedEvent(true);
    })

    function dispatchValueChangedEvent(isOnMountEvent = false) {
        dispatch("knobValueChanged", {
            knobId: id,
            index: valueIndex,
            deg: degree,
            value: selectedValue,
            isOnMount: isOnMountEvent
        });
    }

    /* -- Start knob drag handler -- */
    function startDrag(event) {
        const knobRect = event.target.getBoundingClientRect();
        startDragPoint = {
            x: knobRect.left + knobRect.width / 2,
            y: knobRect.top + knobRect.height / 2
        };
        window.addEventListener("mousemove", rotateKnob);
        isTooltipEnabled = true;
    }

    /* -- End knob drag handler -- */
    function endDrag(event) {
        if (isTooltipEnabled) dispatchValueChangedEvent();
        startDragPoint = null;
        isTooltipEnabled = false;
        window.removeEventListener("mousemove", rotateKnob);
    }

    /* -- Rotate knob on drag handler -- */
    function rotateKnob(event) {
        degree = getCurrentDegree(event.clientX, event.clientY, startDragPoint);
        valueIndex = convertRange(startAngle, endAngle, minValueIndex, maxValueIndex, degree);
        selectedValue = values[valueIndex];
    }

    /* -- Returns the current degree -- */
    function getCurrentDegree(cX, cY, pts) {
        const x = cX - pts.x;
        const y = cY - pts.y;
        let deg = Math.atan(y / x) * 180 / Math.PI;
        deg += (x < 0 && y >= 0) || (x < 0 && y < 0) ? 90 : 270;
        return Math.min(Math.max(startAngle, deg), endAngle);
    }
</script>

<svelte:window on:mouseup|preventDefault={endDrag}/>

{#if label}
    {#key label}
        <span class="label title" in:fade={config.ui.knobs.transitions.label.in}
              out:fade={config.ui.knobs.transitions.label.out}>{label}</span>
    {/key}
{/if}

{#if isTooltipEnabled}
    <div class="tooltip {tooltipPosition}">
        {#if selectedValue}
            <span class="label" in:fade={config.ui.knobs.transitions.tooltip.in}
                  out:fade={config.ui.knobs.transitions.tooltip.out}>{selectedValue}</span>
        {/if}
    </div>
{/if}

<div class="knob" style="--size: {size + 20}px;">
    <div class="ticks" >
        {#each Array.from({length: (endAngle - startAngle) / (fullAngle / numTicks) + 1}, (_, i) => startAngle +
            (i * (fullAngle / numTicks))) as tickDegree, index}
            <div class={tickDegree <= (degree + 1) ? "tick active" : "tick"}
                 style="--height: {margin + size/2 + 10}px; --left: {margin + size/2 - 1}px;
                 --top: {margin + size/2 + 2}px; --rotation: {tickDegree};">
            </div>
        {/each}
    </div>
    <div class="knob outer"
         style="--size: {size}px; --margin: {margin}px; --rotation: {degree}; --random: {Math.random()*100}"
         on:mousedown|preventDefault={startDrag}>
        <div class="knob inner" style="--size: {size}px; --rotation: {degree};">
            <div class="grip"></div>
        </div>
    </div>
</div>


<style>

    .knob {
        width: var(--size);
        height: var(--size);
        display: flex;
        position: relative;
    }

    .title {
        position: absolute;
        bottom: 100px;
    }

    .label {
        color: azure;
    }

    .tooltip {
        position: absolute;
    }

    .tooltip.left {
        right: 135px;
    }

    .tooltip.right {
        left: 135px;
    }

    .knob .ticks {
        position: absolute;
    }

    .tick {
        height: var(--height);
        width: 3px;
        left: var(--left);
        top: var(--top);
        transform: rotate(calc(var(--rotation) * 1deg));
        transform-origin: top;
        position: absolute;
        background: black;
        box-shadow: inset 0 0 0 0 black;
        transition: box-shadow 0.5s;
    }

    .tick.active {
        box-shadow: inset 0 0 5px 2px #509eec, 0 0 0 1px #369;
    }

    .inner {
        border-radius: 50%;
        transform: rotate(calc(var(--rotation) * 1deg));
    }

    .outer {
        border-radius: 50%;
        border: 1px solid #222;
        border-bottom: 5px solid #222;
        box-shadow: 0 5px 15px 2px black, 0 0 5px 3px black, 0 0 0 12px #444;
        margin: var(--margin);
        background-image: radial-gradient(100% 70%,
        hsl(210, calc(var(--rotation) * 1%), calc(var(--rotation) / 5 * 1%)),
        hsl(var(--random), 20%, calc(var(--rotation) / 36 * 1%))
        );
    }

    .grip {
        position: absolute;
        width: 5%;
        height: 5%;
        bottom: 2%;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 50%;
        background: #509eec;
        box-shadow: 0 0 3px 1px black;
    }

</style>