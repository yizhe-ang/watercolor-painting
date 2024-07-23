import { useFBO } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const FeedbackTexture = ({
  vertexShader = vert,
  fragmentShader = frag,
  renderTarget,
  initialTexture,
}) => {
  const materialRef = useRef();

  const uniforms = useMemo(() => {
    return {
      uPrev: new THREE.Uniform(initialTexture),
      uTime: new THREE.Uniform(0),
    };
  }, [initialTexture]);

  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    []
  );

  let targetA = renderTarget;
  let targetB = useFBO();

  useFrame(({ clock, gl }) => {
    gl.setRenderTarget(targetA);
    gl.render(scene, camera);

    materialRef.current.uniforms.uPrev.value = targetA.texture;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;

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
              ref={materialRef}
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
};

const vert = /* glsl */ `
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vUv = uv;
}
`;

const frag = /* glsl */ `
uniform sampler2D uPrev;

varying vec2 vUv;

void main() {
  vec4 prev = texture(uPrev, vUv);

  vec4 color = prev;

  gl_FragColor = color;
}
`;

export default FeedbackTexture;
