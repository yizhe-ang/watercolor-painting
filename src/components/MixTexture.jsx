import { useFBO } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { noiseFn } from "../lib/glsl";

const MixTexture = forwardRef(function MixTexture(
  { vertexShader = vert, fragmentShader = frag, renderTarget, uniforms },
  ref
) {
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    []
  );

  // let targetA = renderTarget;
  let targetA = useFBO();
  let targetB = useFBO();

  useFrame(({ gl }) => {
    gl.setRenderTarget(targetA);
    gl.render(scene, camera);

    // FIXME: Have to update uPrev you fool

    let temp = targetA;
    targetA = targetB;
    targetB = temp;

    ref.current = temp

    gl.setRenderTarget(null);
  });

  return (
    <>
      {createPortal(
        <>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              // ref={ref}
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

varying vec2 vUv;

${noiseFn}

void main() {
  // Perform color mixing on mouse position

  float distToMouse = distance(uMouse, vUv);
  float forceMix = smoothstep(0.0, 1.0, distToMouse);

  vec2 force = snoise2(vec3(vUv, 0.0));
  // force = mix(vec2(0.0), force, forceMix);

  // vec4 color = texture(uPrev, vUv + force);

  vec4 color = texture(uPrev, vUv);

  gl_FragColor = color *= 0.5;
}
`;

export default MixTexture;
