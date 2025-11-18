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
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
    two: {
      rotateX: 180,
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
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
        className="w-full h-10 cursor-pointer px-3 font-medium shadow-sm border text-sm"
        style={{
          borderRadius: 'var(--radius)',
        }}
        onClick={handleClick}
        animate={show ? 'two' : 'one'}
        variants={flipVariants}
        transition={{ duration: 0.3, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          animate={{ rotateX: show ? 180 : 0 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {show ? text1 : text2}
        </motion.div>
      </motion.button>
    </div>
  )
}
