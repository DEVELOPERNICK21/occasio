import { forwardRef } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

export const Text = forwardRef<RNText, TextProps>(function LockedText(
  {
    allowFontScaling: _allowFontScaling,
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    ...props
  },
  ref,
) {
  return (
    <RNText
      {...props}
      ref={ref}
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
    />
  );
});
