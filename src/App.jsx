import { Canvas } from "@react-three/fiber";
import "./App.css";
import Scene from "./components/Scene";
import useDepthEstimator from "./lib/useDepthEstimator";
import { useControls } from "leva";

// FIXME: Image resolution is also a performance bottleneck
const imgUrl = import.meta.env.BASE_URL + "/watercolor_1.jpeg";

function App() {
  const { Image: img } = useControls({
    Image: { image: imgUrl },
  });

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
