import { useState, useEffect, useRef } from 'react';
import { clone } from 'lodash';

// from https://github.com/Hoishin/use-nodecg/blob/master/src/use-replicant.ts
export const useReplicant = (replicantName, initialValue, options, onChange) => {
	const [value, updateValue] = useState(initialValue);
	const onChangeHandler = useRef(null);
	const replicantOptions = options && {
		defaultValue: options.defaultValue,
		persistent: options.persistent,
		schemaPath: options.schemaPath,
	};
	
	if (onChange) onChangeHandler.current = onChange;

	const replicant = options && options.namespace ? nodecg.Replicant(
    replicantName,
    options.namespace,
    replicantOptions,
  ) : nodecg.Replicant(replicantName, replicantOptions);

	const changeHandler = (newValue) => {
		if (newValue === undefined) return;
			
		onChangeHandler.current?.(newValue);

		updateValue((oldValue) => {
			if (newValue !== oldValue) {
				return newValue;
			}

			// replicant.value has always the same reference. Cloning to cause re-rendering
			return clone(newValue);
		});
	};

	useEffect(() => {
		replicant.on('change', changeHandler);

		return () => {
			replicant.removeListener('change', changeHandler);
		};
	}, [replicant]);

	return [
		value,
		(newValue) => {
			replicant.value = newValue;
		},
	];
};

// from https://github.com/Hoishin/use-nodecg/blob/master/src/use-listen-for.ts
export const useListenFor = (messageName, handler, options) => {
	useEffect(() => {
		if (options && options.bundle) {
			nodecg.listenFor(messageName, options.bundle, handler);

			return () => {
				nodecg.unlisten(messageName, options.bundle, handler);
			};
		}

		nodecg.listenFor(messageName, handler);

		return () => {
			nodecg.unlisten(messageName, handler);
		};
	}, [handler, messageName, options]);
};

export function useOnMount(callback) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    const onDismount = savedCallback.current?.();

    return () => {
      if (onDismount) onDismount();
    };
  }, []);
}