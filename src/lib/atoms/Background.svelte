<script>
    import * as THREE from 'three';
    import {onMount} from "svelte";
    import vertexShader from "../shaders/background/vertexShader.glsl";
    import fragmentShader from "../shaders/background/fragmentShader.glsl";

    let canvas, renderer, material, mesh;
    let uniforms = {
        u_time: {
            type: "f",
            value: 1.0
        },
        u_resolution: {
            type: "v2",
            value: new THREE.Vector2()
        },
        u_mouse: {
            type: "v2",
            value: new THREE.Vector2()
        }
    };

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.x = renderer.domElement.width;
        uniforms.u_resolution.value.y = renderer.domElement.height;
    }

    function animate() {
        render();
        requestAnimationFrame(animate);
    }

    function render() {
        uniforms.u_time.value += 0.05 * (1 + uniforms.u_mouse.value.x / 200);
        renderer.render(scene, camera);
    }

    onMount(() => {
        renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
        renderer.setPixelRatio(window.devicePixelRatio);
        material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        camera.position.z = 1;
        resize();
        animate();
    });

</script>

<svelte:window on:resize={resize}/>
<canvas bind:this={canvas}></canvas>

<style>
    canvas {
        width: 100%;
        height: 100%;
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        z-index: -9999;
    }
</style>