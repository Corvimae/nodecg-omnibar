import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useListenFor, useOnMount, useReplicant } from '../../lib/hooks';
import { BUNDLE_NAME, createDefaultReplicantState } from '../../lib/utils';
import { DashboardItem } from './DashboardItem';

export const DashboardApp = () => {
  const [omnibarState] = useReplicant('nodecg-omnibar', createDefaultReplicantState(), { namespace: BUNDLE_NAME });
  const [omnibarModules] = useReplicant('nodecg-omnibar-modules', [], { namespace: BUNDLE_NAME });
  const [activeProgressPercent, setActiveProgressPercent] = useState(0);
  const syncOffset = useRef(0);

  const sortedItems = useMemo(() => {
    const startingIndex = omnibarState.carouselQueue.findIndex(({ id }) => omnibarState.activeCarouselItemId === id);

    if (startingIndex === -1) return omnibarState.carouselQueue;

    return [
      ...omnibarState.carouselQueue.slice(startingIndex, omnibarState.carouselQueue.length),
      ...omnibarState.carouselQueue.slice(0, startingIndex),
    ];
  }, [omnibarState.carouselQueue, omnibarState.activeCarouselItemId]);

  const updateCompletionPercent = useCallback(() => {
    const timeUntilCompletion = omnibarState.nextTransitionTime - Date.now() + syncOffset.current;
    const percentage = (omnibarState.activeCarouselItemDuration - timeUntilCompletion) / omnibarState.activeCarouselItemDuration;

    setActiveProgressPercent(Math.max(0, percentage));
  }, [omnibarState.nextTransitionTime, omnibarState.activeCarouselItemDuration]);

  useListenFor('transitionScheduled', ({ time }) => {
    syncOffset.current = Date.now() - time;
  }, { namespace: BUNDLE_NAME });

  useEffect(() => {
    const intervalId = setInterval(updateCompletionPercent, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateCompletionPercent]);
  
  return (
    <Container>
      {omnibarState.overlayQueue.length > 0 && (
        <OverlayItemsContainer>
          <OverlaysLabel>Active Overlay Queue</OverlaysLabel>
          <ItemList>
            {omnibarState.overlayQueue.map((item, index) => (
              <DashboardItem
                key={item.id}
                config={item}
                omnibarModules={omnibarModules}
                queueIndex={index}
                isActive={omnibarState.activeOverlayItemId === item.id}
                isOverlay
              />
            ))}
          </ItemList>
        </OverlayItemsContainer>
      )}
      <CarouselItemsContainer>
        {omnibarState.lockedItemId !== null && (
          <LockedItemIndicator currentItemLocked={omnibarState.lockedItemId === omnibarState.activeCarouselItemId}/>
        )}
        <ActiveItemIndicator percentage={activeProgressPercent} />
        <ItemList>
          {sortedItems.map((item, index) => (
            <DashboardItem
              key={item.id}
              config={item}
              omnibarModules={omnibarModules}
              queueIndex={index}
              isRequestedNext={omnibarState.requestedNextItemId === item.id}
              isActive={omnibarState.activeCarouselItemId === item.id}
              isLocked={omnibarState.lockedItemId === item.id}
            />
          ))}
        </ItemList>
      </CarouselItemsContainer>
    </Container>
  )
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const CarouselItemsContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const OverlayItemsContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0.25rem;
  padding: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.5);
  background-color: rgba(252, 255, 64, 0.7);
`;

const ActiveItemIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.5);
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0) 10px,
    rgba(0, 0, 0, 0.3) 10px,
    rgba(0, 0, 0, 0.3) 20px
  );

  &:after {
    content: ' ';
    position: absolute;
    left: 0;
    top: 0;
    width: ${({ percentage }) => percentage * 100}%;
    height: 100%;
    background-color: rgba(150, 255, 124, 0.5);
  }
`;

const LockedItemIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3rem;
  background: ${({currentItemLocked }) => currentItemLocked ? '#900' : '#990'};
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0.25rem;
  margin-top: 0.5rem;
`;


const OverlaysLabel = styled.label`
  text-transform: uppercase;
  font-size: 0.875rem;
  color: #333;
  font-weight: 700;
`;