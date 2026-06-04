import { useRef, useState } from "react";

interface Props {
  onRecorded: (blob: Blob, filename: string) => void;
  disabled?: boolean;
}

/** Records audio in the browser via MediaRecorder and emits a WebM/Opus blob. */
export function AudioRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes("ogg") ? "ogg" : "webm";
        onRecorded(blob, `recording-${Date.now()}.${ext}`);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microphone unavailable");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <span className="recorder">
      {recording ? (
        <button type="button" onClick={stop} className="danger">
          ⏹ Stop
        </button>
      ) : (
        <button type="button" onClick={start} disabled={disabled}>
          ⏺ Record
        </button>
      )}
      {error && <span className="error"> {error}</span>}
    </span>
  );
}
