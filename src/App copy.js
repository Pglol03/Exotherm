import React, { useState } from "react";
import * as THREE from "three";
import { Clipper } from "js-clipper";
import gcode from "gcode-utils";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import Dropzone from "react-dropzone";
import { StlViewer } from 'react-stl-file-viewer'
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

const slicer = new Clipper();

const App = () => {
  const [infillDensity, setInfillDensity] = useState(50); // default value is 50
  const [filesx, setFile] = useState();
  const [volume, setvolume] = useState(0);
  const handleDrop = (event) => {
    setFile(URL.createObjectURL(event[0]));
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target.result;
      const geometry = loadStl(buffer);
      const layers = sliceGeometry(geometry);
      const gcodeData = generateGcode(layers, infillDensity);
      downloadGcode(gcodeData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target.result;
      const geometry = loadStl(buffer);
      const layers = sliceGeometry(geometry);
      const gcodeData = generateGcode(layers, infillDensity);
      downloadGcode(gcodeData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInfillDensityChange = (value) => {
    setInfillDensity(value);
  };

  const loadStl = (buffer) => {
    const geometry = new THREE.BufferGeometry();
    const loader = new STLLoader();
    const array = new Uint8Array(buffer);
    const blob = new Blob([array]);
    const url = URL.createObjectURL(blob);
    loader.load(url, (geometry) => { });
    return geometry;
  };

  const sliceGeometry = (geometry) => {
    const model = slicer.AddModel(geometry);
    const layers = slicer.Execute(Clipper.OperationType.Intersection, 0.1);
    return layers;
  };

  const generateGcode = (layers, infillDensity) => {
    const gcodeData = layers.map((layer) => {
      const path = layer.map((polygon) =>
        polygon.map((point) => ({ x: point.X, y: point.Y }))
      );
      const gcodeLayer = gcode.fromPath(path, {
        feedrate: 100,
        plungeRate: 20,
        bitWidth: 0.4,
        infillDensity: infillDensity / 100, // convert from percentage to decimal
      });
      return gcodeLayer;
    });
    return gcodeData.join("\n");
  };

  const downloadGcode = (data) => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "gcode.nc";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSliceAndDownload = () => {
    downloadGcode();
  };



  return (
    <div>
      <Dropzone onDrop={handleDrop}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps({ className: "dropzone" })}>
            <input {...getInputProps()} />
            <p>Drag'n'drop files, or click to select files</p>
          </div>
        )}
      </Dropzone>
      <Slider
        min={0}
        max={100}
        step={1}
        value={infillDensity}
        onChange={handleInfillDensityChange}
      />
      <div>Infill Density: {infillDensity}%</div>
      <div>
        <div>
          <div>Canvas</div>
          <StlViewer
          width={500}
          height={500}
          url={filesx}
          groundColor="rgb(255, 255, 255)"
          objectColor="rgb(17, 137, 137)"
          skyboxColor="rgb(255, 255, 255)"
          gridLineColor="rgb(0, 0, 0)"
          lightColor="rgb(255, 255, 255)"
          volume={setvolume}
        />
        </div>
        <button onClick={handleSliceAndDownload}>Slice and Download</button>
      </div>
    </div>
  );
};
export default App