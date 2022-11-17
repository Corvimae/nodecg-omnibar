import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useListenFor, useReplicant } from '../../lib/hooks';
import { BUNDLE_NAME, createDefaultReplicantState } from '../../lib/utils';
import { OmnibarItem } from './OmnibarItem';

const TRANSITION_DURATION_MS = 500;

export const OmnibarApp = () => {
  const [factories, setFactories] = useState({});
  const activeFactorySet = useRef({});
  const activeItemsRef = useRef();
  const [omnibarState, setOmnibarState] = useReplicant('nodecg-omnibar', createDefaultReplicantState(), { namespace: BUNDLE_NAME });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeItem, setActiveItem] = useState([]);
  const [pendingItem, setPendingItem] = useState([]);
  const [shouldCleanupTransition, setShouldCleanupTransition] = useState(true);
  const hasInitialized = useRef(false);

  const registerOmnibarItem = useCallback((itemName, callback) => {
    const updatedFactorySet = {
      ...activeFactorySet.current,
      [itemName]: callback,
    };

    setFactories(updatedFactorySet);
    
    activeFactorySet.current = updatedFactorySet;
  }, [factories]);

  global.omnibar = {
    register: registerOmnibarItem,
    useReplicant,
    useListenFor,
    useCallback,
    useMemo,
    useState,
    useEffect,
    useRef,
  };

  useEffect(() => {
    if (!hasInitialized.current && omnibarState.carouselQueue.length !== 0) {
      const currentIndex = omnibarState.carouselQueue.findIndex(({ id }) => id === omnibarState.activeCarouselItemId);
      const startingItem = omnibarState.carouselQueue[currentIndex];
      setActiveItem(startingItem);

      hasInitialized.current = true;

      return;
    }

    if (!shouldCleanupTransition) return;

    setActiveItem(pendingItem);

    setPendingItem(null);
    setShouldCleanupTransition(false);
    activeItemsRef.current.style.top = null;
  }, [omnibarState.activeCarouselItemId, omnibarState.carouselQueue, shouldCleanupTransition, pendingItem]);

  const activeOverlayItem = useMemo(() => {
    if (!omnibarState.activeOverlayItemId) return null;

    return omnibarState.overlayQueue.find(({ id }) => id === omnibarState.activeOverlayItemId);
  }, [omnibarState.overlayQueue, omnibarState.activeOverlayItemId]);

  useListenFor('transitionBetweenItems', ({ pendingItemId }) => { 
    const pendingItemFromServer = omnibarState.carouselQueue.find(({ id }) => id === pendingItemId);

    if (!pendingItemFromServer) return;

    if (pendingItemFromServer.id !== activeItem.id) {
      setPendingItem(pendingItemFromServer);
    } else {
      return;
    }

    setIsTransitioning(true);

    const transitionAnimation = activeItemsRef.current.animate([
      { top: 0 },
      { top: '-100%' },
    ], {
      easing: 'ease-in-out',
      duration: TRANSITION_DURATION_MS,
    });
    
    const onFinish = () => {
      setIsTransitioning(false);
      setShouldCleanupTransition(true);
      activeItemsRef.current.style.top = '-100%';
      transitionAnimation.removeEventListener('finish', onFinish);
    };

    transitionAnimation.addEventListener('finish', onFinish, { once: true });
  }, { namespace: BUNDLE_NAME });
  
  return (
    <Container>
      <ActiveItems ref={activeItemsRef}>
        <OmnibarItem 
          key={activeItem.id} 
          config={activeItem}
          isActive={omnibarState.activeCarouselItemId === activeItem.id}
          isLocked={omnibarState.lockedItemId === activeItem.id}
          isTransitioning={isTransitioning}
          factories={factories} 
        />
        {pendingItem && (
          <OmnibarItem 
            key={pendingItem.id} 
            config={pendingItem}
            isActive={omnibarState.activeCarouselItemId === pendingItem.id}
            isLocked={omnibarState.lockedItemId === pendingItem.id}
            isTransitioning={isTransitioning}
            factories={factories} 
          />
        )}
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
`;

const OverlayContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
`;                                                                                                                