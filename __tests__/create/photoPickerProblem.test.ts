import {
  canFixInSettings,
  describePickerError,
  isPickerCancelled,
} from '../../src/features/create/domain/photoPickerProblem';

describe('describePickerError', () => {
  it('says nothing when the person simply closed the picker', () => {
    expect(isPickerCancelled({ code: 'E_PICKER_CANCELLED' })).toBe(true);
    expect(describePickerError({ code: 'E_PICKER_CANCELLED' })).toBeNull();
  });

  it('tells a switched-off photo or camera permission apart, and says how to fix it', () => {
    const library = describePickerError({ code: 'E_NO_LIBRARY_PERMISSION', message: 'User did not grant library permission.' });
    const camera = describePickerError({ code: 'E_NO_CAMERA_PERMISSION' });

    expect(library).toMatchObject({ kind: 'library_permission' });
    expect(camera).toMatchObject({ kind: 'camera_permission' });
    expect(library?.message).toMatch(/Settings/);
    expect(camera?.message).toMatch(/camera/i);
    // Never shows the library's own wording.
    expect(library?.message).not.toMatch(/User did not grant/);
  });

  it('gives anything else a plain message instead of the raw error', () => {
    const other = describePickerError(new Error('E_PICKER_FAILED_SOMETHING native stack trace'));
    expect(other).toMatchObject({ kind: 'other' });
    expect(other?.message).not.toMatch(/native|stack|E_/);
    expect(describePickerError('weird')).toMatchObject({ kind: 'other' });
    expect(describePickerError(undefined)).toMatchObject({ kind: 'other' });
  });

  it('only offers Settings when a permission is what is missing', () => {
    expect(canFixInSettings(describePickerError({ code: 'E_NO_LIBRARY_PERMISSION' })!)).toBe(true);
    expect(canFixInSettings(describePickerError({ code: 'E_NO_CAMERA_PERMISSION' })!)).toBe(true);
    expect(canFixInSettings(describePickerError(new Error('x'))!)).toBe(false);
  });

  it('keeps the wording calm: no exclamation marks, no blame', () => {
    for (const code of ['E_NO_LIBRARY_PERMISSION', 'E_NO_CAMERA_PERMISSION', 'other']) {
      const problem = describePickerError({ code })!;
      expect(problem.title + problem.message).not.toMatch(/!/);
      expect(problem.message).not.toMatch(/you (forgot|failed|must)/i);
    }
  });
});
