import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import CustomShaderMaterial from "three-custom-shader-material";
import * as THREE from "three";
import { createPortal, extend, useFrame, useThree } from "@react-three/fiber";
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
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import CursorLine from "./CursorLine";
import { useMotionValue } from "framer-motion";
import BrushParticles from "./BrushParticles";

extend({ EffectMaterial, MeshLineGeometry, MeshLineMaterial });

const Scene = ({ img, depth }) => {
  const { pointer, viewport } = useThree();

  const [showWatercolorCanvas, setShowWatercolorCanvas] = useState(false);

  const cursorPositionX = useMotionValue(0);
  const cursorPositionY = useMotionValue(0);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     setShowWatercolorCanvas(true);
  //   }, 3000);

  //   return () => clearTimeout(timeout);
  // }, []);

  useEffect(() => {
    function handleMousemove() {
      const { width, height } = viewport.getCurrentViewport();
      cursorPositionX.set((pointer.x * width) / 2);
      cursorPositionY.set((pointer.y * height) / 2);
    }

    window.addEventListener("mousemove", handleMousemove);

    return () => {
      window.removeEventListener("mousemove", handleMousemove);
    };
  }, [pointer, viewport, cursorPositionX, cursorPositionY]);

  const materialRef = useRef();
  const debugRef = useRef();
  const brushRef = useRef();
  const brushTextureRef = useRef();
  const effectMaterialRef = useRef();
  const mixMaterialRef = useRef();

  const brushMap = useTexture("/brush-texture.png");

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

  // For ping-pong
  const fboScene = useMemo(() => new THREE.Scene(), []);
  const fboCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
    []
  );
  let targetA = useFBO();
  let targetB = useFBO();

  const mixRenderTarget = useFBO();

  useFrame(({ clock, gl }, delta) => {
    // Render FBO
    gl.setRenderTarget(targetA);
    gl.render(fboScene, fboCamera);

    effectMaterialRef.current.uBrush = brushTextureRef.current;
    effectMaterialRef.current.uPrev = targetA.texture;
    // effectMaterialRef.current.uTime = clock.elapsedTime;
    effectMaterialRef.current.uTime += delta

    // debugRef.current.map = brushTextureRef.current;
    // debugRef.current.map = targetA.texture;
    // debugRef.current.map = mixRenderTarget.texture;
    // debugRef.current.map = mixMaterialRef.current.uniforms.uPrev.value;
    // debugRef.current.map = mixMaterialRef.current.texture;
    // debugRef.current.map = displacementMap;

    // materialRef.current.map = mixMaterialRef.current.uniforms.uPrev.value;

    gl.setRenderTarget(null);

    // Ping-pong swap
    let temp = targetA;
    targetA = targetB;
    targetB = temp;
  });

  return (
    <>
      <CameraRig />
      <OrbitControls />

      {/* Lighting */}
      <ambientLight args={[0xffffff, 3]} />

      {/* Debug HUD */}
      {/* <HudPlane ref={debugRef}></HudPlane> */}

      {/* Brush Particles */}
      <BrushParticles
        planeWidth={planeWidth}
        planeHeight={planeHeight}
        texture={map}
      />

      {/* Painting Canvas */}
      {/* {showWatercolorCanvas && ( */}
        <mesh>
          <planeGeometry
            args={[
              planeWidth,
              planeHeight,
              // FIXME: Affects performance
              64,
              64,
              // Math.floor(width / 4),
              // Math.floor(height / 4),
            ]}
          />
          <PaintingMaterial
            ref={materialRef}
            uniforms={{
              uTime: {
                value: 0,
              },
              uBrush: {
                value: targetA.texture,
              },
              uMouse: {
                value: new THREE.Vector2(),
              },
            }}
            map={map}
            // map={brushMap}
            // FIXME: How to load in displacement map smoothly?
            displacementMap={displacementMap}
          ></PaintingMaterial>
        </mesh>
      {/* )} */}

      {/* Flat dummy plane to capture mouse */}
      {/* FIXME: Is this causing lag? */}
      <mesh
        position-z={0.1}
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
        fboScene
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

      {/* Cursor effects */}
      {/* <CursorLine
        cursorPositionX={cursorPositionX}
        cursorPositionY={cursorPositionY}
        color={"black"}
        // width={0.05}
        width={0.1}
        // stiffness={0.02}
        // damping={0.25}
      /> */}
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
        4.5,
      ],
      0.5,
      delta
    );
    state.camera.lookAt(0, 0, 0);
  });
}

export default Scene;
