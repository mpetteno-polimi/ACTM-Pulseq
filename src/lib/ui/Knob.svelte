<script>
    import Tick from "./Tick.svelte";

    /* -- Props -- */
    export let size = 80;
    export let numTicks = 7;
    export let degrees = 270;
    export let minValue = 10;
    export let maxValue = 30;
    export let currentValue = 19;

    /* -- State -- */
    let fullAngle = degrees;
    let startAngle = (360 - degrees) / 2;
    let endAngle = startAngle + degrees;
    let margin = size * 0.15;
    let currentDegree = convertRange(minValue, maxValue, startAngle, endAngle, currentValue);

    function convertRange(oldMin, oldMax, newMin, newMax, oldValue) {
        return Math.floor((oldValue - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin);
    }

    function startDrag(event) {
        const knob = event.target.getBoundingClientRect();
        const pts = {
            x: knob.left + knob.width / 2,
            y: knob.top + knob.height / 2
        };
        const moveHandler = e => {
            currentDegree = getDegree(e.clientX, e.clientY, pts);
            if (currentDegree === startAngle) currentDegree--;
            currentValue = convertRange(startAngle, endAngle, minValue, maxValue, currentDegree);
        };
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", e => {
            document.removeEventListener("mousemove", moveHandler);
        });
    }

    function getDegree(cX, cY, pts) {
        const x = cX - pts.x;
        const y = cY - pts.y;
        let deg = Math.atan(y / x) * 180 / Math.PI;
        if ((x < 0 && y >= 0) || (x < 0 && y < 0)) {
            deg += 90;
        } else {
            deg += 270;
        }
        return Math.min(Math.max(startAngle, deg), endAngle);
    }
</script>

<div class="knob" style="--size: {size}px;">
    <div class="ticks">
        {#each Array.from({ length: (endAngle - startAngle) / (fullAngle / numTicks) + 1}, (_, i) => startAngle +
            (i * (fullAngle / numTicks))) as tickDegree, index}
            <Tick size={margin + size / 2} degree={tickDegree} activeDegree="{currentDegree}"/>
        {/each}
    </div>
    <div class="knob outer"
         style="--size: {size}px; --margin: {margin}px; --rotation: {currentDegree}; --random: {Math.random()*100}"
         on:mousedown|preventDefault={startDrag}>
        <div class="knob inner" style="--size: {size}px; --rotation: {currentDegree};">
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

    .knob .ticks {
        position: absolute;
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
        background-image: radial-gradient(
                100% 70%,
                hsl(210,calc(var(--rotation) * 1%),calc(var(--rotation) / 5 * 1%)),
                hsl(var(--random),20%,calc(var(--rotation) / 36 * 1%))
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