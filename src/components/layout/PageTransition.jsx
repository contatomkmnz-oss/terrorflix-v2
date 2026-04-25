import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Tab roots — transition lateral (como nativo)
const TAB_ROUTES = ['/Home', '/Browse', '/Search', '/MyList', '/Subscription'];
function isStackPath(pathname) {
  return (
    pathname.startsWith('/Player') ||
    pathname.startsWith('/player') ||
    pathname.startsWith('/SeriesDetail') ||
    pathname.startsWith('/seriesdetail') ||
    pathname.startsWith('/series/')
  );
}

function getTransitionType(pathname) {
  if (isStackPath(pathname)) return 'stack';
  if (TAB_ROUTES.some(r => pathname.startsWith(r))) return 'tab';
  return 'fade';
}

const variants = {
  tab: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  stack: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const type = getTransitionType(location.pathname);
  const v = variants[type];

  return (
    <motion.div
      key={location.pathname}
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}