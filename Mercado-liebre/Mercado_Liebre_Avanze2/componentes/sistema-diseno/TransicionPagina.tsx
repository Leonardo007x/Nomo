import React from 'react';
import { motion } from 'framer-motion';

interface TransicionPaginaProps {
  children: React.ReactNode;
}

const variants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    filter: "blur(5px)" 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)" 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    filter: "blur(5px)" 
  }
};

export const TransicionPagina: React.FC<TransicionPaginaProps> = ({ children }) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};