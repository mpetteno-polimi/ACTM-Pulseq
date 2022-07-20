<script>
    export let size;
    export let degree;
    export let activeDegree;
</script>

<div class={degree <= activeDegree ? "tick active" : "tick"}
     style="--height: {size + 10}px; --left: {size - 1}px; --top: {size + 2}px; --rotation: {degree};">
</div>

<style>
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
</style>