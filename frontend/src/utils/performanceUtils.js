/**
 * React Performance Optimization Utilities
 * 
 * This file contains utilities to prevent unnecessary re-renders in React components.
 * These optimizations help improve app performance by:
 * 
 * 1. useMemo - Memoizes expensive calculations
 * 2. useCallback - Memoizes function references 
 * 3. React.memo - Prevents re-renders of functional components
 * 4. Component-level optimizations for lists and complex UI
 */

import { useMemo, useCallback } from 'react';

/**
 * Custom hook to memoize array operations
 * Useful for filtering, sorting, or mapping large lists
 */
export const useMemoizedArray = (array, dependencies = []) => {
  return useMemo(() => array, dependencies);
};

/**
 * Custom hook to memoize expensive calculations
 */
export const useMemoizedValue = (computeFn, dependencies = []) => {
  return useMemo(computeFn, dependencies);
};

/**
 * Custom hook to memoize event handlers
 */
export const useMemoizedCallback = (callback, dependencies = []) => {
  return useCallback(callback, dependencies);
};

/**
 * HOC to wrap components with React.memo
 * Includes custom comparison function for complex props
 */
export const withMemo = (Component, compareProps) => {
  const MemoizedComponent = React.memo(Component, compareProps);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * Comparison functions for React.memo
 */
export const shallowEqual = (prevProps, nextProps) => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (let key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
};

/**
 * Performance monitoring utilities
 */
export const logRenderCount = (componentName) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} rendered ${renderCount.current} times`);
  }
};

/**
 * Why Did You Render (WDYR) setup
 * Uncomment and configure to debug unnecessary re-renders
 */
/*
if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
  });
}
*/

export default {
  useMemoizedArray,
  useMemoizedValue,
  useMemoizedCallback,
  withMemo,
  shallowEqual,
  logRenderCount
};
