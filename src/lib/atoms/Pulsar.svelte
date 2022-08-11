<script>
    import * as THREE from 'three';
    import {onMount} from "svelte";
    import vertexShader from "../shaders/splash-screen/vertexShader.glsl";
    import fragmentShader from "../shaders/splash-screen/fragmentShader.glsl";

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

    function render() {
        renderer.render(scene, camera);
    }

    function animate() {
        render();
        requestAnimationFrame(animate);
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
        animate();
    });

</script>

<canvas bind:this={canvas}></canvas>