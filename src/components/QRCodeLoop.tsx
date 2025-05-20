import { QRCodeSVG } from "qrcode.react";
import { useState, useRef, useEffect, type Key } from "react";

export const QRCodeLoop = ({ frames, size, fps }: { frames: string[]; size: number; fps: number }) => {
  const [frame, setFrame] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const nextFrame = (frame: number, frames: string[]) => {
      frame = (frame + 1) % frames.length;
      return frame;
    };

    let lastT: number;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      if ((t - lastT) * fps < 1000) return;
      lastT = t;
      setFrame((prevFrame) => nextFrame(prevFrame, frames));
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [frames, fps]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundColor: "#fff",
      }}>
      {frames.map((chunk: any, i: Key) => (
        <div key={i} style={{ position: "absolute", opacity: i === frame ? 1 : 0 }}>
          <QRCodeSVG fgColor="#000" bgColor="#fff" size={size} value={chunk} />
        </div>
      ))}
    </div>
  );
};
