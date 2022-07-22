<script>

</script>

<div class="led-box">
    <div class="led"></div>
</div>

<style>

    .led-box {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .led {
        margin: 0 auto;
        width: 24px;
        height: 24px;
        background-color: #24E0FF;
        border-radius: 50%;
        box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #006 0 -1px 9px, #3F8CFF 0 2px 14px;
        -webkit-animation: blink 1s infinite;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        from { background-color: #24E0FF; }
        50% { background-color: #006; box-shadow: rgba(0, 0, 0, 0.2) 0 -1px 7px 1px, inset #3F8CFF 0 -1px 9px, #24E0FF 0 2px 0; }
        to { background-color: #24E0FF; }
    }

</style>