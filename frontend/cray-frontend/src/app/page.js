import Image from "next/image";
import { Splitter, SplitterPanel } from "primereact/splitter";
import PixiCanvas from "./pixi-canvas";

export default function Home() {
  return (
    <Splitter style={{ height: '90vh' }}>
        <SplitterPanel className="flex align-items-center justify-content-center" size={70}>
          <PixiCanvas />
        </SplitterPanel>
        <SplitterPanel className="flex align-items-center justify-content-center" size={30}>Panel 2</SplitterPanel>
    </Splitter>
  );
}
