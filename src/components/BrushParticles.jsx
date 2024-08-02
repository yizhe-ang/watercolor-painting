import {
  ComputedAttribute,
  shaderMaterial,
  useTexture,
} from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute } from "three";

const BrushParticleMaterial = shaderMaterial(
  { uTexture: null, uBrushTexture: null, uTime: 0 },
  /* glsl */ `
  attribute float aPointSize;
  attribute float aScaleX;
  attribute float aScaleY;
  attribute float aStartTime;

  varying vec2 vUv;
  varying float vScaleX;
  varying float vScaleY;
  varying float vStartTime;

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    float offset = noise(position.xy * 5.0) * 0.05;

    gl_Position = projectedPosition + offset;

    gl_PointSize = aPointSize * 160.0 * (1.0 / -viewPosition.z);

    vUv = uv;
    vScaleX = aScaleX;
    vScaleY = aScaleY;
    vStartTime = aStartTime;
  }
`,
  /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uBrushTexture;
  uniform float uTime;

  varying vec2 vUv;
  varying float vScaleX;
  varying float vScaleY;
  varying float vStartTime;

  mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
  }

  float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  void main() {
    vec3 color = texture(uTexture, vUv).rgb;

    float gray = dot(color, vec3(0.299, 0.587, 0.114));

    // float pu = (1.0 - gl_PointCoord.x) * 2.0;
    // float pv = gl_PointCoord.y;
    // float alpha = texture(uBrushTexture, rotate2d(0.5) * vec2(pu, pv)).r;

    vec2 pointCoord = vec2((1.0 - gl_PointCoord.x) * vScaleX, gl_PointCoord.y * vScaleY);
    vec2 centeredCoord = (pointCoord - 0.5) * 2.0;
    // vec2 rotatedCoord = rotate2d(radians(90.0)) * centeredCoord;
    vec2 rotatedCoord = rotate2d(0.0) * centeredCoord;
    vec2 puv = (rotatedCoord / 2.0) + 0.5;
    float alpha = texture(uBrushTexture, puv).r;

    // float vStartTime = (noise(vUv * 50.0) * 0.5 + 0.5) * 2.0;

    float showDuration = 1.0;
    float show = smoothstep(vStartTime + pointCoord.x + pointCoord.y, showDuration + vStartTime + 0.7, uTime + pointCoord.x + pointCoord.y);

    gl_FragColor = vec4(vec3(gray), alpha * show);
  }
`
);

extend({ BrushParticleMaterial });

const BrushParticles = ({ planeWidth, planeHeight, texture, size = 96 }) => {
  const materialRef = useRef();

  const brushTexture = useTexture(import.meta.env.BASE_URL + "/brush-texture.png");

  useFrame(({ clock }, delta) => {
    // materialRef.current.uTime = clock.getElapsedTime();
    materialRef.current.uTime += delta
  });

  return (
    <points>
      <planeGeometry args={[planeWidth, planeHeight, size, size]}>
        <ComputedAttribute
          name="aPointSize"
          compute={(geometry) => {
            geometry.setIndex(null);
            geometry.deleteAttribute("normal");

            const array = new Float32Array(geometry.attributes.position.count);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
              array[i] = Math.random() * 0.5 + 0.5;
            }

            return new BufferAttribute(array, 1);
          }}
        />
        <ComputedAttribute
          name="aScaleX"
          compute={(geometry) => {
            const array = new Float32Array(geometry.attributes.position.count);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
              array[i] = Math.random() * 0.2 + 1.0;
            }

            return new BufferAttribute(array, 1);
          }}
        />
        <ComputedAttribute
          name="aScaleY"
          compute={(geometry) => {
            const array = new Float32Array(geometry.attributes.position.count);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
              array[i] = Math.random() * 0.2 + 1.0;
            }

            return new BufferAttribute(array, 1);
          }}
        />
        <ComputedAttribute
          name="aStartTime"
          compute={(geometry) => {
            const array = new Float32Array(geometry.attributes.position.count);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
              array[i] = Math.random() * 2.0;
            }

            return new BufferAttribute(array, 1);
          }}
        />
      </planeGeometry>
      <brushParticleMaterial
        ref={materialRef}
        depthWrite={false}
        depthTest={false}
        transparent
        uTexture={texture}
        uBrushTexture={brushTexture}
      />
    </points>
  );
};

export default BrushParticles;
