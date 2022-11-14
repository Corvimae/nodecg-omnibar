import React from 'react';
import styled from 'styled-components';

export const OmnibarItem = ({ config, factories, isActive, isLocked, isTransitioning, isOverlay }) => {
  const Factory = factories[config.type];

  if (!Factory) return null;

  return (
    <OmnibarItemContainer className={config.containerClass} data-id={config.id} data-type={config.type}>
      <Factory 
        id={config.id}
        data={config.data}
        isActive={isActive}
        isLocked={isLocked}
        isTransitioning={isTransitioning}
        isOverlay={isOverlay}
      />
    </OmnibarItemContainer>
  );
}

const OmnibarItemContainer = styled.div`
  display: block;
  width: 100%;
  height: 100%;
`;