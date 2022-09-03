import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import Handlebars from 'handlebars';

export const DashboardItem = ({ config, omnibarModules, isActive, isLocked, isOverlay, queueIndex }) => {
  const template = useMemo(() => {
    const module = omnibarModules.find(item => item.itemType === config.type);
    
    return module ? Handlebars.compile(module.displayString) : () => '!!!Module missing!!!';
  }, [omnibarModules, config.type]);

  const toggleLock = useCallback(() => {
    nodecg.sendMessage('lockItem', { id: config.id });
  }, [config.id]);

  const prioritizeItem = useCallback(() => {
    nodecg.sendMessage('prioritizeItem', { id: config.id });
  }, [config.id]);

  return (
    <ListItem isActive={isActive}>
      {template(config.data)}
      <ItemActions>
        {!isOverlay && (
          <ActionButton onClick={prioritizeItem} disabled={queueIndex <= 1}>^</ActionButton>
        )}
        {!isOverlay && (
          <ActionButton onClick={toggleLock}>{isLocked ? 'Unlock' : 'Lock'}</ActionButton>
        )}
      </ItemActions>
    </ListItem>
  )
};

const ListItem = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 2rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem;
  background-color: ${({ isActive }) => isActive ?  'rgba(132, 206, 132, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
  border: 1px solid rgba(0, 0, 0, 0.4);
  color: #000;
  box-sizing: border-box;
  margin-bottom: ${({ isActive }) => isActive ? '1rem' : '0.25rem'};
  z-index: 1;
`;

const ActionButton = styled.button`
  font-family: inherit;
  font-size: 0.825rem;
  border: 1px solid #333;
  background-color: #fff;
  color: #333;
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  cursor: pointer;
  box-sizing: border-box;

  &:not(:disabled):hover,
  &:not(:disabled):active {
    background-color: #eaeaea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
`;

const ItemActions = styled.div`
  display: flex;
  flex-direction: row;
  
  & button + button {
    margin-left: 0.125rem;
  }
`;