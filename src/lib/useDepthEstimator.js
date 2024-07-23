import { pipeline, env, RawImage } from "@xenova/transformers";
import { useEffect, useState } from "react";
// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Proxy the WASM backend to prevent the UI from freezing
env.backends.onnx.wasm.proxy = true;

const useDepthEstimator = (imgUrl) => {
  const [model, setModel] = useState();
  const [output, setOutput] = useState();

  // Init model
  useEffect(() => {
    async function init() {
      const depthEstimator = await pipeline(
        "depth-estimation",
        "Xenova/depth-anything-small-hf"
        // 'onnx-community/depth-anything-v2-small'
      );

      setModel(() => depthEstimator);
    }

    init();
  }, []);

  // Perform prediction
  useEffect(() => {
    async function predict() {
      const image = await RawImage.fromURL(imgUrl);

      const { depth } = await model(image);

      setOutput(depth);
    }

    if (model) {
      predict();
    }
  }, [model, imgUrl]);

  return output;
};

export default useDepthEstimator;
