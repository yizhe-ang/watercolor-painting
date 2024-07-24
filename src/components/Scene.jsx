import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import CustomShaderMaterial from "three-custom-shader-material";
import * as THREE from "three";
import { createPortal, extend, useFrame } from "@react-three/fiber";
import {
  Hud,
  OrbitControls,
  OrthographicCamera,
  RenderTexture,
  useFBO,
  useTexture,
} from "@react-three/drei";
import { easing } from "maath";
import EffectMaterial from "../lib/EffectMaterial";
import PaintingMaterial from "./PaintingMaterial";
import MixTexture from "./MixTexture";
import MixBuffer from "./MixBuffer";

extend({ EffectMaterial });

const Scene = ({ img, depth }) => {
  const materialRef = useRef();
  const debugRef = useRef();
  const brushRef = useRef();
  const brushTextureRef = useRef();
  const effectMaterialRef = useRef();
  const mixMaterialRef = useRef();

  // Load depth map
  const displacementMap = useMemo(() => {
    if (!depth) return;

    return new THREE.CanvasTexture(depth.toCanvas());
  }, [depth]);

  // Load image texture
  const map = useTexture(img);
  map.colorSpace = THREE.SRGBColorSpace;

  const { width, height } = map.image;

  // Create plane and rescale it so that max(w, h) = 1
  const [normalizedWidth, normalizedHeight] =
    width > height ? [1, height / width] : [width / height, 1];
  const planeWidth = normalizedWidth * 5;
  const planeHeight = normalizedHeight * 5;

  const fboCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    []
  );

  // Watercolor effect feedback shader setup
  const watercolorScene = useMemo(() => new THREE.Scene(), []);
  let watercolorTargetA = useFBO();
  let watercolorTargetB = useFBO();

  // Mix effect feedback shader setup
  const mixScene = useMemo(() => new THREE.Scene(), []);
  let mixTargetA = useFBO();
  let mixTargetB = useFBO();

  useFrame(({ clock, gl }) => {
    // Watercolor effect feedback setup
    gl.setRenderTarget(watercolorTargetA);
    gl.render(watercolorScene, fboCamera);

    effectMaterialRef.current.uBrush = brushTextureRef.current;
    effectMaterialRef.current.uPrev = watercolorTargetA.texture;
    effectMaterialRef.current.uTime = clock.elapsedTime;

    let watercolorTemp = watercolorTargetA;
    watercolorTargetA = watercolorTargetB;
    watercolorTargetB = watercolorTemp;

    // Mix effect feedback setup
    gl.setRenderTarget(mixTargetA);
    gl.render(mixScene, fboCamera);

    let mixTemp = mixTargetA;
    mixTargetA = mixTargetB;
    mixTargetB = mixTemp;

    // debugRef.current.map = brushTextureRef.current;
    debugRef.current.map = watercolorTargetA.texture;
    // debugRef.current.map = mixTargetA.texture;
    // debugRef.current.map = displacementMap;

    gl.setRenderTarget(null);
  });

  return (
    <>
      {/* <CameraRig /> */}
      <OrbitControls />

      {/* Lighting */}
      <ambientLight args={[0xffffff, 3]} />

      {/* Debug HUD */}
      <HudPlane ref={debugRef}></HudPlane>

      {/* Painting Canvas */}
      <mesh>
        <planeGeometry
          args={[
            planeWidth,
            planeHeight,
            // FIXME: Affects performance
            Math.floor(width / 4),
            Math.floor(height / 4),
          ]}
        />
        <PaintingMaterial
          ref={materialRef}
          uniforms={{
            uTime: {
              value: 0,
            },
            uBrush: {
              value: watercolorTargetA.texture,
            },
            uMouse: {
              value: new THREE.Vector2(),
            },
          }}
          map={map}
          // FIXME: How to load in displacement map smoothly?
          displacementMap={displacementMap}
        ></PaintingMaterial>
      </mesh>

      {/* Flat dummy plane to capture mouse */}
      <mesh
        onPointerMove={(e) => {
          // Move the brush along with the mouse
          if (brushRef.current) {
            const x = e.point.x / (planeWidth / 2);
            const y = e.point.y / (planeHeight / 2);

            brushRef.current.position.x = x;
            brushRef.current.position.y = y;

            // materialRef.current.uniforms.uMouse.value.x = x / 2 + 0.5;
            // materialRef.current.uniforms.uMouse.value.y = y / 2 + 0.5;

            // mixMaterialRef.current.uniforms.uMouse.value.x = x / 2 + 0.5;
            // mixMaterialRef.current.uniforms.uMouse.value.y = y / 2 + 0.5;
          }
        }}
        visible={false}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial />
      </mesh>

      {/* Brush Texture */}
      <RenderTexture ref={brushTextureRef}>
        <OrthographicCamera
          makeDefault
          top={1}
          right={1}
          bottom={-1}
          left={-1}
          near={-0.1}
          far={1}
        />
        {/* <color attach="background" args={["white"]} /> */}
        <mesh ref={brushRef}>
          <sphereGeometry args={[0.01, 30, 30]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </RenderTexture>

      {/* Effect Texture */}
      {createPortal(
        <>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <effectMaterial ref={effectMaterialRef} key={EffectMaterial.key}>
              {/* Initialize texture as white */}
              <RenderTexture attach="uPrev">
                <color attach="background" args={["white"]} />
              </RenderTexture>
            </effectMaterial>
          </mesh>
        </>,
        watercolorScene
      )}

      {/* Mixing Texture */}
      {/* <MixTexture
        ref={mixMaterialRef}
        renderTarget={mixRenderTarget}
        uniforms={{
          uPrev: new THREE.Uniform(map),
          uMouse: new THREE.Uniform(new THREE.Vector2()),
        }}
      /> */}
      <MixBuffer
        scene={mixScene}
        uniforms={{
          uPrev: new THREE.Uniform(map),
          uMouse: new THREE.Uniform(new THREE.Vector2()),
        }}
      />
    </>
  );
};

const HudPlane = forwardRef(({ map }, ref) => {
  return (
    <Hud>
      <OrthographicCamera
        makeDefault
        top={1}
        right={5}
        bottom={-5}
        left={-1}
        near={0}
        far={1}
      />
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial ref={ref} map={map} toneMapped={false} />
      </mesh>
    </Hud>
  );
});

function CameraRig() {
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [
        -1 + (state.pointer.x * state.viewport.width) / 3,
        (1 + state.pointer.y) / 2,
        5.5,
      ],
      0.5,
      delta
    );
    state.camera.lookAt(0, 0, 0);
  });
}

export default Scene;
