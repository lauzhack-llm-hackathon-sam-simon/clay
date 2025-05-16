import Image from "next/image";
import { Splitter, SplitterPanel } from "primereact/splitter";

export default function Home() {
  return (
    <Splitter style={{ height: '90vh' }}>
        <SplitterPanel className="flex align-items-center justify-content-center">Panel 1</SplitterPanel>
        <SplitterPanel className="flex align-items-center justify-content-center">Panel 2</SplitterPanel>
    </Splitter>
  );
}
