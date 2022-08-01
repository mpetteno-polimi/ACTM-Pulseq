<script>
    import {fade} from 'svelte/transition';
    import Logo from "./atoms/Logo.svelte";
    import {createEventDispatcher} from "svelte";

    /* -- Event dispatcher -- */
    const dispatch = createEventDispatcher();

    function dispatchInteractionEvent() {
        dispatch("interaction");
    }
</script>

<splash-screen on:click={dispatchInteractionEvent} on:keydown={dispatchInteractionEvent} out:fade>
    <Logo />
    <span>Click anywhere or press a key to start</span>
</splash-screen>

<style>

    splash-screen {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    span {
        color: whitesmoke;
        margin: 30px 0;
    }

</style>