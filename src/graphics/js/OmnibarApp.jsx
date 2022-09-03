import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useListenFor, useReplicant } from '../../lib/hooks';
import { BUNDLE_NAME, createDefaultReplicantState } from '../../lib/utils';
import { OmnibarItem } from './OmnibarItem';

const TRANSITION_DURATION_MS = 500;

export const OmnibarApp = () => {
  const [factories, setFactories] = useState({});
  const [omnibarState, setOmnibarState] = useReplicant('nodecg-omnibar', createDefaultReplicantState(), { namespace: BUNDLE_NAME });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeQueue, setActiveQueue] = useState([]);
  const [shouldUpdateActiveQueue, setShouldUpdateActiveQueue] = useState(true);
  const hasInitialized = useRef(false);

  global.registerOmnibarItem = useCallback((itemName, callback) => {
    setFactories({
      ...factories,
      [itemName]: callback,
    });
  }, [factories]);


  useEffect(() => {
    if (!shouldUpdateActiveQueue) return;

    if (!hasInitialized.current && omnibarState.carouselQueue.length === 0) return;

    const currentIndex = omnibarState.carouselQueue.findIndex(({ id }) => id === omnibarState.activeCarouselItemId);
    let nextIndex = currentIndex + 1;
    
    if (currentIndex === omnibarState.carouselQueue.length - 1) nextIndex = 0;
    
    setActiveQueue([
      omnibarState.carouselQueue[currentIndex],
      omnibarState.carouselQueue[nextIndex],
    ]);

    setShouldUpdateActiveQueue(false);
    hasInitialized.current = true;
  }, [omnibarState.activeCarouselItemId, omnibarState.carouselQueue, shouldUpdateActiveQueue]);

  const activeOverlayItem = useMemo(() => {
    if (!omnibarState.activeOverlayItemId) return null;

    return omnibarState.overlayQueue.find(({ id }) => id === omnibarState.activeOverlayItemId);
  }, [omnibarState.overlayQueue, omnibarState.activeOverlayItemId]);

  useListenFor('transitionBetweenItems', () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setIsTransitioning(false);
      setShouldUpdateActiveQueue(true);
    }, TRANSITION_DURATION_MS + 20);
  }, { namespace: BUNDLE_NAME });
  
  useListenFor('updateActiveQueue', () => {
    setShouldUpdateActiveQueue(true);
  }, { namespace: BUNDLE_NAME });
  
  return (
    <Container>
      <ActiveItems isTransitioning={isTransitioning}>
        {activeQueue.map(config => config && (
          <OmnibarItem 
            key={config.id} 
            config={config}
            isActive={omnibarState.activeCarouselItemId === config.id}
            isLocked={omnibarState.lockedItemId === config.id}
            isTransitioning={isTransitioning}
            factories={factories} 
          />
        ))}
      </ActiveItems>
      {activeOverlayItem && (
        <OverlayContainer>
          <OmnibarItem
            config={activeOverlayItem}
            factories={factories}
            isOverlay
            isActive
          />
        </OverlayContainer>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  height: 80px;
  width: 100vw;
  background-color: #212121;
  color: #fff;
  overflow: hidden;
`;

const transitionAnimation = keyframes`
  0% {
    top: 0;
  }

  100% {
    top: -100%;
  }
`;

const ActiveItems = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: ${TRANSITION_DURATION_MS}ms ease-in-out ${({ isTransitioning }) => isTransitioning ? transitionAnimation : null};
  animation-fill-mode: forwards;
`;

const OverlayContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
`;