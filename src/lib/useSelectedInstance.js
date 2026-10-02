import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEternalStore } from '../store/useEternalStore.js';

// Every instance-specific page follows the same selection. Explicit links win.
export function useSelectedInstance() {
  const instances = useEternalStore(state => state.instances);
  const selectedId = useEternalStore(state => state.selectedInstanceId);
  const selectInstance = useEternalStore(state => state.selectInstance);
  const [params, setParams] = useSearchParams();
  const requestedId = params.get('instance');
  const id = instances.find(instance => instance.id === requestedId)?.id
    || instances.find(instance => instance.id === selectedId)?.id
    || instances[0]?.id || '';

  useEffect(() => { if (id !== selectedId) selectInstance(id); }, [id, selectedId, selectInstance]);

  function select(id) {
    selectInstance(id);
    if (params.has('instance')) {
      const next = new URLSearchParams(params);
      next.set('instance', id);
      setParams(next, { replace: true });
    }
  }
  return [id, select];
}
