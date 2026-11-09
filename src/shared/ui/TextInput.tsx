import { forwardRef } from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';

/** What a ref to the input holds (`useRef<TextInputHandle>`), so callers never import it from react-native. */
export type TextInputHandle = RNTextInput;

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function LockedTextInput(
    {
      allowFontScaling: _allowFontScaling,
      maxFontSizeMultiplier: _maxFontSizeMultiplier,
      ...props
    },
    ref,
  ) {
    return (
      <RNTextInput
        {...props}
        ref={ref}
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
      />
    );
  },
);
