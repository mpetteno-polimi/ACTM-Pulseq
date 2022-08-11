<script>
    import {config} from "../config.js";
    import {fade} from 'svelte/transition';
    import {createEventDispatcher} from "svelte";

    /* -- Event dispatcher -- */
    const dispatch = createEventDispatcher();

    function dispatchInteractionEvent() {
        dispatch("interaction");
    }
</script>

<svelte:window on:click={dispatchInteractionEvent} on:keydown={dispatchInteractionEvent} />
<splash-screen out:fade={config.ui.splashScreen.transition.out}>
    <span>{config.ui.splashScreen.text}</span>
</splash-screen>

<style>

    splash-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: absolute;
        top:0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
    }

    span {
        color: whitesmoke;
        margin: 30px 0;
        font-size: larger;
    }

</style>