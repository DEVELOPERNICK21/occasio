/**
 * What went wrong while getting a photo, and what to tell the person. Closing the
 * picker is not a problem at all; a switched-off permission is one they can fix
 * themselves in Settings, so the message says exactly that.
 */
export type PhotoProblem =
  | { kind: 'library_permission'; title: string; message: string }
  | { kind: 'camera_permission'; title: string; message: string }
  | { kind: 'other'; title: string; message: string };

function codeOf(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  return String((error as { code: unknown }).code);
}

/** The person closed the picker or the crop screen. */
export function isPickerCancelled(error: unknown): boolean {
  return codeOf(error) === 'E_PICKER_CANCELLED';
}

/** Null when there is nothing to say (cancelled); otherwise the words to show. */
export function describePickerError(error: unknown): PhotoProblem | null {
  if (isPickerCancelled(error)) return null;

  const code = codeOf(error);
  if (code === 'E_NO_LIBRARY_PERMISSION') {
    return {
      kind: 'library_permission',
      title: 'Photo access is off',
      message: 'Allow Occasio to see your photos in Settings, then come back and choose some.',
    };
  }
  if (code === 'E_NO_CAMERA_PERMISSION') {
    return {
      kind: 'camera_permission',
      title: 'Camera access is off',
      message: 'Allow Occasio to use the camera in Settings, then come back and take a photo.',
    };
  }
  return {
    kind: 'other',
    title: 'That photo did not work',
    message: 'Something went wrong while getting it. Try again, or pick a different photo.',
  };
}

/** Only a switched-off permission can be fixed from Settings. */
export function canFixInSettings(problem: PhotoProblem): boolean {
  return problem.kind === 'library_permission' || problem.kind === 'camera_permission';
}
