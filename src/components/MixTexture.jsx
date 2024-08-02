import { useFBO } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { noise3Fn, noise2Fn } from "../lib/glsl";

const MixTexture = forwardRef(function MixTexture(
  { vertexShader = vert, fragmentShader = frag, renderTarget, uniforms },
  ref
) {
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    []
  );

  let targetA = useFBO();
  let targetB = useFBO();

  useFrame(({ gl, clock }) => {
    gl.setRenderTarget(targetA);
    gl.render(scene, camera);

    ref.current.uniforms.uPrev.value = targetA.texture;
    ref.current.uniforms;

    let temp = targetA;
    targetA = targetB;
    targetB = temp;

    gl.setRenderTarget(null);
  });

  return (
    <>
      {createPortal(
        <>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              ref={ref}
              uniforms={uniforms}
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
            />
          </mesh>
        </>,
        scene
      )}
    </>
  );
});

const vert = /* glsl */ `
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUv = uv;
}
`;

const frag = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uTime;

varying vec2 vUv;

${noise3Fn}

void main() {
  // Perform color mixing on mouse position
  float distToMouse = distance(uMouse, vUv);
  float forceMix = smoothstep(0.05, 0.0, distToMouse);

  vec2 noise = snoise2(vec3(vUv * 5.0, uTime * 0.1)) * 0.01;

  // vec2 noise = snoise2(vUv / 50.0) + snoise2(vUv);
  // vec2 noise = snoise2(vUv * 20.0);
  // noise = noise * 0.5;

  vec2 force = mix(vec2(0.0), noise, forceMix);

  vec4 color = texture(uPrev, vUv + (force * 1.0));

  // FIXME: How to make it return back to normal

  // FIXME: How to create blending and color mixing?

  gl_FragColor = color;
  // gl_FragColor = vec4(vec3(forceMix), 1.0);
}
`;

export default MixTexture;
