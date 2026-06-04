import { api } from "../api";

interface Props {
  fileId: string;
}

/** Streams audio from the Audio service (range requests enable scrubbing). */
export function AudioPlayer({ fileId }: Props) {
  return (
    <audio controls preload="metadata" src={api.audioUrl(fileId)}>
      Your browser does not support the audio element.
    </audio>
  );
}
