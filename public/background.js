const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('background').appendChild(renderer.domElement);

const clock = new THREE.Clock();

const material = new THREE.ShaderMaterial({
    uniforms: {
        u_resolution: { value: [window.innerWidth, window.innerHeight] },
        u_time: { value: 0 },
        u_mouse: { value: [0, 0] },
        u_speed: { value: 1.0 },
        u_pixelSize: { value: 2.0 },
        u_ditherScale: { value: 1.0 },
        u_rotSpeed: { value: 0.1 },
        u_warpAmpl: { value: 3.1123123123 },
        u_audioIntensity: { value: 0.5 },
        u_bgColorR: { value: 242.0 / 255.0 },
        u_bgColorG: { value: 242.0 / 255.0 },
        u_bgColorB: { value: 242.0 / 255.0 }
    },
    vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_speed;
        uniform float u_pixelSize;
        uniform float u_ditherScale;
        uniform float u_rotSpeed;
        uniform float u_warpAmpl;
        uniform float u_audioIntensity;
        uniform float u_bgColorR;
        uniform float u_bgColorG;
        uniform float u_bgColorB;

        #define HEX(hex) vec4( \
            float((hex >> 16) & 0xFF) / 255.0, \
            float((hex >> 8)  & 0xFF) / 255.0, \
            float((hex >> 0)  & 0xFF) / 255.0, \
            float((hex >> 24) & 0xFF) / 255.0  \
        )

        const vec4 COLOR_LIGHT = HEX(0xff228b);
        const float WARP_INIT = 1.0;
        const float WARP_ITER = 2.112312321;

        const float BAYER_MATRIX[16] = float[](
            0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
           12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
            3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
           15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
        );

        vec2 transformUV(vec2 uv) {
            float angle = u_time * u_speed * u_rotSpeed;
            uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;

            float t = u_time * u_speed;
            for (float i = WARP_INIT; i < WARP_ITER; i++) {
                float iInv = 1.0 / i;

                vec2 oscillation = vec2(
                    sin(i * 0.5 + t * 0.25 + u_mouse.x) * cos(t + uv.y * 1.5),
                    cos(i * 0.7 + t * 0.35 + u_mouse.y) * sin(t + uv.x * 1.2)
                );

                vec2 modulation = vec2(
                    0.2 * sin(t * 0.6 + uv.y * 3.0),
                    0.3 * cos(t * 0.8 + uv.x * 2.5)
                );

                uv += u_warpAmpl * iInv * (oscillation + modulation);
            }

            return uv;
        }

        float getDither(vec2 pos) {
            vec2 scaled = pos / u_pixelSize * u_ditherScale;
            int index = int(mod(scaled.x, 4.0)) + int(mod(scaled.y, 4.0)) * 4;
            return BAYER_MATRIX[index];
        }

        void main() {
            vec4 COLOR_DARK = vec4(u_bgColorR, u_bgColorG, u_bgColorB, 1.0);

            vec2 pixelatedCoord = floor(gl_FragCoord.xy / u_pixelSize) * u_pixelSize + u_pixelSize / 2.0;
            vec2 uv = (2.0 * pixelatedCoord - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

            uv = transformUV(uv);

            float intensity = 0.5 + 0.5 * sin(u_time * u_speed - uv.x - uv.y) * u_audioIntensity;
            float threshold = getDither(gl_FragCoord.xy);

            gl_FragColor = mix(COLOR_DARK, COLOR_LIGHT, step(threshold, intensity));
        }
    `
});

const geometry = new THREE.PlaneGeometry(2, 2);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

function animate() {
    requestAnimationFrame(animate);
    material.uniforms.u_time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.u_resolution.value = [window.innerWidth, window.innerHeight];
});

let isDragging = false;
document.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateMouse(e);
});
document.addEventListener('mousemove', (e) => {
    if (isDragging) updateMouse(e);
});
document.addEventListener('mouseup', () => {
    isDragging = false;
});
document.addEventListener('touchstart', (e) => {
    updateMouse(e.touches[0]);
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    updateMouse(e.touches[0]);
}, { passive: false });

function updateMouse(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    material.uniforms.u_mouse.value = [x, y];
    material.uniforms.u_warpAmpl.value = 3.0 + Math.abs(x) * 5.0;
    material.uniforms.u_rotSpeed.value = 0.1 + Math.abs(y) * 0.5;
}

window.adjustShader = {
    setSpeed: (value) => material.uniforms.u_speed.value = value,
    setPixelSize: (value) => material.uniforms.u_pixelSize.value = value,
    setDitherScale: (value) => material.uniforms.u_ditherScale.value = value,
    setAudioIntensity: (value) => material.uniforms.u_audioIntensity.value = value,
    setBgColorR: (value) => material.uniforms.u_bgColorR.value = value / 255.0,
    setBgColorG: (value) => material.uniforms.u_bgColorG.value = value / 255.0,
    setBgColorB: (value) => material.uniforms.u_bgColorB.value = value / 255.0
};