import { forwardRef } from "react";
import CustomShaderMaterial from "three-custom-shader-material";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const PaintingMaterial = forwardRef(function PaintingMaterial(
  { uniforms, map, displacementScale = 2, displacementMap },
  ref
) {
  useFrame(({ clock }) => {
    ref.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <CustomShaderMaterial
      ref={ref}
      baseMaterial={THREE.MeshStandardMaterial}
      // baseMaterial={THREE.MeshBasicMaterial}
      uniforms={uniforms}
      toneMapped={false}
      map={map}
      transparent
      displacementScale={displacementScale}
      displacementMap={displacementMap}
      vertexShader={
        /* glsl */ `
        varying vec2 vUv;

        void main() {
          vUv = uv;
        }
      `
      }
      fragmentShader={
        /* glsl */ `
        uniform sampler2D uBrush;
        uniform vec2 uMouse;
        uniform float uTime;

        varying vec2 vUv;

        void main() {
          float brush = texture(uBrush, vUv).r;
          float alpha = 1.0 - brush;

          // Perform color mixing on mouse position
          // float distToMouse = distance(uMouse, vUv);
          // csm_DiffuseColor.a = distToMouse;

          // csm_DiffuseColor.a = step(startTime, uTime) * alpha;
          csm_DiffuseColor.a = alpha;
        }
      `
      }
    />
  );
});

export default PaintingMaterial;
