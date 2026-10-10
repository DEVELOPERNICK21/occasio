import { useCallback, useEffect, useState } from 'react';
import { checkDateOfBirth } from '../data/ageRepository';
import { readAgeState, writeAgeBlocked } from '../data/ageStorage';
import { AGE_COPY, isOldEnough, parseDateOfBirth, type DobInput } from '../domain/ageGate';

export type AgeGateStatus = 'loading' | 'needed' | 'passed' | 'blocked';

/** First-run gate: nothing is collected until the 13+ check has passed. */
export function useAgeGate() {
  const [status, setStatus] = useState<AgeGateStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let active = true;
    void readAgeState().then((state) => {
      if (!active) return;
      setStatus(
        state.status === 'confirmed' ? 'passed' : state.status === 'blocked' ? 'blocked' : 'needed',
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = useCallback(async (input: DobInput) => {
    setError(null);
    const dob = parseDateOfBirth(input);
    if (!dob) {
      setError(AGE_COPY.invalid);
      return;
    }
    // Too young: block right here. The date is never sent to the server, so no
    // information about a child leaves the device.
    if (!isOldEnough(dob)) {
      await writeAgeBlocked();
      setStatus('blocked');
      return;
    }
    setIsChecking(true);
    const result = await checkDateOfBirth(dob);
    setIsChecking(false);
    if (result === 'passed') setStatus('passed');
    else if (result === 'blocked') setStatus('blocked');
    else setError(AGE_COPY.offline);
  }, []);

  return { status, error, isChecking, submit };
}
