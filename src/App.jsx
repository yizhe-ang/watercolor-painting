import { Canvas } from "@react-three/fiber";
import "./App.css";
import Scene from "./components/Scene";
import useDepthEstimator from "./lib/useDepthEstimator";

// FIXME: Image resolution is also a performance bottleneck
const img = "/watercolor_1.jpeg";

function App() {
  // Perform depth estimation
  const output = useDepthEstimator(img);

  return (
    <div className="fixed inset-0">
      {!output && (
        <div className="absolute inset-0 bg-stone-500 animate-pulse" />
      )}
      <Canvas>
        {output && <Scene img={img} depth={output} />}
        {/* <Scene img={img} /> */}
      </Canvas>
    </div>
  );
}

export default App;
