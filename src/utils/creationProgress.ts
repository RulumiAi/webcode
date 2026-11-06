import type { ApiGenerationJob } from '../api';

export function readablePortrait(job: Pick<ApiGenerationJob, 'outputs'> | null | undefined) {
  return job?.outputs.find((output) => output.mediaType === 'image' && Boolean(output.url)) || null;
}
