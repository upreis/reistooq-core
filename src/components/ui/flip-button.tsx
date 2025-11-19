import { useState } from 'react'
import { motion } from 'framer-motion'

export function FlipButton({ 
  text1, 
  text2,
  onClick,
  isFlipped,
}: {
  text1: string;
  text2: string;
  onClick?: () => void;
  isFlipped?: boolean;
}) {
  const [internalShow, setInternalShow] = useState(false)
  const show = isFlipped !== undefined ? isFlipped : internalShow
  
  const flipVariants = {
    one: {
      rotateX: 0,
      // Usar cores sólidas ao invés de HSL para evitar erros de animação
    },
    two: {
      rotateX: 180,
      // Usar cores sólidas ao invés de HSL para evitar erros de animação
    },
  }

  const handleClick = () => {
    if (isFlipped === undefined) {
      setInternalShow(!internalShow)
    }
    onClick?.()
  }

  return (
    <div className="w-full">
      <motion.button
        className={`w-full h-10 cursor-pointer px-3 font-medium shadow-sm border text-sm transition-colors ${
          show 
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        style={{
          borderRadius: 'var(--radius)',
        }}
        onClick={handleClick}
        animate={show ? 'two' : 'one'}
        variants={flipVariants}
        transition={{ duration: 0.05, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{ rotateX: show ? 180 : 0 }}
          transition={{ duration: 0.05, type: 'spring' }}
        >
          {show ? text1 : text2}
        </motion.div>
        <motion.div
          animate={{ rotateX: show ? 0 : -180 }}
          transition={{ duration: 0.05, type: 'spring' }}
          className="absolute inset-0"
        ></motion.div>
      </motion.button>
    </div>
  )
}
