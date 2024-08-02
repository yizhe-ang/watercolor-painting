import { useTexture } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMotionValueEvent, useSpring } from "framer-motion";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

const CursorLine = ({
  cursorPositionX,
  cursorPositionY,
  color,
  width,
  stiffness,
  damping,
}) => {
  // FIXME: Do tapering
  const ref = useRef();

  const points = useMemo(() => {
    const points = [];

    for (let j = 0; j < 50; j++) {
      points.push(new THREE.Vector3(0, 0, 0.001));
    }

    return points;
  }, []);

  const brushMap = useTexture("/stroke.png");

  // const sprungX = useSpring(cursorPositionX, { stiffness, damping });
  // const sprungY = useSpring(cursorPositionY, { stiffness, damping });

  // We set the first point in the array to equal
  // our sprungCursor store whenever it updates
  // useMotionValueEvent(sprungX, "change", (x) => {
  //   points[0].x = sprungX.get();
  //   points[0].y = sprungY.get();

  //   console.log(points[0])
  // });
  useMotionValueEvent(cursorPositionX, "change", (x) => {
    points[0].x = cursorPositionX.get();
    points[0].y = cursorPositionY.get();
  });

  useFrame(({ viewport }) => {
    let previousPoint = points[0];
    // Every frame we loop through each point
    points.forEach((point, i) => {
      if (previousPoint && i > 0) {
        // ... and for every point (except the first)
        // we lerp it towards the point before it
        point.lerp(previousPoint, 0.75);
        previousPoint = point;
      }
    });

    ref.current.geometry.setPoints(points);
  });

  return (
    <mesh ref={ref}>
      <meshLineGeometry points={points} />
      <meshLineMaterial
        lineWidth={width}
        color={"black"}
        // map={brushMap}
        // useMap={true}
        alphaMap={brushMap}
        useAlphaMap={true}
        depthTest={false}
        transparent={true}
        // sizeAttenuation={false}
        // toneMapped={false}
        repeat={new THREE.Vector2(1, 2)}
      />
    </mesh>
  );
};

export default CursorLine;
