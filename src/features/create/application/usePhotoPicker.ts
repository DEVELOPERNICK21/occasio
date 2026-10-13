import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';
import ImageCropPicker, { type Image } from 'react-native-image-crop-picker';
import { env } from '../../../shared/config/env';
import {
  CARD_PHOTO_CROP_HEIGHT,
  CARD_PHOTO_CROP_WIDTH,
} from '../../../shared/config/media';
import type { SheetCloseReason } from '../../../shared/ui/ActionSheet';
import { colors } from '../../../shared/theme/tokens';
import {
  canFixInSettings,
  describePickerError,
  type PhotoProblem,
} from '../domain/photoPickerProblem';

type PickSource = 'library' | 'camera';

export type PickedPhoto = {
  uri: string;
  fileSizeBytes?: number | null;
};

function cropOptions() {
  const compact = env.useBase64Media;
  return {
    width: compact ? 800 : CARD_PHOTO_CROP_WIDTH,
    height: compact ? 640 : CARD_PHOTO_CROP_HEIGHT,
    cropping: true,
    mediaType: 'photo' as const,
    // Tighter compression when embedding up to 5 photos in Firestore.
    compressImageQuality: compact ? 0.45 : 0.8,
    includeBase64: compact,
    forceJpg: true,
    // The crop screen is a native one, so give it the app's colours: a light bar with
    // dark icons (and matching status and navigation bars), coral where it is active.
    cropperToolbarTitle: 'Crop photo',
    cropperChooseText: 'Use photo',
    cropperCancelText: 'Cancel',
    cropperActiveWidgetColor: colors.accent,
    cropperToolbarColor: colors.surface,
    cropperToolbarWidgetColor: colors.ink,
    cropperStatusBarLight: true,
    cropperNavigationBarLight: true,
    cropperTintColor: colors.accent,
    cropperChooseColor: colors.accent,
    cropperCancelColor: colors.muted,
  };
}

function photoFromCropResult(image: Image): PickedPhoto {
  if (env.useBase64Media && image.data) {
    return {
      uri: `data:image/jpeg;base64,${image.data}`,
      fileSizeBytes: image.size,
    };
  }

  return {
    uri: image.path,
    fileSizeBytes: image.size,
  };
}

async function pickFromSource(
  source: PickSource,
  report: (problem: PhotoProblem) => void,
): Promise<PickedPhoto | null> {
  const options = cropOptions();

  try {
    const image =
      source === 'camera'
        ? await ImageCropPicker.openCamera(options)
        : await ImageCropPicker.openPicker(options);
    return photoFromCropResult(image);
  } catch (error) {
    const problem = describePickerError(error);
    if (problem) report(problem);
    return null;
  }
}

/** Multi-select from the library (no crop — the native picker can't crop several at once). */
async function pickManyFromLibrary(
  maxFiles: number,
  report: (problem: PhotoProblem) => void,
): Promise<PickedPhoto[]> {
  const compact = env.useBase64Media;

  try {
    const images = await ImageCropPicker.openPicker({
      multiple: true,
      maxFiles,
      mediaType: 'photo',
      compressImageMaxWidth: compact ? 800 : CARD_PHOTO_CROP_WIDTH,
      compressImageMaxHeight: compact ? 640 : CARD_PHOTO_CROP_HEIGHT,
      compressImageQuality: compact ? 0.45 : 0.8,
      includeBase64: compact,
      forceJpg: true,
    });
    return images.slice(0, maxFiles).map(photoFromCropResult);
  } catch (error) {
    const problem = describePickerError(error);
    if (problem) report(problem);
    return [];
  }
}

type Ask = { mode: 'one' | 'many'; maxCount: number };
type Pending = Ask & { resolve: (photos: PickedPhoto[]) => void };

/** What the screen needs to draw the source choice: pass it to `PhotoSourceSheet`. */
export type PhotoSourceSheetState = {
  visible: boolean;
  mode: Ask['mode'];
  /** How many more photos can be added. */
  remaining: number;
  onLibrary: () => void;
  onCamera: () => void;
  onClose: (reason: SheetCloseReason) => void;
};

/** What the screen needs to say something went wrong: pass it to `PhotoProblemSheet`. */
export type PhotoProblemSheetState = {
  visible: boolean;
  title: string;
  message: string;
  /** True when a switched-off permission is the cause, so Settings can fix it. */
  canOpenSettings: boolean;
  onOpenSettings: () => void;
  onClose: () => void;
};

/**
 * Gallery or camera, with a fixed 5:4 crop for the card hero. Asking where a photo
 * should come from is our own sheet (see `PhotoSourceSheet`), not the stock dialog;
 * the gallery and the crop screen after it are Android's and iOS's own.
 */
export function usePhotoPicker() {
  const [picking, setPicking] = useState(false);
  const [ask, setAsk] = useState<(Ask & { open: boolean }) | null>(null);
  const [problem, setProblem] = useState<PhotoProblem | null>(null);
  const pending = useRef<Pending | null>(null);

  const open = useCallback(
    (mode: Ask['mode'], maxCount: number) =>
      new Promise<PickedPhoto[]>((resolve) => {
        if (picking || pending.current || maxCount < 1) {
          resolve([]);
          return;
        }
        pending.current = { mode, maxCount, resolve };
        setAsk({ mode, maxCount, open: true });
      }),
    [picking],
  );

  const settle = useCallback((photos: PickedPhoto[]) => {
    const current = pending.current;
    pending.current = null;
    current?.resolve(photos);
  }, []);

  const run = useCallback(
    async (source: PickSource) => {
      const current = pending.current;
      if (!current) return;
      setPicking(true);
      try {
        if (current.mode === 'many' && source === 'library') {
          settle(await pickManyFromLibrary(current.maxCount, setProblem));
        } else {
          const photo = await pickFromSource(source, setProblem);
          settle(photo ? [photo] : []);
        }
      } finally {
        setPicking(false);
      }
    },
    [settle],
  );

  const onClose = useCallback(
    (reason: SheetCloseReason) => {
      setAsk((current) => (current ? { ...current, open: false } : current));
      // A choice keeps the request alive: the picker opens a moment after the sheet is gone.
      if (reason === 'dismiss') settle([]);
    },
    [settle],
  );

  const sheet: PhotoSourceSheetState = {
    visible: ask?.open ?? false,
    mode: ask?.mode ?? 'many',
    remaining: ask?.maxCount ?? 0,
    onLibrary: () => void run('library'),
    onCamera: () => void run('camera'),
    onClose,
  };

  const problemSheet: PhotoProblemSheetState = {
    visible: problem !== null,
    title: problem?.title ?? '',
    message: problem?.message ?? '',
    canOpenSettings: problem ? canFixInSettings(problem) : false,
    onOpenSettings: () => void Linking.openSettings(),
    onClose: () => setProblem(null),
  };

  /** Library allows several photos at once (up to `maxCount`); camera adds one. */
  const pickPhotos = useCallback((maxCount: number) => open('many', maxCount), [open]);

  const pickPhoto = useCallback(
    async (): Promise<PickedPhoto | null> => (await open('one', 1))[0] ?? null,
    [open],
  );

  return { pickPhoto, pickPhotos, picking, sheet, problemSheet };
}
