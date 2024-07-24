import { useFBO } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { noiseFn } from "../lib/glsl";

const MixBuffer = forwardRef(function MixBuffer({ scene, uniforms }, ref) {
  // const camera = useMemo(
  //   () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
  //   []
  // );

  // useFrame(({ gl }) => {
  //   gl.setRenderTarget(targetA);
  //   gl.render(scene, camera);

  //   let temp = targetA;
  //   targetA = targetB;
  //   targetB = temp;

  //   ref.current = temp;

  //   gl.setRenderTarget(null);
  // });

  return (
    <>
      {createPortal(
        <>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              // ref={ref}
              uniforms={uniforms}
              vertexShader={vert}
              fragmentShader={frag}
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

varying vec2 vUv;

${noiseFn}

void main() {
  // Perform color mixing on mouse position

  float distToMouse = distance(uMouse, vUv);
  float forceMix = smoothstep(0.0, 1.0, distToMouse);

  vec2 force = snoise2(vec3(vUv, 0.0));
  // force = mix(vec2(0.0), force, forceMix);

  // vec4 color = texture(uPrev, vUv + force);

  vec4 color = texture(uPrev, vUv) * 0.5;

  gl_FragColor = color;
}
`;

export default MixBuffer;
