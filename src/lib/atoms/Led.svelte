<script>
    export let isBlinking = false;
    export let blinkDuration = 0.5;
</script>

<led>
    <div class="led" class:animate="{isBlinking}" style="--blinkDuration: {blinkDuration}s"></div>
</led>

<style>

    led {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .led {
        margin: 0 auto;
        width: 24px;
        height: 24px;
        background-color: #006;
        border-radius: 50%;
        box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #3F8CFF 0 -1px 9px, #24E0FF 0 2px 0;
    }

    .led.animate {
        -webkit-animation: blink var(--blinkDuration);
        animation: blink var(--blinkDuration);
    }

    @keyframes blink {
        from {
            background-color: #006;
            box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #3F8CFF 0 -1px 9px, #24E0FF 0 2px 0;
        }
        50% {
            background-color: #24E0FF;
        }
        to {
            background-color: #006;
            box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #3F8CFF 0 -1px 9px, #24E0FF 0 2px 0;
        }
    }

</style>