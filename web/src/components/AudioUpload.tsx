import { useRef } from "react";

interface Props {
  onSelected: (file: File) => void;
  disabled?: boolean;
}

/** Lets the user pick an audio file (e.g. an mp3) from disk. */
export function AudioUpload({ onSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <span className="upload">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        disabled={disabled}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelected(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        ⬆ Upload mp3
      </button>
    </span>
  );
}
